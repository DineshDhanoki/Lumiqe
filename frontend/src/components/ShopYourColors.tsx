'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, ArrowRight } from 'lucide-react';

interface ShopProduct {
    id: string;
    name: string;
    brand: string;
    price: string;
    image_url: string;
    match_score: number;
    purchase_link: string;
    is_locked?: boolean;
}

interface ShopYourColorsProps {
    season: string;
    palette: string[];
}

const ShopYourColors = React.memo(function ShopYourColors({ season, palette }: ShopYourColorsProps) {
    const [topProducts, setTopProducts] = useState<ShopProduct[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchTopProducts() {
            setLoading(true);
            try {
                const url = new URL('/api/proxy/products', window.location.origin);
                url.searchParams.append('season', season);
                if (palette.length > 0) url.searchParams.append('palette', palette.join(','));
                url.searchParams.append('limit', '3');
                url.searchParams.append('vibe', 'Casual');
                url.searchParams.append('user_tier', 'free');
                const res = await fetch(url.toString());
                if (!res.ok) throw new Error('fetch failed');
                const data: ShopProduct[] = await res.json();
                setTopProducts(data.filter(p => !p.is_locked));
            } catch {
                setTopProducts([]);
            } finally {
                setLoading(false);
            }
        }
        fetchTopProducts();
    }, [season, palette]);

    const feedUrl = `/feed?season=${encodeURIComponent(season)}&palette=${encodeURIComponent(palette.join(','))}`;

    return (
        <section className="bg-zinc-900/50 border border-white/10 p-6 md:p-8 rounded-3xl">
            <div className="flex items-center gap-2 mb-2">
                <ShoppingBag className="w-5 h-5 text-red-400" />
                <h3 className="text-xl font-bold text-white">Shop Your Colors</h3>
            </div>
            <p className="text-white/60 mb-6 text-sm">Products that match your {season} palette</p>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[0, 1, 2].map(i => (
                        <div key={i} className="animate-pulse rounded-2xl bg-white/5 border border-white/10">
                            <div className="aspect-[4/5] rounded-t-2xl bg-white/10" />
                            <div className="p-3 space-y-2">
                                <div className="h-4 bg-white/10 rounded w-3/4" />
                                <div className="h-3 bg-white/10 rounded w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : topProducts.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {topProducts.slice(0, 3).map((product, idx) => {
                            const proxyImg = product.image_url && !product.image_url.startsWith('/')
                                ? `/api/image-proxy?url=${encodeURIComponent(product.image_url)}`
                                : product.image_url;
                            return (
                                <a key={product.id || idx} href={product.purchase_link} target="_blank" rel="noopener noreferrer"
                                    className="group relative flex flex-col rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors overflow-hidden">
                                    <div className="relative aspect-[4/5] w-full bg-white/5 overflow-hidden">
                                        {proxyImg ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={proxyImg} alt={product.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <ShoppingBag className="w-8 h-8 text-white/20" />
                                            </div>
                                        )}
                                        {product.match_score > 0 && (
                                            <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm text-[10px] font-bold text-white border border-white/10">
                                                {Math.round(product.match_score)}% Match
                                            </span>
                                        )}
                                    </div>
                                    <div className="p-3 space-y-1">
                                        <h4 className="text-sm font-semibold text-white leading-tight line-clamp-2">{product.name}</h4>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-white/50">{product.brand}</span>
                                            <span className="text-white font-medium">{product.price}</span>
                                        </div>
                                    </div>
                                </a>
                            );
                        })}
                    </div>
                    <div className="mt-5 text-center">
                        <Link href={feedUrl} className="inline-flex items-center gap-2 text-sm font-semibold text-red-400 hover:text-red-300 transition-colors">
                            Browse all matches <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </>
            ) : (
                <div className="text-center py-8">
                    <ShoppingBag className="w-10 h-10 text-white/20 mx-auto mb-3" />
                    <p className="text-white/50 text-sm mb-4">Products coming soon for your season</p>
                    <Link href={feedUrl} className="inline-flex items-center gap-2 text-sm font-semibold text-red-400 hover:text-red-300 transition-colors">
                        Save palette &amp; browse later <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            )}
        </section>
    );
});

export default ShopYourColors;
