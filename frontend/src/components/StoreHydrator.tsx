'use client';

import { useHydrateStore } from '@/lib/useHydrateStore';

export default function StoreHydrator() {
    useHydrateStore();
    return null;
}
