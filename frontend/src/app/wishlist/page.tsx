'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Trash2, ExternalLink, ShoppingBag } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Navbar from '@/components/Navbar';
import { SkeletonShoppingGrid } from '@/components/ui/Skeleton';

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
        <div className="min-h-screen bg-stone-950">
            <Navbar />

            <main className="max-w-6xl mx-auto px-4 pt-24 pb-12">
                <div className="flex items-center gap-3 mb-8">
                    <Heart className="w-7 h-7 text-red-500" />
                    <h1 className="text-3xl font-bold text-white">Your Wishlist</h1>
                </div>

                {loading ? (
                    <SkeletonShoppingGrid />
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
                        <ShoppingBag className="w-16 h-16 text-white/20" />
                        <h2 className="text-xl font-semibold text-white">No saved items yet</h2>
                        <p className="text-white/50 max-w-sm">
                            Discover products that match your color palette and save your favorites here.
                        </p>
                        <Link
                            href="/shopping-agent"
                            className="mt-2 px-6 py-3 bg-red-600 rounded-full text-white font-medium hover:bg-red-500 transition-colors"
                        >
                            Browse Shopping Agent
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
            </main>
        </div>
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
        <div className="bg-zinc-900/60 border border-white/10 rounded-2xl overflow-hidden group">
            <div className="relative aspect-[3/4] bg-zinc-800">
                {!imgFailed && proxyUrl ? (
                    <Image
                        src={proxyUrl}
                        alt={item.name}
                        fill
                        className="object-cover"
                        onError={() => setImgFailed(true)}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <ShoppingBag className="w-10 h-10 text-white/20" />
                    </div>
                )}

                {/* Match score badge */}
                <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm rounded-full px-2.5 py-1 text-xs font-semibold text-white">
                    {Math.round(item.match_score * 100)}% match
                </div>

                {/* Remove button */}
                <button
                    onClick={onRemove}
                    disabled={isRemoving}
                    className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-full p-2 text-white/70 hover:text-red-400 hover:bg-black/90 transition-colors disabled:opacity-50"
                    aria-label={`Remove ${item.name} from wishlist`}
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            <div className="p-4 space-y-2">
                <p className="text-xs text-white/50 uppercase tracking-wider">{item.brand}</p>
                <h3 className="text-sm font-medium text-white line-clamp-2 leading-snug">{item.name}</h3>
                <div className="flex items-center justify-between pt-1">
                    <span className="text-white font-semibold">{item.price}</span>
                    <a
                        href={affiliateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded-full text-white text-xs font-medium transition-colors"
                    >
                        Buy <ExternalLink className="w-3 h-3" />
                    </a>
                </div>
            </div>
        </div>
    );
}
