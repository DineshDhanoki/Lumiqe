import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Lightweight internal-link regression guard.
 *
 * A hard-coded internal `href="/..."` in the app is only valid when a matching
 * route exists under `src/app`. This test walks the real route tree and the real
 * JSX, so a CTA that points at a page nobody created (the `/upgrade` class of
 * bug) fails CI instead of silently routing users to the 404 page.
 *
 * `KNOWN_DEAD_LINKS` is a ratchet baseline: the links below are tracked
 * separately, so they must not be re-introduced *or* quietly extended. Remove an
 * entry once its page ships; never add one without a tracking issue.
 */
const KNOWN_DEAD_LINKS: Record<string, string> = {
    '/contact': 'Footer.tsx — tracked separately (no legal/contact page yet)',
    '/privacy': 'Footer.tsx, SignInModal.tsx — tracked separately (no legal page yet)',
    '/science': 'Footer.tsx — tracked separately (no science page yet)',
    '/terms': 'Footer.tsx, SignInModal.tsx — tracked separately (no legal page yet)',
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

/** Every routable path the App Router exposes (page or route handler). */
export function collectRoutePatterns(appDir: string = APP_DIR): string[] {
    const patterns: string[] = [];
    for (const file of walk(appDir)) {
        const base = path.basename(file);
        if (base !== 'page.tsx' && base !== 'route.ts') continue;
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

/** True when a static href resolves to a real route (exact, dynamic, or parent). */
export function routeExists(href: string, patterns: string[]): boolean {
    const clean = href.length > 1 ? href.replace(/\/+$/, '') : href;
    return patterns.some((pattern) => {
        if (pattern === clean) return true;
        const regex = new RegExp('^/' + pattern.split('/').filter(Boolean).map(segmentToRegex).join('/') + '$');
        if (regex.test(clean)) return true;
        // A parent path is reachable when a child route exists below it.
        return clean !== '/' && pattern.startsWith(clean + '/');
    });
}

/** All hard-coded internal hrefs in the JSX/TS source, with the files that use them. */
export function collectInternalHrefs(srcDir: string = SRC_DIR): Map<string, string[]> {
    const hrefs = new Map<string, string[]>();
    for (const file of walk(srcDir)) {
        if (!file.endsWith('.tsx') && !file.endsWith('.ts')) continue;
        const source = fs.readFileSync(file, 'utf8');
        for (const match of source.matchAll(/href="(\/[^"#?]*)"/g)) {
            const href = match[1];
            if (!href.startsWith('/')) continue;
            const files = hrefs.get(href) ?? [];
            files.push(path.relative(FRONTEND_ROOT, file));
            hrefs.set(href, files);
        }
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
    });

    it('has no hard-coded internal link outside the tracked baseline', () => {
        const dead = findDeadLinks(collectInternalHrefs(), patterns);
        const unexpected = dead.filter(({ href }) => !(href in KNOWN_DEAD_LINKS));
        const stale = Object.keys(KNOWN_DEAD_LINKS).filter(
            (href) => !dead.some((entry) => entry.href === href),
        );

        expect(unexpected, `Dead internal links must point at a real route:\n${
            unexpected.map(({ href, files }) => `  ${href} <- ${files.join(', ')}`).join('\n')
        }`).toEqual([]);

        // Informational only: a shipped page should be dropped from the baseline.
        if (stale.length > 0) {
            console.warn(`internal-link baseline is stale for: ${stale.join(', ')} — remove those entries.`);
        }
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
