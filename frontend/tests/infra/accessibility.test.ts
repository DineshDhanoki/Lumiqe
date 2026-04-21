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
    // Upload dropzone logic lives in the extracted UploadDropzone component
    const analyzePath = path.resolve(
        __dirname, '../../src/components/analyze/UploadDropzone.tsx'
    );
    const source = fs.readFileSync(analyzePath, 'utf-8');

    it('upload area must have role="button" or be a label/button element', () => {
        // The upload drop zone should be keyboard accessible
        expect(source).toMatch(/role=.*button|<label|<button.*[Uu]pload|tabIndex/);
    });
});
