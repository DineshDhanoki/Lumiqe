'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Lock, ShoppingBag, ArrowUpRight, Sparkles } from 'lucide-react';

interface Product {
    id: string;
    name: string;
    brand: string;
    price: string;
    image_url: string;
    match_score: number;
    purchase_link: string;
    is_locked?: boolean;
    is_placeholder?: boolean;
    color_hex?: string;
}

interface ProductCardProps {
    product: Product;
    idx: number;
    onLockedClick: () => void;
}

export default function ProductCard({ product, idx, onLockedClick }: ProductCardProps) {
    const isLocked = product.is_locked;

    // ─── Resilient Image State ───────────────────────────────
    // Route external images through our proxy to bypass CDN hotlink blocks
    const proxyUrl = product.image_url && !product.image_url.startsWith('/')
        ? `/api/image-proxy?url=${encodeURIComponent(product.image_url)}`
        : product.image_url;
    const [imgSrc, setImgSrc] = useState(proxyUrl);
    const [imgFailed, setImgFailed] = useState(!product.image_url);

    const handleImageError = () => {
        setImgFailed(true);
        setImgSrc('');
    };

    return (
        <motion.div
            key={product.id || idx}
            role="article"
            aria-label={product.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => {
                if (isLocked) onLockedClick();
            }}
            className={`
                group relative flex flex-col gap-3 rounded-3xl border p-3 transition-colors overflow-hidden
                ${isLocked
                    ? 'bg-black/40 border-white/5 cursor-pointer'
                    : 'bg-white/10 backdrop-blur-md border-white/10 hover:bg-white/20'
                }
            `}
        >
            {/* ── Product Image Box ─────────────────────────── */}
            <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden bg-white/5">
                {imgFailed ? (
                    /* ── Premium Gold Fallback — "Visit Store" CTA ── */
                    <div
                        className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer overflow-hidden border border-[#d4af37]/30 shadow-[inset_0_0_40px_rgba(212,175,55,0.15)] rounded-2xl"
                        style={{
                            background: `
                                radial-gradient(circle at 30% 20%, rgba(212,175,55,0.15) 0%, transparent 60%),
                                radial-gradient(circle at 70% 80%, rgba(255,245,200,0.1) 0%, transparent 50%),
                                linear-gradient(135deg, #0f0c05 0%, #1a1508 50%, #0a0803 100%)
                            `,
                        }}
                    >
                        {/* Animated gold shimmer overlay */}
                        <div
                            className="absolute inset-0 opacity-[0.2]"
                            style={{
                                backgroundImage: `linear-gradient(110deg, transparent 20%, rgba(212,175,55,0.4) 50%, transparent 80%)`,
                                backgroundSize: '200% 100%',
                                animation: 'shimmer 3s ease-in-out infinite',
                            }}
                        />

                        {/* Subtle gold grid pattern */}
                        <div
                            className="absolute inset-0 opacity-[0.05]"
                            style={{
                                backgroundImage: `
                                    linear-gradient(rgba(212,175,55,1) 1px, transparent 1px),
                                    linear-gradient(90deg, rgba(212,175,55,1) 1px, transparent 1px)
                                `,
                                backgroundSize: '24px 24px',
                            }}
                        />

                        {/* Brand badge */}
                        <div className="relative z-10 flex flex-col items-center gap-4">
                            {/* Glowing gold icon ring */}
                            <div
                                className="w-16 h-16 rounded-full flex items-center justify-center border transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6"
                                style={{
                                    background: `linear-gradient(135deg, rgba(212,175,55,0.1), rgba(212,175,55,0.02))`,
                                    borderColor: `rgba(212,175,55,0.4)`,
                                    boxShadow: `0 0 30px rgba(212,175,55,0.2), inset 0 0 20px rgba(212,175,55,0.1)`,
                                }}
                            >
                                <ShoppingBag
                                    className="w-7 h-7 transition-all duration-300 group-hover:-translate-y-0.5"
                                    style={{ color: `#e6c27a` }}
                                    strokeWidth={1.5}
                                />
                            </div>

                            {/* Brand name */}
                            <span
                                className="text-[11px] font-black uppercase tracking-[0.3em] drop-shadow-md"
                                style={{ color: '#d4af37' }}
                            >
                                {product.brand}
                            </span>

                            {/* CTA */}
                            <div
                                className="flex items-center gap-2 px-4 py-2 mt-2 rounded-full border text-[10px] font-bold tracking-widest uppercase transition-all duration-500 group-hover:gap-3 group-hover:bg-[#d4af37]/20"
                                style={{
                                    borderColor: `rgba(212,175,55,0.3)`,
                                    color: `#f9f29f`,
                                    background: `rgba(212,175,55,0.1)`,
                                    boxShadow: `0 4px 15px rgba(0,0,0,0.5)`,
                                }}
                            >
                                <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                                Visit Store
                                <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 text-[#d4af37]" />
                            </div>
                        </div>
                    </div>
                ) : (
                    /* ── Next.js Image with unoptimized bypass ── */
                    <Image
                        src={imgSrc}
                        alt={`${product.name} by ${product.brand}`}
                        fill
                        unoptimized={true}
                        className={`object-cover transition-transform duration-500
                            ${isLocked ? 'blur-md brightness-[0.3]' : 'group-hover:scale-110'}
                        `}
                        onError={handleImageError}
                    />
                )}

                {/* Lock Overlay */}
                {isLocked && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center shadow-lg">
                            <Lock className="w-5 h-5 text-white/80" />
                        </div>
                    </div>
                )}

                {/* Match Score Badge */}
                {!isLocked && (
                    <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm text-[10px] font-bold text-white border border-white/10">
                        {Math.round(product.match_score)}% Match
                    </div>
                )}
            </div>

            {/* ── Details ───────────────────────────────────── */}
            <div className="px-1 space-y-1">
                <h3 className={`text-sm font-semibold leading-tight line-clamp-2 ${isLocked ? 'text-white/40' : 'text-white'}`}>
                    {product.name}
                </h3>
                <div className="flex justify-between items-center text-xs">
                    <span className={isLocked ? 'text-white/30' : 'text-white/60'}>
                        {isLocked ? 'Premium Brand' : product.brand}
                    </span>
                    {!isLocked && (
                        <span className="text-white font-medium">{product.price}</span>
                    )}
                </div>
            </div>

            {/* ── Link Overlay for Unlocked Items ────────── */}
            {!isLocked && product.purchase_link && (
                <a
                    href={product.purchase_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Buy ${product.name}`}
                    className="absolute inset-0 z-10"
                >
                    <span className="sr-only">Buy {product.name}</span>
                </a>
            )}

            {/* ── Shimmer Keyframes ──────────────────────── */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            ` }} />
        </motion.div>
    );
}
