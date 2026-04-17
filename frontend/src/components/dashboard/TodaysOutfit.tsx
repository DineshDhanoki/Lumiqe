'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';


interface DailyOutfitSlotItem {
    id: string;
    dominant_color: string;
    match_score: number;
    image_filename: string;
    category: string | null;
}

interface DailyOutfitData {
    date: string;
    slots: Record<string, DailyOutfitSlotItem | null>;
    filled_count: number;
    total_slots: number;
}

interface Props {
    dailyOutfit: DailyOutfitData | null;
    isEmpty: boolean;
    isError: boolean;
    onRetry: () => void;
}

export default function TodaysOutfit({ dailyOutfit, isEmpty, isError, onRetry }: Props) {
    if (dailyOutfit && dailyOutfit.filled_count > 0) {
        return (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
                <p className="text-on-surface-variant text-xs font-label font-bold uppercase tracking-wider mb-4">Today&apos;s Outfit</p>
                <div className="bg-surface-container/50 border border-primary/10 rounded-3xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-xl text-primary">wb_sunny</span>
                        <p className="text-on-surface font-label font-semibold text-sm">Your outfit for {dailyOutfit.date}</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {(['top', 'bottom', 'shoes', 'accessory'] as const).map((slot) => {
                            const item = dailyOutfit.slots[slot];
                            return (
                                <div key={slot} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-surface-container/30 border border-outline-variant/20">
                                    <p className="text-on-surface-variant text-[10px] font-label font-bold uppercase tracking-wider">{slot}</p>
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
                    <Link href="/wardrobe" className="mt-4 flex items-center gap-1 text-primary text-xs font-label font-semibold hover:text-primary/80 transition-colors">
                        View full outfit <span className="material-symbols-outlined text-sm">chevron_right</span>
                    </Link>
                </div>
            </motion.div>
        );
    }

    if (isEmpty) {
        return (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
                <p className="text-on-surface-variant text-xs font-label font-bold uppercase tracking-wider mb-4">Today&apos;s Outfit</p>
                <div className="bg-surface-container/50 border border-primary/10 rounded-3xl p-6 text-center">
                    <span className="material-symbols-outlined text-3xl text-on-surface-variant/30 mx-auto mb-3 block">checkroom</span>
                    <p className="text-on-surface-variant text-sm mb-3">Add items to your wardrobe to get daily outfits</p>
                    <Link href="/wardrobe" className="inline-flex items-center gap-1.5 text-xs bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-full font-label font-semibold hover:bg-primary/20 transition-colors">
                        Go to Wardrobe
                    </Link>
                </div>
            </motion.div>
        );
    }

    if (isError) {
        return (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
                <p className="text-on-surface-variant text-xs font-label font-bold uppercase tracking-wider mb-4">Today&apos;s Outfit</p>
                <div className="bg-surface-container/50 border border-primary/10 rounded-3xl p-6 text-center">
                    <p className="text-on-surface-variant text-sm mb-3">Could not load today&apos;s outfit</p>
                    <button onClick={onRetry} className="text-xs text-primary hover:text-primary/80 transition-colors">
                        Retry
                    </button>
                </div>
            </motion.div>
        );
    }

    return null;
}
