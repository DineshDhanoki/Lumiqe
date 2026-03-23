import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useModal } from '../../src/lib/hooks/useModal';

describe('useModal', () => {
    it('defaults to closed (isOpen=false)', () => {
        const { result } = renderHook(() => useModal());
        expect(result.current.isOpen).toBe(false);
    });

    it('starts open when initialOpen=true', () => {
        const { result } = renderHook(() => useModal(true));
        expect(result.current.isOpen).toBe(true);
    });

    it('open() sets isOpen to true', () => {
        const { result } = renderHook(() => useModal());
        act(() => {
            result.current.open();
        });
        expect(result.current.isOpen).toBe(true);
    });

    it('close() sets isOpen to false', () => {
        const { result } = renderHook(() => useModal(true));
        act(() => {
            result.current.close();
        });
        expect(result.current.isOpen).toBe(false);
    });

    it('toggle() flips the state', () => {
        const { result } = renderHook(() => useModal());
        expect(result.current.isOpen).toBe(false);

        act(() => {
            result.current.toggle();
        });
        expect(result.current.isOpen).toBe(true);

        act(() => {
            result.current.toggle();
        });
        expect(result.current.isOpen).toBe(false);
    });
});
