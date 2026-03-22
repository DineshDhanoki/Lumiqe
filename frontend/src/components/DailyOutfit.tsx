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
            <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 animate-pulse">
                <div className="h-5 w-40 bg-white/10 rounded mb-4" />
                <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-32 bg-white/5 rounded-xl" />
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
            className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-red-400" />
                    <h3 className="text-white font-bold">Today&apos;s Outfit</h3>
                </div>
                <span className="text-white/30 text-xs">{outfit.date}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
                {outfit.items.map((item, i) => (
                    <a
                        key={i}
                        href={item.purchase_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group bg-black/40 border border-white/5 rounded-xl overflow-hidden hover:border-red-500/30 transition-colors"
                    >
                        {item.image_url && (
                            <div className="relative h-28 w-full bg-zinc-800">
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
                            <p className="text-white/80 text-xs font-medium truncate">{item.name}</p>
                            <div className="flex items-center justify-between mt-1">
                                <span className="text-white/40 text-xs">{item.brand}</span>
                                <ExternalLink className="w-3 h-3 text-white/20 group-hover:text-red-400 transition-colors" />
                            </div>
                        </div>
                    </a>
                ))}
            </div>

            <p className="text-white/40 text-xs italic">{outfit.tip}</p>
        </motion.div>
    );
}
