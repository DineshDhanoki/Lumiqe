/**
 * Lumiqe — Share & Referral Tracking Tests (Phase 5 TDD).
 *
 * Share buttons must include UTM parameters for analytics tracking.
 * Referral URLs must include UTM source attribution.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Share buttons — UTM tracking', () => {
    const sharePath = path.resolve(
        __dirname, '../../src/app/share/[token]/SharePageClient.tsx'
    );
    const source = fs.readFileSync(sharePath, 'utf-8');

    it('WhatsApp share must include utm_source parameter', () => {
        expect(source).toContain('utm_source');
    });

    it('Twitter share must use buildShareUrl with tracking', () => {
        // The twitter/X share should use buildShareUrl() which adds UTM params
        const twitterSection = source.slice(
            source.indexOf('twitter.com/intent')
        );
        expect(twitterSection).toContain('buildShareUrl');
    });

    it('share URL builder must add utm_medium=social', () => {
        expect(source).toContain('utm_medium');
    });
});

describe('Referral API — UTM tracking', () => {
    const referralApiPath = path.resolve(
        __dirname, '../../../backend/app/api/referral.py'
    );
    const source = fs.readFileSync(referralApiPath, 'utf-8');

    it('backend referral URL must include utm_source=referral', () => {
        expect(source).toContain('utm_source=referral');
    });

    it('backend referral URL must include utm_medium', () => {
        expect(source).toContain('utm_medium');
    });
});
