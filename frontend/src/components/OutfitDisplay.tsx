'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ExternalLink, ShoppingBag, Sparkles, ArrowUpRight } from 'lucide-react';

interface ProductItem {
    name: string;
    price: string;
    image_url: string;
    product_url: string;
}

interface CuratedOutfit {
    look_name: string;
    upper: ProductItem;
    layering: ProductItem;
    lower: ProductItem;
    shoes: ProductItem;
    watch: ProductItem;
    bag: ProductItem;
    eyewear: ProductItem;
    jewelry: ProductItem;
}

interface OutfitDisplayProps {
    outfit: CuratedOutfit;
}

const OUTFIT_SLOTS: { key: keyof Omit<CuratedOutfit, 'look_name'>; label: string; emoji: string }[] = [
    { key: 'upper', label: 'Upper', emoji: '👕' },
    { key: 'layering', label: 'Layering', emoji: '🧥' },
    { key: 'lower', label: 'Lower', emoji: '👖' },
    { key: 'shoes', label: 'Shoes', emoji: '👟' },
    { key: 'watch', label: 'Watch', emoji: '⌚' },
    { key: 'bag', label: 'Bag', emoji: '🎒' },
    { key: 'eyewear', label: 'Eyewear', emoji: '🕶️' },
    { key: 'jewelry', label: 'Jewelry', emoji: '💎' },
];

function OutfitItemCard({
    item,
    label,
    emoji,
    idx = 0,
}: {
    item: ProductItem;
    label: string;
    emoji: string;
    idx?: number;
}) {
    const [imgFailed, setImgFailed] = useState(false);
    const hasImage = item.image_url && !imgFailed;
    const isPlaceholder = item.name.startsWith('No ');

    return (
        <motion.a
            href={isPlaceholder ? undefined : item.product_url}
            target={isPlaceholder ? undefined : '_blank'}
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: idx * 0.06, duration: 0.4, ease: 'easeOut' }}
            className={`
                group relative flex flex-col gap-2 rounded-2xl border overflow-hidden
                transition-all duration-300
                ${isPlaceholder
                    ? 'bg-white/[0.02] border-white/5 cursor-default opacity-50'
                    : hasImage
                        ? 'bg-white/[0.04] border-white/10 hover:border-white/25 hover:bg-white/[0.08] cursor-pointer'
                        : 'border-[#d4af37]/20 cursor-pointer hover:border-[#d4af37]/40'
                }
            `}
            style={!hasImage && !isPlaceholder ? {
                background: `
                    radial-gradient(circle at 30% 20%, rgba(212,175,55,0.08) 0%, transparent 60%),
                    linear-gradient(135deg, #0f0c05 0%, #1a1508 50%, #0a0803 100%)
                `,
            } : undefined}
        >
            {/* Image Container */}
            <div className="relative w-full aspect-square overflow-hidden">
                {isPlaceholder ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl mb-2 opacity-30">{emoji}</span>
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/20">
                            {label}
                        </span>
                    </div>
                ) : hasImage ? (
                    <>
                        <Image
                            src={item.image_url}
                            alt={item.name}
                            fill
                            unoptimized
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                            onError={() => setImgFailed(true)}
                        />
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                    </>
                ) : (
                    /* Gold fallback card */
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        {/* Gold shimmer */}
                        <div
                            className="absolute inset-0 opacity-[0.15]"
                            style={{
                                backgroundImage: `linear-gradient(110deg, transparent 20%, rgba(212,175,55,0.4) 50%, transparent 80%)`,
                                backgroundSize: '200% 100%',
                                animation: 'shimmer 3s ease-in-out infinite',
                            }}
                        />
                        <div
                            className="w-12 h-12 rounded-full flex items-center justify-center border border-[#d4af37]/30 mb-3"
                            style={{ boxShadow: '0 0 20px rgba(212,175,55,0.15)' }}
                        >
                            <ShoppingBag className="w-5 h-5 text-[#d4af37]/70" strokeWidth={1.5} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#d4af37]/80 mb-1">
                            {label}
                        </span>
                        <div className="flex items-center gap-1.5 text-[9px] font-bold tracking-wider text-[#d4af37]/50 uppercase">
                            <Sparkles className="w-2.5 h-2.5" />
                            Visit Store
                            <ArrowUpRight className="w-2.5 h-2.5" />
                        </div>
                    </div>
                )}

                {/* Category Label Badge */}
                {!isPlaceholder && (
                    <div className={`
                        absolute top-2 left-2 px-2.5 py-1 rounded-full text-[9px] font-bold
                        tracking-widest uppercase shadow-lg
                        ${hasImage
                            ? 'bg-black/60 backdrop-blur-md border border-white/20 text-white'
                            : 'bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37]'
                        }
                    `}>
                        {label}
                    </div>
                )}

                {/* Hover link icon */}
                {!isPlaceholder && (
                    <div className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <ExternalLink className="w-3.5 h-3.5 text-white" />
                    </div>
                )}
            </div>

            {/* Product Info */}
            {!isPlaceholder && (
                <div className="px-2.5 pb-2.5 flex flex-col gap-0.5">
                    <h3 className="text-xs font-semibold text-white leading-tight line-clamp-2">
                        {item.name}
                    </h3>
                    <span className="text-white/50 text-[11px] font-medium">{item.price}</span>
                </div>
            )}
        </motion.a>
    );
}

export default function OutfitDisplay({ outfit }: OutfitDisplayProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-lg mx-auto flex flex-col gap-5 relative z-10 text-white"
        >
            {/* Look Title */}
            <div className="flex flex-col items-center text-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-red-400">
                    Curated Look
                </span>
                <h2 className="text-xl font-bold italic text-white/90">
                    &ldquo;{outfit.look_name}&rdquo;
                </h2>
            </div>

            {/* Main Outfit Grid — 2 columns */}
            <div className="grid grid-cols-2 gap-3">
                {OUTFIT_SLOTS.map((slot, i) => (
                    <OutfitItemCard
                        key={slot.key}
                        item={outfit[slot.key]}
                        label={slot.label}
                        emoji={slot.emoji}
                        idx={i}
                    />
                ))}
            </div>
        </motion.div>
    );
}
