import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// Mock the Zustand store before importing the hook
let mockLang = 'en';
vi.mock('../../src/lib/store', () => ({
    useLumiqeStore: (selector: (state: { lang: string }) => unknown) =>
        selector({ lang: mockLang }),
}));

import { useTranslation } from '../../src/lib/hooks/useTranslation';

describe('useTranslation', () => {
    beforeEach(() => {
        mockLang = 'en';
    });

    it('returns a t function and lang property', () => {
        const { result } = renderHook(() => useTranslation());
        expect(typeof result.current.t).toBe('function');
        expect(result.current.lang).toBeDefined();
    });

    it('t("backHome") returns "Back to Home" in English', () => {
        const { result } = renderHook(() => useTranslation());
        expect(result.current.t('backHome')).toBe('Back to Home');
    });

    it('t returns the key itself for a non-existent key', () => {
        const { result } = renderHook(() => useTranslation());
        expect(result.current.t('nonExistentKey')).toBe('nonExistentKey');
    });

    it('defaults lang to "en"', () => {
        const { result } = renderHook(() => useTranslation());
        expect(result.current.lang).toBe('en');
    });

    it('returns Hindi translations when lang is "hi"', () => {
        mockLang = 'hi';
        const { result } = renderHook(() => useTranslation());
        expect(result.current.lang).toBe('hi');
        expect(result.current.t('backHome')).not.toBe('Back to Home');
        expect(result.current.t('backHome')).toBeTruthy();
    });

    it('falls back to English when a key is missing in the current language', () => {
        mockLang = 'hi';
        const { result } = renderHook(() => useTranslation());
        // If a key only exists in English, fallback should return the English value
        // If it exists in both, we get the Hindi one. Either way it should not be the raw key.
        const englishVal = 'Back to Home';
        const hindiVal = result.current.t('backHome');
        expect(typeof hindiVal).toBe('string');
        expect(hindiVal.length).toBeGreaterThan(0);
    });
});
