'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface DailyOutfitSlot {
    dominant_color: string;
    category?: string;
    image_filename?: string;
    match_score: number;
}

interface DailyOutfitData {
    date: string;
    filled_count: number;
    slots: Record<string, DailyOutfitSlot | null>;
}

interface DailyOutfitSectionProps {
    dailyOutfit: DailyOutfitData | null;
    dailyOutfitEmpty: boolean;
    isAuthenticated: boolean;
}

const OUTFIT_SLOTS = ['top', 'bottom', 'shoes', 'accessory'] as const;

const DailyOutfitSection = React.memo(function DailyOutfitSection({
    dailyOutfit,
    dailyOutfitEmpty,
    isAuthenticated,
}: DailyOutfitSectionProps) {
    if (!isAuthenticated) return null;

    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
            <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-4">Today&apos;s Outfit</p>
            {dailyOutfit && dailyOutfit.filled_count > 0 ? (
                <div className="bg-surface-container/50 border border-primary/10 rounded-3xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>wb_sunny</span>
                        <p className="text-on-surface font-semibold text-sm">Your outfit for {dailyOutfit.date}</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {OUTFIT_SLOTS.map((slot) => {
                            const item = dailyOutfit.slots[slot];
                            return (
                                <div key={slot} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-surface-container/30 border border-outline-variant/20">
                                    <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">{slot}</p>
                                    {item ? (
                                        <>
                                            <div className="w-10 h-10 rounded-full border-2 border-outline-variant/30" style={{ backgroundColor: item.dominant_color }} />
                                            <p className="text-on-surface-variant text-xs text-center truncate max-w-full">{item.category || item.image_filename}</p>
                                            <p className="text-on-surface-variant/50 text-[10px]">{item.match_score}% match</p>
                                        </>
                                    ) : (
                                        <p className="text-on-surface-variant/50 text-xs">No item</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <Link href="/wardrobe" className="mt-4 flex items-center gap-1 text-primary text-xs font-semibold hover:text-primary/80 transition-colors">
                        View full outfit <span className="material-symbols-outlined text-xs">chevron_right</span>
                    </Link>
                </div>
            ) : dailyOutfitEmpty ? (
                <div className="bg-surface-container/50 border border-primary/10 rounded-3xl p-6 text-center">
                        <span className="material-symbols-outlined text-4xl text-on-surface-variant/20 mx-auto mb-3 block">checkroom</span>
                    <p className="text-on-surface-variant text-sm mb-3">Add items to your wardrobe to get daily outfits</p>
                    <Link href="/wardrobe" className="inline-flex items-center gap-1.5 text-xs bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-full font-semibold hover:bg-primary/20 transition-colors">
                        Go to Wardrobe
                    </Link>
                </div>
            ) : null}
        </motion.div>
    );
});

export default DailyOutfitSection;
