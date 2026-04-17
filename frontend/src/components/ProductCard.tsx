'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

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
            onClick={() => { if (isLocked) onLockedClick(); }}
            className="group relative flex flex-col bg-surface-container-low rounded-2xl overflow-hidden transition-all duration-500 hover:translate-y-[-4px]"
        >
            {/* ── Product Image ─────────────────────────── */}
            <div className="relative aspect-[3/4] overflow-hidden">
                {imgFailed ? (
                    /* Fallback when image fails to load */
                    <div
                        className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden"
                        style={{
                            background: `
                                radial-gradient(circle at 30% 20%, rgba(212,175,55,0.15) 0%, transparent 60%),
                                radial-gradient(circle at 70% 80%, rgba(255,245,200,0.1) 0%, transparent 50%),
                                linear-gradient(135deg, #0f0c05 0%, #1a1508 50%, #0a0803 100%)
                            `,
                        }}
                    >
                        <div
                            className="absolute inset-0 opacity-[0.2]"
                            style={{
                                backgroundImage: `linear-gradient(110deg, transparent 20%, rgba(212,175,55,0.4) 50%, transparent 80%)`,
                                backgroundSize: '200% 100%',
                                animation: 'shimmer 3s ease-in-out infinite',
                            }}
                        />
                        <div className="relative z-10 flex flex-col items-center gap-4">
                            <div
                                className="w-16 h-16 rounded-full flex items-center justify-center border transition-transform duration-500 group-hover:scale-110"
                                style={{
                                    background: `linear-gradient(135deg, rgba(212,175,55,0.1), rgba(212,175,55,0.02))`,
                                    borderColor: `rgba(212,175,55,0.4)`,
                                    boxShadow: `0 0 30px rgba(212,175,55,0.2), inset 0 0 20px rgba(212,175,55,0.1)`,
                                }}
                            >
                                <span className="material-symbols-outlined text-base" style={{ color: `#e6c27a` }}>shopping_bag</span>
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-[0.3em]" style={{ color: '#d4af37' }}>{product.brand}</span>
                        </div>
                    </div>
                ) : (
                    <Image
                        src={imgSrc}
                        alt={`${product.name} by ${product.brand}`}
                        fill
                        unoptimized={true}
                        className={`object-cover transition-transform duration-700 ${isLocked ? 'grayscale opacity-30' : 'group-hover:scale-110'}`}
                        onError={handleImageError}
                    />
                )}

                {/* Locked overlay */}
                {isLocked && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-md z-10 px-6 text-center">
                        <span className="material-symbols-outlined text-primary text-4xl mb-4">lock</span>
                        <h4 className="font-display text-2xl font-bold text-on-surface mb-2">Premium Access</h4>
                        <p className="font-label text-[10px] text-on-surface-variant/40 uppercase tracking-widest mb-6 leading-relaxed">
                            Exclusive access for premium tier members
                        </p>
                        <button
                            onClick={onLockedClick}
                            className="px-6 py-2 font-headline text-[10px] font-bold uppercase tracking-widest rounded-full transition-all hover:bg-primary hover:text-on-primary"
                            style={{ background: 'rgba(196,151,62,0.1)', color: '#f0bf62', border: '1px solid rgba(196,151,62,0.3)' }}
                        >
                            Unlock Access
                        </button>
                    </div>
                )}

                {/* Match Score Badge */}
                {!isLocked && (
                    <div
                        className="absolute top-4 left-4 bg-background/60 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5"
                        style={{ border: '0.5px solid rgba(196,151,62,0.2)' }}
                    >
                        <span className="material-symbols-outlined text-primary text-xs" style={{ fontVariationSettings: "'FILL' 1", fontSize: '14px' }}>auto_awesome</span>
                        <span className="font-mono text-[10px] text-primary font-bold">{Math.round(product.match_score)}% MATCH</span>
                    </div>
                )}
            </div>

            {/* ── Details ─────────────────────────────── */}
            <div className="p-6 flex flex-col flex-grow">
                <span className="font-headline text-[10px] text-on-surface-variant/40 uppercase tracking-[0.2em] mb-1">
                    {isLocked ? 'Premium Brand' : product.brand}
                </span>
                <h3 className="font-display text-xl font-bold text-on-surface mb-4 line-clamp-2">
                    {product.name}
                </h3>
                <div className="mt-auto flex items-center justify-between">
                    {!isLocked && (
                        <span className="font-headline text-sm font-semibold text-on-surface-variant">{product.price}</span>
                    )}
                    {!isLocked && product.purchase_link && (
                        <a
                            href={product.purchase_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Buy ${product.name}`}
                            className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary transition-all hover:bg-primary hover:text-on-primary"
                            style={{ border: '0.5px solid rgba(196,151,62,0.2)' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <span className="material-symbols-outlined text-sm">shopping_bag</span>
                        </a>
                    )}
                </div>
            </div>

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
