import { useState, useEffect, useCallback, useRef } from 'react';

interface UseFetchResult<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

function useFetch<T>(
    url: string,
    options?: RequestInit & { skip?: boolean },
): UseFetchResult<T> {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState<boolean>(!options?.skip);
    const [error, setError] = useState<string | null>(null);
    const [fetchCount, setFetchCount] = useState(0);
    const controllerRef = useRef<AbortController | null>(null);

    const skip = options?.skip ?? false;

    const refetch = useCallback(() => {
        setFetchCount((c) => c + 1);
    }, []);

    useEffect(() => {
        if (skip) {
            setLoading(false);
            return;
        }

        const controller = new AbortController();
        controllerRef.current = controller;

        async function doFetch(): Promise<void> {
            setLoading(true);
            setError(null);

            try {
                const { skip: _skip, ...fetchOptions } = options ?? {};
                const response = await fetch(url, {
                    ...fetchOptions,
                    signal: controller.signal,
                });

                if (!response.ok) {
                    const body = await response.text();
                    let message = `Request failed with status ${response.status}`;
                    try {
                        const parsed = JSON.parse(body);
                        if (parsed.error) {
                            message = parsed.error;
                        } else if (parsed.detail) {
                            message = parsed.detail;
                        }
                    } catch {
                        // Use default message
                    }
                    setError(message);
                    setData(null);
                    return;
                }

                const result: T = await response.json();
                setData(result);
            } catch (err: unknown) {
                if (err instanceof DOMException && err.name === 'AbortError') {
                    return;
                }
                const message =
                    err instanceof Error ? err.message : 'An unknown error occurred';
                setError(message);
                setData(null);
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        doFetch();

        return () => {
            controller.abort();
        };
    }, [url, skip, fetchCount]); // eslint-disable-line react-hooks/exhaustive-deps

    return { data, loading, error, refetch };
}

export { useFetch };
export type { UseFetchResult };
