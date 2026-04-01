'use client';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { ArrowLeft, Filter, Lock, User } from 'lucide-react';

import VibeSelector from '@/components/VibeSelector';
import SubscriptionModal from '@/components/SubscriptionModal';
import ProductCard from '@/components/ProductCard';
import { useTranslation } from '@/lib/hooks/useTranslation';

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

function FeedContent() {
    const { t } = useTranslation();
    const searchParams = useSearchParams();
    const { data: session } = useSession();
    const season = searchParams.get('season') || 'Deep Autumn';
    const paletteParam = searchParams.get('palette') || '';
    const isPremiumUser = !!session?.isPremium;

    // Gender state — user picks before seeing products
    const [gender, setGender] = useState<string | null>(null);

    const [vibe, setVibe] = useState('Casual');
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    // PLG State
    const [usedPremiumTeaser, setUsedPremiumTeaser] = useState(false);
    const [isPlaceholderResponse, setIsPlaceholderResponse] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        async function fetchProducts() {
            setLoading(true);
            try {
                // Determine if this is a teaser request
                const isPremiumVibe = vibe !== 'Casual';
                const isTeaserRequest = isPremiumVibe && !usedPremiumTeaser;

                // Hit the dynamic catalog endpoint with gatekeeper arguments
                const url = new URL('/api/proxy/products', window.location.origin);
                url.searchParams.append('season', season);
                url.searchParams.append('gender', gender || 'male');
                url.searchParams.append('vibe', vibe);
                url.searchParams.append('is_teaser_request', isPremiumUser ? 'false' : isTeaserRequest.toString());
                url.searchParams.append('user_tier', isPremiumUser ? 'premium' : 'free');

                // Pass palette for Delta-E precision scoring
                if (paletteParam) {
                    url.searchParams.append('palette', paletteParam);
                }

                const res = await fetch(url.toString());
                const data = await res.json();

                // Sort: products with loadable images first, fallback cards last
                // Only these CDN domains reliably serve images through our proxy
                const WORKING_DOMAINS = ['myntassets.com'];
                const hasWorkingImage = (url: string) => {
                    if (!url) return false;
                    return WORKING_DOMAINS.some(domain => url.includes(domain));
                };

                const sorted = [...(data.products || [])].sort((a: Product, b: Product) => {
                    const aHasImg = hasWorkingImage(a.image_url) ? 0 : 1;
                    const bHasImg = hasWorkingImage(b.image_url) ? 0 : 1;
                    if (aHasImg !== bHasImg) return aHasImg - bHasImg;
                    // Within same group, sort by match score descending
                    return (b.match_score || 0) - (a.match_score || 0);
                });

                setProducts(sorted);
                setIsPlaceholderResponse(data.is_placeholder === true);
            } catch (err) {
                console.error("Failed to fetch products", err);
            } finally {
                setLoading(false);
            }
        }
        fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [season, gender, vibe]); // isPremiumUser/paletteParam/usedPremiumTeaser intentionally excluded

    const handleVibeSelect = (selectedVibe: string) => {
        if (selectedVibe === 'Casual') {
            setVibe('Casual');
            return;
        }

        // Premium user — all vibes unlocked
        if (isPremiumUser) {
            setVibe(selectedVibe);
            return;
        }

        // Free user — Premium Vibe Clicked
        if (!usedPremiumTeaser) {
            // Unlocked first peek
            setVibe(selectedVibe);
            setUsedPremiumTeaser(true); // Burn the teaser
        } else {
            // Already used teaser — hard paywall
            setIsModalOpen(true);
        }
    };

    return (
        <>
            <div className="w-full max-w-md flex justify-between items-center mb-6 pt-4 z-20 relative">
                <Link href={session ? '/dashboard' : '/results'} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition backdrop-blur-md border border-white/10">
                    <ArrowLeft className="w-5 h-5 text-white" />
                </Link>
                <div className="flex flex-col items-center">
                    <h1 className="text-lg font-bold text-white capitalize">{t('yourCatalog')}</h1>
                    <span className="text-xs text-red-400 font-medium tracking-wide">{season}</span>
                </div>
                <button className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition backdrop-blur-md border border-white/10">
                    <Filter className="w-5 h-5 text-white" />
                </button>
            </div>

            {/* Gender Selection — shown before any products */}
            {!gender ? (
                <div className="w-full max-w-md flex flex-col items-center justify-center mt-16 z-20 relative">
                    <div className="w-16 h-16 rounded-full bg-red-500/15 flex items-center justify-center mb-6">
                        <User className="w-8 h-8 text-red-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">{t('selectYourStyle')}</h2>
                    <p className="text-white/50 text-sm mb-8 text-center">{t('selectYourStyleDesc')}</p>
                    <div className="flex gap-4 w-full">
                        <button
                            onClick={() => setGender('male')}
                            className="flex-1 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-semibold transition-all text-center"
                        >
                            👨 Men&apos;s
                        </button>
                        <button
                            onClick={() => setGender('female')}
                            className="flex-1 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-semibold transition-all text-center"
                        >
                            👩 Women&apos;s
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {/* Gender Toggle (compact, after selection) */}
                    <div className="w-full max-w-md flex items-center justify-center gap-2 mb-4 z-20 relative">
                        <div className="flex bg-white/5 rounded-full p-1 border border-white/10">
                            <button
                                onClick={() => setGender('male')}
                                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${gender === 'male'
                                    ? 'bg-red-500/20 text-red-100 shadow-sm'
                                    : 'text-white/50 hover:text-white'
                                    }`}
                            >
                                Men&apos;s
                            </button>
                            <button
                                onClick={() => setGender('female')}
                                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${gender === 'female'
                                    ? 'bg-red-500/20 text-red-100 shadow-sm'
                                    : 'text-white/50 hover:text-white'
                                    }`}
                            >
                                Women&apos;s
                            </button>
                        </div>
                    </div>

                    {/* Vibe Selector Tabs */}
                    <div className="w-full max-w-md mb-8 z-20 relative">
                        <VibeSelector currentVibe={vibe} onSelectVibe={handleVibeSelect} isPremiumUser={isPremiumUser} />
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                            {[...Array(6)].map((_, i) => (
                                <div key={`skeleton-${i}`} className="aspect-[3/4] rounded-3xl bg-white/5 animate-pulse" />
                            ))}
                        </div>
                    ) : isPlaceholderResponse ? (
                        /* Premium vibe — no real items scraped yet. Show a premium locked grid */
                        <div className="w-full max-w-md relative z-20">
                            <div className="grid grid-cols-2 gap-4">
                                {[...Array(6)].map((_, i) => (
                                    <motion.div
                                        key={`ph-${i}`}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        onClick={() => setIsModalOpen(true)}
                                        className="aspect-[3/4] rounded-3xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center cursor-pointer hover:bg-white/[0.06] transition-colors"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center">
                                            <Lock className="w-4 h-4 text-white/50" />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="mt-8 text-center"
                            >
                                <p className="text-white/40 text-sm mb-4">{t('thisUnlocksWithPremium')}</p>
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="px-6 py-3 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all shadow-[0_0_20px_-5px_rgba(220,38,38,0.4)]"
                                >
                                    {t('unlockPremiumVibes')}
                                </button>
                            </motion.div>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center mt-12 w-full max-w-md relative z-20">
                            <p className="text-white/60 mb-4">{t('curatingCatalog')}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4 w-full max-w-md pb-20 z-20 relative">
                            {products.map((product, idx) => (
                                <ProductCard
                                    key={product.id || `product-${idx}`}
                                    product={product}
                                    idx={idx}
                                    onLockedClick={() => setIsModalOpen(true)}
                                />
                            ))}
                        </div>
                    )}

                    <SubscriptionModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                    />
                </>
            )}
        </>
    );
}

export default function FeedPage() {
    return (
        <main className="flex min-h-screen flex-col items-center p-6 relative overflow-hidden">
            {/* Background Layers */}
            <div className="fixed inset-0 bg-gradient-to-b from-gray-900 to-red-950 -z-20" />
            <div className="fixed bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black to-transparent -z-10" />

            {/* Suspense Wrapper for SearchParams */}
            <Suspense fallback={<div className="text-white/50 text-sm mt-10">Loading...</div>}>
                <FeedContent />
            </Suspense>
        </main>
    );
}
