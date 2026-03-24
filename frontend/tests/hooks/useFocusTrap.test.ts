import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFocusTrap } from '../../src/lib/hooks/useFocusTrap';

describe('useFocusTrap', () => {
    it('returns an object with trapRef', () => {
        const { result } = renderHook(() => useFocusTrap());
        expect(result.current).toHaveProperty('trapRef');
    });

    it('trapRef is a React ref object with a current property', () => {
        const { result } = renderHook(() => useFocusTrap());
        expect(result.current.trapRef).toHaveProperty('current');
        // Initially null because no DOM element is attached
        expect(result.current.trapRef.current).toBeNull();
    });

    it('accepts an onClose callback without throwing', () => {
        const onClose = vi.fn();
        const { result } = renderHook(() => useFocusTrap({ onClose }));
        expect(result.current.trapRef).toBeDefined();
    });

    it('works without any options', () => {
        const { result } = renderHook(() => useFocusTrap());
        expect(result.current.trapRef).toBeDefined();
        expect(result.current.trapRef.current).toBeNull();
    });
});
