import { useState, useCallback } from 'react';

interface UseModalReturn {
    isOpen: boolean;
    open: () => void;
    close: () => void;
    toggle: () => void;
}

function useModal(initialOpen?: boolean): UseModalReturn {
    const [isOpen, setIsOpen] = useState<boolean>(initialOpen ?? false);

    const open = useCallback(() => {
        setIsOpen(true);
    }, []);

    const close = useCallback(() => {
        setIsOpen(false);
    }, []);

    const toggle = useCallback(() => {
        setIsOpen((prev) => !prev);
    }, []);

    return { isOpen, open, close, toggle };
}

export { useModal };
export type { UseModalReturn };
