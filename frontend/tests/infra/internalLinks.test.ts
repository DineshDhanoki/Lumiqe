import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

/**
 * Lightweight internal-link regression guard.
 *
 * A hard-coded internal JSX href is only valid when a matching page exists
 * under `src/app`. This catches CTAs that would send users to a 404 page.
 *
 * `KNOWN_DEAD_LINKS` is a ratchet baseline: the links below are tracked
 * separately. Both the path and its existing source locations are fixed, so
 * adding another CTA to a known dead path fails too. Remove an entry once its
 * page ships; never add one without a tracking issue.
 */
const KNOWN_DEAD_LINKS: Record<string, string[]> = {
    '/contact': ['src/components/Footer.tsx'],
    '/privacy': ['src/components/Footer.tsx', 'src/components/SignInModal.tsx'],
    '/science': ['src/components/Footer.tsx'],
    '/terms': ['src/components/Footer.tsx', 'src/components/SignInModal.tsx'],
};

const FRONTEND_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC_DIR = path.join(FRONTEND_ROOT, 'src');
const APP_DIR = path.join(SRC_DIR, 'app');

function walk(dir: string): string[] {
    const out: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) out.push(...walk(full));
        else out.push(full);
    }
    return out;
}

/** Every page the App Router exposes. API route handlers are not CTA pages. */
export function collectRoutePatterns(appDir: string = APP_DIR): string[] {
    const patterns: string[] = [];
    for (const file of walk(appDir)) {
        const base = path.basename(file);
        if (base !== 'page.tsx') continue;
        const rel = path.relative(appDir, path.dirname(file));
        const segments = rel === '' ? [] : rel.split(path.sep);
        // Route groups `(marketing)` and parallel slots `@modal` do not appear in the URL.
        const urlSegments = segments.filter((s) => !s.startsWith('(') && !s.startsWith('@'));
        patterns.push('/' + urlSegments.join('/'));
    }
    return [...new Set(patterns)];
}

function segmentToRegex(segment: string): string {
    if (segment.startsWith('[...') && segment.endsWith(']')) return '.+';
    if (segment.startsWith('[[...') && segment.endsWith(']]')) return '.*';
    if (segment.startsWith('[') && segment.endsWith(']')) return '[^/]+';
    return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** True when a static href resolves to a page (exact or dynamic). */
export function routeExists(href: string, patterns: string[]): boolean {
    const clean = href.length > 1 ? href.replace(/\/+$/, '') : href;
    return patterns.some((pattern) => {
        if (pattern === clean) return true;
        const regex = new RegExp('^/' + pattern.split('/').filter(Boolean).map(segmentToRegex).join('/') + '$');
        return regex.test(clean);
    });
}

/** Literal internal JSX hrefs, including quoted and expression-wrapped strings. */
export function collectInternalHrefs(srcDir: string = SRC_DIR): Map<string, string[]> {
    const hrefs = new Map<string, string[]>();
    for (const file of walk(srcDir)) {
        if (!file.endsWith('.tsx') && !file.endsWith('.ts')) continue;
        const source = fs.readFileSync(file, 'utf8');
        const syntaxTree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
        const visit = (node: ts.Node) => {
            if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
                for (const prop of node.attributes.properties) {
                    if (!ts.isJsxAttribute(prop) || !ts.isIdentifier(prop.name) || prop.name.text !== 'href') continue;
                    const initializer = prop.initializer;
                    const expression = initializer && ts.isJsxExpression(initializer) ? initializer.expression : undefined;
                    const value = initializer && ts.isStringLiteral(initializer)
                        ? initializer.text
                        : expression && (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression))
                            ? expression.text
                            : null;
                    if (!value?.startsWith('/') || value.startsWith('//')) continue;
                    const href = value.split(/[?#]/, 1)[0] || '/';
                    const files = hrefs.get(href) ?? [];
                    files.push(path.relative(FRONTEND_ROOT, file));
                    hrefs.set(href, files);
                }
            }
            ts.forEachChild(node, visit);
        };
        visit(syntaxTree);
    }
    return hrefs;
}

export function findDeadLinks(
    hrefs: Map<string, string[]>,
    patterns: string[],
): { href: string; files: string[] }[] {
    return [...hrefs.entries()]
        .filter(([href]) => !routeExists(href, patterns))
        .map(([href, files]) => ({ href, files }));
}

describe('internal link regression guard', () => {
    const patterns = collectRoutePatterns();

    it('discovers the App Router tree', () => {
        expect(patterns).toContain('/');
        expect(patterns).toContain('/pricing');
        expect(patterns.some((p) => p.startsWith('/seasons/['))).toBe(true);
    });

    it('classifies real, dynamic and missing routes correctly', () => {
        // The guard must be able to fail — otherwise it proves nothing.
        expect(routeExists('/pricing', patterns)).toBe(true);
        expect(routeExists('/upgrade', patterns)).toBe(false);
        expect(routeExists('/seasons/winter', patterns)).toBe(true);
        expect(routeExists('/pricing/', patterns)).toBe(true);
        expect(patterns).not.toContain('/quiz');
        expect(routeExists('/quiz', patterns)).toBe(false);
        expect(routeExists('/api/image-proxy', patterns)).toBe(false);
    });

    it('recognizes common hard-coded JSX href forms', () => {
        const fixtureDir = fs.mkdtempSync(path.join(FRONTEND_ROOT, 'link-guard-fixture-'));
        try {
            fs.writeFileSync(path.join(fixtureDir, 'Links.tsx'), `
                <><a href="/upgrade" /><a href='/quiz' />
                <a href={'/missing?source=cta'} /><a href={\`/another#section\`} />
                <a href="https://example.com" /><a href="//example.com/path" /></>
            `);
            expect([...collectInternalHrefs(fixtureDir).keys()].sort()).toEqual([
                '/another', '/missing', '/quiz', '/upgrade',
            ]);
        } finally {
            fs.rmSync(fixtureDir, { recursive: true, force: true });
        }
    });

    it('has exactly the tracked dead links at their original locations', () => {
        const dead = findDeadLinks(collectInternalHrefs(), patterns);
        const actual = Object.fromEntries(dead.map(({ href, files }) => [href, files.sort()]));
        expect(actual).toEqual(KNOWN_DEAD_LINKS);
    });

    it('keeps the premium CTA pointed at the canonical pricing route', () => {
        const source = fs.readFileSync(
            path.join(SRC_DIR, 'components', 'SubscriptionModal.tsx'),
            'utf8',
        );
        expect(source).toContain('href="/pricing"');
        expect(source).not.toContain('href="/upgrade"');
    });
});
