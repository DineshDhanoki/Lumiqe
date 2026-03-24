import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useFetch } from '../../src/lib/hooks/useFetch';

describe('useFetch', () => {
    const originalFetch = globalThis.fetch;

    beforeEach(() => {
        vi.restoreAllMocks();
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
    });

    it('starts with loading=true', () => {
        globalThis.fetch = vi.fn(() => new Promise(() => {})) as unknown as typeof fetch; // never resolves
        const { result } = renderHook(() => useFetch<{ ok: boolean }>('/api/test'));
        expect(result.current.loading).toBe(true);
        expect(result.current.data).toBeNull();
        expect(result.current.error).toBeNull();
    });

    it('sets data on successful fetch', async () => {
        const payload = { items: [1, 2, 3] };
        globalThis.fetch = vi.fn(() =>
            Promise.resolve(new Response(JSON.stringify(payload), { status: 200 })),
        );

        const { result } = renderHook(() => useFetch<typeof payload>('/api/items'));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });
        expect(result.current.data).toEqual(payload);
        expect(result.current.error).toBeNull();
    });

    it('sets error on failed fetch', async () => {
        globalThis.fetch = vi.fn(() =>
            Promise.resolve(
                new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
            ),
        );

        const { result } = renderHook(() => useFetch<unknown>('/api/secret'));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });
        expect(result.current.error).toBe('Unauthorized');
        expect(result.current.data).toBeNull();
    });

    it('does not fetch when skip=true', async () => {
        const fetchSpy = vi.fn() as unknown as typeof fetch;
        globalThis.fetch = fetchSpy;

        const { result } = renderHook(() =>
            useFetch<unknown>('/api/skip', { skip: true }),
        );

        // Give it a tick to settle
        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });
        expect(fetchSpy).not.toHaveBeenCalled();
        expect(result.current.data).toBeNull();
    });

    it('refetch triggers a new fetch', async () => {
        let callCount = 0;
        globalThis.fetch = vi.fn(() => {
            callCount++;
            return Promise.resolve(
                new Response(JSON.stringify({ count: callCount }), { status: 200 }),
            );
        });

        const { result } = renderHook(() => useFetch<{ count: number }>('/api/counter'));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });
        expect(result.current.data?.count).toBe(1);

        act(() => {
            result.current.refetch();
        });

        await waitFor(() => {
            expect(result.current.data?.count).toBe(2);
        });
        expect(callCount).toBe(2);
    });
});
