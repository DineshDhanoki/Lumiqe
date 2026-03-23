import { useEffect, useRef, useCallback, type RefObject } from 'react';

const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(', ');

interface UseFocusTrapOptions {
    onClose?: () => void;
}

interface UseFocusTrapReturn {
    trapRef: RefObject<HTMLDivElement | null>;
}

function useFocusTrap(options?: UseFocusTrapOptions): UseFocusTrapReturn {
    const trapRef = useRef<HTMLDivElement | null>(null);
    const previousActiveRef = useRef<HTMLElement | null>(null);

    const getFocusableElements = useCallback((): HTMLElement[] => {
        if (!trapRef.current) {
            return [];
        }
        const elements = trapRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        return Array.from(elements);
    }, []);

    useEffect(() => {
        previousActiveRef.current = document.activeElement as HTMLElement | null;

        const container = trapRef.current;
        if (!container) {
            return;
        }

        const focusable = getFocusableElements();
        if (focusable.length > 0) {
            focusable[0].focus();
        }

        return () => {
            if (previousActiveRef.current && typeof previousActiveRef.current.focus === 'function') {
                previousActiveRef.current.focus();
            }
        };
    }, [getFocusableElements]);

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent): void {
            if (event.key === 'Escape' && options?.onClose) {
                options.onClose();
                return;
            }

            if (event.key !== 'Tab') {
                return;
            }

            const focusable = getFocusableElements();
            if (focusable.length === 0) {
                event.preventDefault();
                return;
            }

            const firstElement = focusable[0];
            const lastElement = focusable[focusable.length - 1];

            if (event.shiftKey) {
                if (document.activeElement === firstElement) {
                    event.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    event.preventDefault();
                    firstElement.focus();
                }
            }
        }

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [getFocusableElements, options]);

    return { trapRef };
}

export { useFocusTrap };
export type { UseFocusTrapReturn, UseFocusTrapOptions };
