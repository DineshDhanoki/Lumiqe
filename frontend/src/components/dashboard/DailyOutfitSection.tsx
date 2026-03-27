'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sun, Shirt, ChevronRight } from 'lucide-react';

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
            <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-4">Today&apos;s Outfit</p>
            {dailyOutfit && dailyOutfit.filled_count > 0 ? (
                <div className="bg-zinc-900/60 border border-white/10 rounded-3xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Sun className="w-5 h-5 text-yellow-400" />
                        <p className="text-white font-semibold text-sm">Your outfit for {dailyOutfit.date}</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {OUTFIT_SLOTS.map((slot) => {
                            const item = dailyOutfit.slots[slot];
                            return (
                                <div key={slot} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/10">
                                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider">{slot}</p>
                                    {item ? (
                                        <>
                                            <div className="w-10 h-10 rounded-full border-2 border-white/20" style={{ backgroundColor: item.dominant_color }} />
                                            <p className="text-white/70 text-xs text-center truncate max-w-full">{item.category || item.image_filename}</p>
                                            <p className="text-white/30 text-[10px]">{item.match_score}% match</p>
                                        </>
                                    ) : (
                                        <p className="text-white/30 text-xs">No item</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <Link href="/wardrobe" className="mt-4 flex items-center gap-1 text-red-400 text-xs font-semibold hover:text-red-300 transition-colors">
                        View full outfit <ChevronRight className="w-3 h-3" />
                    </Link>
                </div>
            ) : dailyOutfitEmpty ? (
                <div className="bg-zinc-900/60 border border-white/10 rounded-3xl p-6 text-center">
                    <Shirt className="w-8 h-8 text-white/20 mx-auto mb-3" />
                    <p className="text-white/50 text-sm mb-3">Add items to your wardrobe to get daily outfits</p>
                    <Link href="/wardrobe" className="inline-flex items-center gap-1.5 text-xs bg-red-600/20 text-red-300 border border-red-500/20 px-3 py-1.5 rounded-full font-semibold hover:bg-red-600/30 transition-colors">
                        Go to Wardrobe
                    </Link>
                </div>
            ) : null}
        </motion.div>
    );
});

export default DailyOutfitSection;
