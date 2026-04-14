'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ExternalLink } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { apiFetch } from '@/lib/api';

interface OutfitItem {
    name: string;
    brand: string;
    price: string;
    purchase_link: string;
    image_url: string;
    category?: string;
}

export default function DailyOutfit() {
    const { data: session } = useSession();
    const [outfit, setOutfit] = useState<{ items: OutfitItem[]; tip: string; date: string } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!session) return;

        apiFetch('/api/outfit/daily')
            .then(r => {
                if (!r.ok) throw new Error('No outfit available');
                return r.json();
            })
            .then(data => setOutfit(data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [session]);

    if (loading) {
        return (
            <div className="bg-surface-container/50 border border-primary/10 rounded-2xl p-6 animate-pulse">
                <div className="h-5 w-40 bg-surface-container/50 rounded mb-4" />
                <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-32 bg-surface-container/30 rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    if (!outfit || outfit.items.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface-container/50 border border-primary/10 rounded-2xl p-6"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <h3 className="text-on-surface font-bold">Today&apos;s Outfit</h3>
                </div>
                <span className="text-on-surface-variant/50 text-xs">{outfit.date}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
                {outfit.items.map((item, i) => (
                    <a
                        key={i}
                        href={item.purchase_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group bg-surface-container/30 border border-outline-variant/10 rounded-xl overflow-hidden hover:border-primary/30 transition-colors"
                    >
                        {item.image_url && (
                            <div className="relative h-28 w-full bg-surface-container">
                                <Image
                                    src={`/api/image-proxy?url=${encodeURIComponent(item.image_url)}`}
                                    alt={item.name}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 50vw, 25vw"
                                />
                            </div>
                        )}
                        <div className="p-2.5">
                            <p className="text-on-surface text-xs font-medium truncate">{item.name}</p>
                            <div className="flex items-center justify-between mt-1">
                                <span className="text-on-surface-variant text-xs">{item.brand}</span>
                                <ExternalLink className="w-3 h-3 text-on-surface-variant/20 group-hover:text-primary transition-colors" />
                            </div>
                        </div>
                    </a>
                ))}
            </div>

            <p className="text-on-surface-variant text-xs italic">{outfit.tip}</p>
        </motion.div>
    );
}
