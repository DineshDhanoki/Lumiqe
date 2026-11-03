/**
 * Lumiqe — Accessibility Tests (Phase 6 TDD).
 *
 * Ensures ARIA labels, keyboard navigation, and screen reader support.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Pricing — accessibility', () => {
    const pricingPath = path.resolve(
        __dirname, '../../src/components/Pricing.tsx'
    );
    const source = fs.readFileSync(pricingPath, 'utf-8');

    it('upgrade button must be disableable for loading state', () => {
        expect(source).toContain('disabled');
    });

    it('checkout error must be rendered as text', () => {
        expect(source).toContain('checkoutError');
    });
});

describe('OutfitDisplay — accessibility', () => {
    const outfitPath = path.resolve(
        __dirname, '../../src/components/OutfitDisplay.tsx'
    );
    const source = fs.readFileSync(outfitPath, 'utf-8');

    it('outfit slots must have text labels, not just emoji', () => {
        // OUTFIT_SLOTS must include a `label` field that screen readers can use
        expect(source).toContain("label: 'Upper'");
        expect(source).toContain("label: 'Shoes'");
    });

    it('must use React.memo for OutfitItemCard', () => {
        expect(source).toContain('React.memo');
    });

    it('must NOT have unoptimized flag on Image', () => {
        expect(source).not.toContain('unoptimized');
    });
});

describe('Dashboard history — pagination', () => {
    // Pagination logic lives in the extracted AnalysisHistory component
    const historyPath = path.resolve(
        __dirname, '../../src/components/dashboard/AnalysisHistory.tsx'
    );
    const source = fs.readFileSync(historyPath, 'utf-8');

    it('must limit displayed history items (not render all)', () => {
        // Should have .slice() or a limit on displayed history
        expect(source).toMatch(/history\.(slice|filter).*\d|HISTORY_DISPLAY_LIMIT|showAll/);
    });
});

describe('Analyze page — upload area', () => {
    const uploadImplementations = [
        '../../src/app/analyze/page.tsx',
        '../../src/components/analyze/UploadDropzone.tsx',
    ];

    it.each(uploadImplementations)('%s uses one native, visibly focused upload control', (relativePath) => {
        const source = fs.readFileSync(path.resolve(__dirname, relativePath), 'utf-8');
        expect(source).toMatch(/<input[^>]*type="file"/);
        expect(source).toMatch(/aria-label=/);
        expect(source).toMatch(/focus-within:/);
        expect(source).not.toContain('role="button"');
    });

    it.each(uploadImplementations)('%s exposes upload errors through a live status region', (relativePath) => {
        const source = fs.readFileSync(path.resolve(__dirname, relativePath), 'utf-8');
        expect(source).toMatch(/aria-live="polite"/);
        expect(source).toMatch(/role="status"/);
    });
});
