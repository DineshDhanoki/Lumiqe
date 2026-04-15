'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

interface WardrobeItem {
    piece: string;
    hex: string;
    why: string;
}

interface CapsuleWardrobeProps {
    items: WardrobeItem[];
    season: string;
    wardrobeFormula: string;
}

export default function CapsuleWardrobe({ items, season, wardrobeFormula }: CapsuleWardrobeProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Editorial header */}
            <div className="mb-2">
                <span className="font-label text-[10px] tracking-[0.3em] uppercase text-on-surface-variant/60 block mb-1">The Atelier Edit</span>
                <h2 className="font-display italic text-4xl text-on-surface">Capsule Wardrobe</h2>
                <p className="text-on-surface-variant text-sm mt-1">
                    {items.length} essential pieces curated for your {season} palette
                </p>
            </div>

            {/* Wardrobe Formula */}
            <div className="bg-surface-container/50 border border-primary/10 rounded-3xl p-6">
                <div className="flex items-center gap-3 mb-3">
                    <span className="material-symbols-outlined text-primary text-xl">checkroom</span>
                    <div>
                        <span className="font-label text-[10px] tracking-[0.25em] uppercase text-on-surface-variant/60 block">Your Blueprint</span>
                        <p className="text-on-surface font-headline font-bold text-base leading-tight">Wardrobe Formula</p>
                    </div>
                </div>
                <p className="text-on-surface text-sm leading-relaxed">{wardrobeFormula}</p>
            </div>

            {/* Wardrobe Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {items.map((item, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.04 }}
                        className="flex items-start gap-4 bg-surface-container/50 border border-primary/10 rounded-2xl p-4 hover:border-primary/25 transition-colors group"
                    >
                        {/* Color swatch */}
                        <div
                            className="w-14 h-14 rounded-xl flex-shrink-0 border border-outline-variant/30 shadow-lg group-hover:scale-105 transition-transform duration-300"
                            style={{ backgroundColor: item.hex }}
                        />

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-1.5">
                                <span
                                    className="material-symbols-outlined text-primary text-base flex-shrink-0 mt-0.5"
                                    style={{ fontVariationSettings: "'FILL' 1" }}
                                >
                                    check_circle
                                </span>
                                <div>
                                    <p className="text-on-surface font-headline font-semibold text-sm leading-tight">{item.piece}</p>
                                    <p className="text-on-surface-variant/60 text-[10px] mt-0.5 font-mono">{item.hex}</p>
                                    <p className="text-on-surface-variant text-xs mt-1 leading-snug">{item.why}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Shopping CTA */}
            <div className="flex items-center justify-center pt-2">
                <Link
                    href="/feed"
                    className="inline-flex items-center gap-2 text-xs font-label font-bold uppercase tracking-widest text-primary border border-primary/20 bg-primary/5 hover:bg-primary/10 px-6 py-3 rounded-full transition-colors"
                >
                    <span className="material-symbols-outlined text-base">shopping_bag</span>
                    Shop These Colors in the Feed
                </Link>
            </div>
        </motion.div>
    );
}
