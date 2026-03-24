import { describe, it, expect } from 'vitest';
import { cn } from '../../src/lib/utils';

describe('cn (class name merge utility)', () => {
    it('merges multiple class strings', () => {
        const result = cn('px-4', 'py-2');
        expect(result).toContain('px-4');
        expect(result).toContain('py-2');
    });

    it('handles conflicting Tailwind classes by keeping the last one', () => {
        const result = cn('px-4', 'px-8');
        expect(result).toBe('px-8');
    });

    it('handles conditional classes (falsy values)', () => {
        const result = cn('base', false && 'hidden', undefined, null, 'visible');
        expect(result).toContain('base');
        expect(result).toContain('visible');
        expect(result).not.toContain('hidden');
    });

    it('returns an empty string when called with no arguments', () => {
        const result = cn();
        expect(result).toBe('');
    });

    it('handles array inputs', () => {
        const result = cn(['text-sm', 'font-bold']);
        expect(result).toContain('text-sm');
        expect(result).toContain('font-bold');
    });
});
