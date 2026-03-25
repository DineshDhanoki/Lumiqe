import { describe, it, expect } from 'vitest';
import { config } from '../../src/middleware';

/**
 * Helper: converts a Next.js matcher pattern like '/dashboard/:path*'
 * into a regex that behaves the same way.
 *   - ':path*' matches zero or more path segments
 *   - A pattern without ':path*' matches that exact path
 */
function matcherToRegex(pattern: string): RegExp {
    // Escape special regex chars except our placeholder
    let regexStr = pattern.replace(/([.+?^${}()|[\]\\])/g, '\\$1');
    // Replace :path* — matches any trailing segments (including none)
    regexStr = regexStr.replace(/:path\*/g, '.*');
    return new RegExp(`^${regexStr}$`);
}

function isProtected(pathname: string): boolean {
    return config.matcher.some((pattern) => matcherToRegex(pattern).test(pathname));
}

describe('middleware config', () => {
    /* ─── Matcher array structure ─────────────────────────────────── */

    it('exports a matcher array', () => {
        expect(Array.isArray(config.matcher)).toBe(true);
        expect(config.matcher.length).toBeGreaterThan(0);
    });

    it('matcher contains 7 patterns', () => {
        expect(config.matcher).toHaveLength(7);
    });

    it('all matcher entries are strings starting with /', () => {
        for (const pattern of config.matcher) {
            expect(typeof pattern).toBe('string');
            expect(pattern.startsWith('/')).toBe(true);
        }
    });

    /* ─── Protected routes ────────────────────────────────────────── */

    it('/dashboard is protected', () => {
        expect(isProtected('/dashboard/')).toBe(true);
    });

    it('/scan is not protected (removed from matcher)', () => {
        expect(isProtected('/scan/')).toBe(false);
    });

    it('/admin is protected', () => {
        expect(isProtected('/admin/')).toBe(true);
    });

    it('/shopping-agent is protected', () => {
        expect(isProtected('/shopping-agent/')).toBe(true);
    });

    it('/account is protected', () => {
        expect(isProtected('/account/')).toBe(true);
    });

    it('/quiz is protected', () => {
        expect(isProtected('/quiz/')).toBe(true);
    });

    it('/wishlist is protected', () => {
        expect(isProtected('/wishlist/')).toBe(true);
    });

    it('/wardrobe is protected', () => {
        expect(isProtected('/wardrobe/')).toBe(true);
    });

    /* ─── Nested routes ───────────────────────────────────────────── */

    it('/dashboard/history is protected (nested)', () => {
        expect(isProtected('/dashboard/history')).toBe(true);
    });

    it('/shopping-agent/results/123 is protected (deeply nested)', () => {
        expect(isProtected('/shopping-agent/results/123')).toBe(true);
    });

    /* ─── Public routes not matched ───────────────────────────────── */

    it('/ is not protected', () => {
        expect(isProtected('/')).toBe(false);
    });

    it('/feed is not protected', () => {
        expect(isProtected('/feed')).toBe(false);
    });

    it('/analyze is not protected', () => {
        expect(isProtected('/analyze')).toBe(false);
    });

    it('/results is not protected', () => {
        expect(isProtected('/results')).toBe(false);
    });

    /* ─── Matcher config patterns ─────────────────────────────────── */

    it('matcher includes /dashboard/:path*', () => {
        expect(config.matcher).toContain('/dashboard/:path*');
    });

    it('matcher includes /wishlist/:path*', () => {
        expect(config.matcher).toContain('/wishlist/:path*');
    });
});
