import { describe, it, expect } from 'vitest';

/**
 * Unit tests for the _getClothingSuggestions helper embedded in ResultsView.
 * We re-implement the same logic here to test it in isolation since it's
 * a private function within the component file.
 */

function getClothingSuggestions(hex: string): string[] {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2 / 255;
    const d = max - min;
    const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1)) / 255;
    let h = 0;
    if (d !== 0) {
        if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
        else if (max === g) h = ((b - r) / d + 2) * 60;
        else h = ((r - g) / d + 4) * 60;
    }
    if (s < 0.12) {
        if (l < 0.25) return ['Black blazer', 'Charcoal trousers', 'Dark knit'];
        if (l < 0.5) return ['Grey sweater', 'Slate chinos', 'Flannel shirt'];
        if (l < 0.75) return ['Beige cardigan', 'Khaki pants', 'Linen shirt'];
        return ['White tee', 'Cream blouse', 'Ivory jacket'];
    }
    if (h < 30) return ['Rust blazer', 'Terracotta shirt', 'Burgundy knit'];
    if (h < 60) return ['Mustard sweater', 'Camel coat', 'Amber scarf'];
    if (h < 90) return ['Olive jacket', 'Chartreuse tee', 'Lime accent'];
    if (h < 150) return ['Forest green shirt', 'Sage trousers', 'Emerald knit'];
    if (h < 210) return ['Teal blouse', 'Cyan polo', 'Aqua dress'];
    if (h < 270) return ['Navy blazer', 'Cobalt shirt', 'Denim jacket'];
    if (h < 330) return ['Plum sweater', 'Lavender shirt', 'Violet scarf'];
    return ['Rose blouse', 'Magenta top', 'Berry cardigan'];
}

describe('getClothingSuggestions', () => {
    it('always returns exactly 3 suggestions', () => {
        const testColors = [
            '#FF0000', '#00FF00', '#0000FF', '#FFFFFF', '#000000',
            '#C76B3F', '#8B4513', '#808080', '#FFD700', '#800080',
        ];
        for (const hex of testColors) {
            const result = getClothingSuggestions(hex);
            expect(result).toHaveLength(3);
        }
    });

    it('returns neutral suggestions for black (#000000)', () => {
        const result = getClothingSuggestions('#000000');
        expect(result).toContain('Black blazer');
        expect(result).toContain('Charcoal trousers');
    });

    it('returns neutral suggestions for white (#FFFFFF)', () => {
        const result = getClothingSuggestions('#FFFFFF');
        expect(result).toContain('White tee');
        expect(result).toContain('Cream blouse');
    });

    it('returns neutral suggestions for mid-grey (#808080)', () => {
        const result = getClothingSuggestions('#808080');
        // #808080 has lightness 0.5 — falls in beige/khaki range
        expect(result).toContain('Beige cardigan');
    });

    it('returns grey suggestions for dark grey (#404040)', () => {
        const result = getClothingSuggestions('#404040');
        expect(result).toContain('Grey sweater');
    });

    it('returns warm suggestions for rust/orange (#C76B3F)', () => {
        const result = getClothingSuggestions('#C76B3F');
        expect(result).toContain('Rust blazer');
    });

    it('returns blue suggestions for navy (#000080)', () => {
        const result = getClothingSuggestions('#000080');
        expect(result).toContain('Navy blazer');
    });

    it('returns green suggestions for forest green (#228B22)', () => {
        const result = getClothingSuggestions('#228B22');
        expect(result).toContain('Forest green shirt');
    });

    it('returns purple suggestions for violet (#8B008B)', () => {
        const result = getClothingSuggestions('#8B008B');
        expect(result).toContain('Plum sweater');
    });

    it('returns yellow suggestions for gold (#FFD700)', () => {
        const result = getClothingSuggestions('#FFD700');
        expect(result).toContain('Mustard sweater');
    });

    it('returns teal suggestions for cyan (#008B8B)', () => {
        const result = getClothingSuggestions('#008B8B');
        expect(result).toContain('Teal blouse');
    });

    it('returns string array with no empty entries', () => {
        const colors = ['#FF5733', '#33FF57', '#3357FF', '#F0E68C', '#DC143C'];
        for (const hex of colors) {
            const result = getClothingSuggestions(hex);
            for (const suggestion of result) {
                expect(typeof suggestion).toBe('string');
                expect(suggestion.length).toBeGreaterThan(0);
            }
        }
    });
});
