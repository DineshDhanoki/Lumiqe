'use client';

import { motion } from 'framer-motion';
import { ShoppingBag, CheckCircle2 } from 'lucide-react';

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
            <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-white mb-2">Your Capsule Wardrobe</h2>
                <p className="text-white/50">10 essential pieces curated for your {season} palette</p>
            </div>

            {/* Wardrobe Formula */}
            <div className="bg-gradient-to-r from-red-950/40 to-zinc-900/40 border border-red-500/20 rounded-3xl p-6">
                <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-2">Your Wardrobe Formula</p>
                <p className="text-white/80 text-base leading-relaxed">{wardrobeFormula}</p>
            </div>

            {/* Wardrobe Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {items.map((item, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-4 bg-zinc-900/60 border border-white/10 rounded-2xl p-4 hover:border-white/20 transition-colors"
                    >
                        {/* Color swatch */}
                        <div
                            className="w-14 h-14 rounded-xl flex-shrink-0 border border-white/20 shadow-lg"
                            style={{ backgroundColor: item.hex }}
                        />

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-white font-semibold text-sm leading-tight">{item.piece}</p>
                                    <p className="text-white/40 text-xs mt-1 font-mono">{item.hex}</p>
                                    <p className="text-white/60 text-xs mt-1 leading-snug">{item.why}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Shopping CTA */}
            <div className="text-center pt-4">
                <div className="inline-flex items-center gap-2 text-white/40 text-sm">
                    <ShoppingBag className="w-4 h-4" />
                    <span>Use the Shopping Feed to find these exact pieces in your colors</span>
                </div>
            </div>
        </motion.div>
    );
}
