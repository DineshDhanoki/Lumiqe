'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { SkeletonShoppingGrid } from '@/components/ui/Skeleton';
import AppLayout from '@/components/layout/AppLayout';

interface WishlistItem {
    id: string;
    product_id: string;
    name: string;
    brand: string;
    price: string;
    image_url: string;
    match_score: number;
    purchase_link: string;
}

export default function WishlistPage() {
    const { status } = useSession();
    const [items, setItems] = useState<WishlistItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [removingId, setRemovingId] = useState<string | null>(null);

    useEffect(() => {
        if (status !== 'authenticated') return;

        async function fetchWishlist() {
            try {
                const response = await fetch('/api/proxy/wishlist');
                if (!response.ok) throw new Error('Failed to load wishlist');
                const data = await response.json();
                setItems(data);
            } catch {
                // Silent fail — empty state will show
            } finally {
                setLoading(false);
            }
        }

        fetchWishlist();
    }, [status]);

    async function handleRemove(itemId: string) {
        setRemovingId(itemId);
        try {
            const response = await fetch(`/api/proxy/wishlist/${itemId}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                setItems((prev) => prev.filter((item) => item.id !== itemId));
            }
        } catch {
            // Silent fail
        } finally {
            setRemovingId(null);
        }
    }

    function buildAffiliateUrl(purchaseLink: string, productId: string): string {
        return `/api/proxy/affiliate/click?url=${encodeURIComponent(purchaseLink)}&product_id=${encodeURIComponent(productId)}`;
    }

    return (
        <AppLayout>
            <main className="max-w-6xl mx-auto">
                <header className="mb-16">
                    <div className="flex items-baseline gap-4 mb-2">
                        <h1 className="font-display text-5xl md:text-7xl font-light tracking-tight text-on-surface">Curated Archive</h1>
                        {!loading && items.length > 0 && (
                            <span className="font-mono text-xs text-primary/60">[ {items.length.toString().padStart(2, '0')} items ]</span>
                        )}
                    </div>
                    <p className="text-on-surface-variant max-w-xl text-sm leading-relaxed">
                        A selection of high-precision artifacts saved for your personal seasonal collection. Refined by AI intelligence for your unique silhouette.
                    </p>
                </header>

                {loading ? (
                    <SkeletonShoppingGrid />
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
                        <span className="material-symbols-outlined text-7xl text-on-surface-variant/20">shopping_bag</span>
                        <h2 className="text-xl font-semibold text-on-surface">No saved items yet</h2>
                        <p className="text-on-surface-variant max-w-sm">
                            Discover products that match your color palette and save your favorites here.
                        </p>
                        <Link
                            href="/shopping-agent"
                            className="mt-2 px-6 py-3 bg-primary-container rounded-[10px] text-on-primary font-headline font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all"
                        >
                            Browse Shopping Agent
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16">
                        {items.map((item) => (
                            <WishlistCard
                                key={item.id}
                                item={item}
                                isRemoving={removingId === item.id}
                                onRemove={() => handleRemove(item.id)}
                                affiliateUrl={buildAffiliateUrl(item.purchase_link, item.product_id)}
                            />
                        ))}
                    </div>
                )}

                {/* Intelligence Insight Section */}
                {!loading && items.length > 0 && (
                    <section className="mt-32 p-12 rounded-[24px] flex flex-col md:flex-row items-center gap-16 overflow-hidden relative"
                        style={{ background: 'rgba(32,31,34,1)', border: '0.5px solid rgba(196,151,62,0.15)' }}>
                        <div className="absolute top-0 right-0 w-full h-full pointer-events-none"
                            style={{ background: 'linear-gradient(135deg, rgba(240,191,98,0.05) 0%, transparent 50%, rgba(196,151,62,0.03) 100%)' }} />
                        <div className="flex-1 z-10">
                            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary mb-4 block">Intelligence Insight</span>
                            <h2 className="font-display text-4xl md:text-5xl italic text-on-surface mb-6">
                                Your Wishlist Defines a Curated Aesthetic.
                            </h2>
                            <p className="text-on-surface-variant text-sm mb-8 max-w-lg leading-relaxed">
                                Based on your saved items, our AI agent can suggest complementary pieces to complete your seasonal wardrobe.
                            </p>
                            <Link
                                href="/shopping-agent"
                                className="inline-block px-8 py-4 text-primary font-label text-[11px] font-bold uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-all duration-300"
                                style={{ background: 'rgba(19,19,21,0.6)', backdropFilter: 'blur(16px)', border: '0.5px solid rgba(196,151,62,0.15)' }}
                            >
                                View Recommendations
                            </Link>
                        </div>
                    </section>
                )}
            </main>
        </AppLayout>
    );
}

interface WishlistCardProps {
    item: WishlistItem;
    isRemoving: boolean;
    onRemove: () => void;
    affiliateUrl: string;
}

function WishlistCard({ item, isRemoving, onRemove, affiliateUrl }: WishlistCardProps) {
    const [imgFailed, setImgFailed] = useState(false);

    const proxyUrl = item.image_url && !item.image_url.startsWith('/')
        ? `/api/image-proxy?url=${encodeURIComponent(item.image_url)}`
        : item.image_url;

    return (
        <div className="group relative flex flex-col">
            {/* Image area */}
            <div
                className="aspect-[3/4] overflow-hidden bg-surface-container mb-6 rounded-xl relative shadow-2xl"
                style={{ border: '0.5px solid rgba(196,151,62,0.15)' }}
            >
                {!imgFailed && proxyUrl ? (
                    <Image
                        src={proxyUrl}
                        alt={item.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        onError={() => setImgFailed(true)}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <span className="material-symbols-outlined text-5xl text-on-surface-variant/20">shopping_bag</span>
                    </div>
                )}

                {/* Favourite/remove button */}
                <button
                    onClick={onRemove}
                    disabled={isRemoving}
                    className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center text-primary transition-all duration-300 hover:scale-110 active:scale-95 disabled:opacity-50"
                    style={{ background: 'rgba(19,19,21,0.6)', backdropFilter: 'blur(16px)', border: '0.5px solid rgba(196,151,62,0.15)' }}
                    aria-label={`Remove ${item.name} from wishlist`}
                >
                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                </button>

                {/* Match score badge */}
                {item.match_score > 0 && (
                    <div className="absolute top-4 left-4 px-2 py-0.5 rounded-full font-mono text-[9px] text-primary uppercase tracking-widest"
                        style={{ background: 'rgba(19,19,21,0.7)', backdropFilter: 'blur(8px)' }}>
                        {Math.round(item.match_score * 100)}% Match
                    </div>
                )}
            </div>

            {/* Card details */}
            <div className="flex flex-col space-y-1">
                <div className="flex justify-between items-start">
                    <h3 className="font-headline text-sm font-semibold tracking-wide text-on-surface uppercase line-clamp-2">{item.name}</h3>
                    <span className="font-mono text-primary text-[13px] font-medium tracking-tight ml-2 shrink-0">{item.price}</span>
                </div>
                <p className="text-on-surface-variant text-xs italic">{item.brand}</p>

                {/* Hover-reveal actions */}
                <div className="pt-4 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <a
                        href={affiliateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-primary text-on-primary font-label text-[10px] font-bold uppercase tracking-widest py-3 rounded-lg hover:bg-primary-container transition-colors text-center"
                    >
                        Add to Trunk
                    </a>
                    <a
                        href={affiliateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-12 border border-outline-variant rounded-lg flex items-center justify-center hover:bg-surface-container transition-colors"
                        aria-label={`Buy ${item.name}`}
                    >
                        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">shopping_bag</span>
                    </a>
                </div>
            </div>
        </div>
    );
}
