import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useLumiqeStore } from './store';

export function useHydrateStore(): void {
    const { data: session, status } = useSession();
    const setUser = useLumiqeStore((s) => s.setUser);
    const updateUser = useLumiqeStore((s) => s.updateUser);
    const reset = useLumiqeStore((s) => s.reset);
    const fetchedRef = useRef(false);

    useEffect(() => {
        if (status === 'loading') {
            return;
        }

        if (!session) {
            fetchedRef.current = false;
            reset();
            return;
        }

        if (fetchedRef.current) {
            return;
        }

        fetchedRef.current = true;

        const controller = new AbortController();

        async function fetchProfile(): Promise<void> {
            try {
                const response = await fetch('/api/proxy/auth/me', {
                    signal: controller.signal,
                });

                if (!response.ok) {
                    return;
                }

                const profile = await response.json();
                setUser(profile);
            } catch (error: unknown) {
                if (error instanceof DOMException && error.name === 'AbortError') {
                    return;
                }
            }
        }

        fetchProfile();

        const isPremium = Boolean(
            (session as Record<string, unknown>)?.user &&
            ((session as Record<string, unknown>).user as Record<string, unknown>)?.is_premium,
        );
        updateUser({ is_premium: isPremium });

        return () => {
            controller.abort();
        };
    }, [session, status, setUser, updateUser, reset]);
}
