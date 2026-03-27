/**
 * Lumiqe — Account Page Tests (Phase 1 TDD).
 *
 * Ensures no hardcoded fake metrics are displayed to users.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const accountPageSource = fs.readFileSync(
    path.resolve(__dirname, '../../src/app/account/page.tsx'),
    'utf-8'
);

describe('AccountPage — No fake metrics', () => {
    it('must not contain hardcoded "92%" style rating', () => {
        // The "92%" was a fake metric that misleads users
        expect(accountPageSource).not.toContain('>92%<');
        expect(accountPageSource).not.toMatch(/\b92%/);
    });

    it('must not contain hardcoded "14" saved outfits count', () => {
        // The "14" was a fabricated number with no real data behind it
        // Check for standalone "14" in a div (not as part of other numbers)
        expect(accountPageSource).not.toMatch(/>14<\/div>/);
    });

    it('should show "Coming soon" for unimplemented metrics', () => {
        expect(accountPageSource).toContain('Coming soon');
    });
});
