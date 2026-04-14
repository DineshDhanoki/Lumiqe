'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Sparkles, Loader2, AlertCircle, RefreshCcw } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import OutfitDisplay, { CuratedOutfit } from '@/components/OutfitDisplay';
import AppMenu from '@/components/AppMenu';
import AppLayout from '@/components/layout/AppLayout';

// Animated loading messages
const LOADING_STEPS = [
    { text: 'Scanning trending styles…', icon: '🔍' },
    { text: 'Matching colors to your palette…', icon: '🎨' },
    { text: 'Scraping the freshest drops…', icon: '🛒' },
    { text: 'Scoring color harmony…', icon: '💎' },
    { text: 'Building your complete outfit…', icon: '👔' },
    { text: 'Adding the finishing touches…', icon: '✨' },
];

// ── Helper: extract all product_urls from an outfit ──
function extractProductUrls(outfit: CuratedOutfit): string[] {
    const slots = ['upper', 'layering', 'lower', 'shoes', 'watch', 'bag', 'eyewear', 'jewelry'] as const;
    return slots
        .map((s) => outfit[s]?.product_url || '')
        .filter((url) => url !== '');

}

function ShoppingAgentContent() {
    const searchParams = useSearchParams();
    const paletteParam = searchParams.get('palette') || '';
    const paletteHexes = paletteParam.split(',').filter((h) => h.trim().startsWith('#'));

    const [gender, setGender] = useState<string>('male');
    const [loading, setLoading] = useState(false);
    const [outfit, setOutfit] = useState<CuratedOutfit | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [usedProductUrls, setUsedProductUrls] = useState<string[]>([]);
    const [outfitCount, setOutfitCount] = useState(0);

    // Restore cached outfit from sessionStorage on mount
    useEffect(() => {
        try {
            const cached = sessionStorage.getItem('lumiqe-outfit');
            if (cached) {
                const parsed = JSON.parse(cached) as CuratedOutfit;
                setOutfit(parsed);
            }
        } catch { /* ignore */ }
    }, []);

    // No palette → send user back
    if (paletteHexes.length === 0) {
        return (
            <div className="flex flex-col w-full max-w-md mx-auto items-center justify-center min-h-screen p-6 text-center relative z-10">
                <Sparkles className="w-12 h-12 text-red-500 mb-6" />
                <h1 className="text-2xl font-bold text-white mb-4">No Palette Found</h1>
                <p className="text-white/60 mb-8 leading-relaxed">
                    You need to scan your face first so we know your skin-tone palette.
                    <br />
                    The AI Stylist matches outfits to <em>your</em> colors.
                </p>
                <Link
                    href="/"
                    className="px-6 py-3 bg-red-600 rounded-full text-white font-medium hover:bg-red-500 transition-colors"
                >
                    Scan Your Face First
                </Link>
            </div>
        );
    }

    const generateOutfit = async () => {
        setLoading(true);
        setError(null);
        setOutfit(null);
        try {
            const params = new URLSearchParams({ gender, palette: paletteHexes.join(',') });
            if (usedProductUrls.length > 0) {
                params.append('exclude_ids', usedProductUrls.join(','));
            }

            const res = await apiFetch(`/api/shopping-agent?${params.toString()}`);
            if (!res.ok) {
                const data = await res.json().catch(() => null);
                const detail = data?.detail?.detail || data?.detail || 'Failed to generate outfit';
                throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
            }
            const data = await res.json();
            setOutfit(data);
            setOutfitCount((prev) => prev + 1);

            // Persist outfit to sessionStorage so it survives refresh
            try {
                sessionStorage.setItem('lumiqe-outfit', JSON.stringify(data));
            } catch { /* ignore */ }

            // Track used product URLs for dedup
            const newUrls = extractProductUrls(data);
            setUsedProductUrls((prev) => [...prev, ...newUrls]);
        } catch (err: unknown) {
            console.error('Shopping agent error:', err);
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col w-full max-w-lg mx-auto items-center min-h-screen p-6 relative z-10">
            {/* Header */}
            <div className="w-full flex justify-between items-center mb-8 pt-4">
                <Link
                    href="/dashboard"
                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition backdrop-blur-md border border-white/10"
                >
                    <ArrowLeft className="w-5 h-5 text-white" />
                </Link>
                <div className="flex flex-col items-center">
                    <h1 className="text-lg font-bold text-white">AI Stylist</h1>
                    <span className="text-xs text-red-400 font-medium tracking-wide">
                        8-Piece Outfit Builder
                    </span>
                </div>
                <AppMenu />
            </div>

            {/* ── Config Form ─────────────────────────────────── */}
            {!outfit && !loading && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full flex flex-col gap-6"
                >
                    {/* Palette Preview */}
                    <div className="flex flex-col gap-3 p-5 rounded-3xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
                        <h2 className="text-sm font-semibold text-white/70 uppercase tracking-widest text-center">
                            Your Palette
                        </h2>
                        <div className="flex gap-2 justify-center flex-wrap">
                            {paletteHexes.map((hex, i) => (
                                <div
                                    key={i}
                                    className="w-9 h-9 rounded-xl border border-white/20 shadow-inner hover:scale-110 transition-transform"
                                    style={{ backgroundColor: hex }}
                                    title={hex}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Gender */}
                    <div className="flex flex-col gap-3 p-5 rounded-3xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
                        <h2 className="text-sm font-semibold text-white/70 uppercase tracking-widest text-center">
                            Gender
                        </h2>
                        <div className="flex gap-2">
                            {(['male', 'female'] as const).map((g) => (
                                <button
                                    key={g}
                                    onClick={() => setGender(g)}
                                    className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all border ${gender === g
                                        ? 'bg-white text-black border-white'
                                        : 'bg-transparent text-white/50 border-white/10 hover:border-white/20'
                                        }`}
                                >
                                    {g === 'male' ? "Men's" : "Women's"}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={generateOutfit}
                        className="w-full py-4 rounded-full bg-white text-black font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.15)]"
                    >
                        <Sparkles className="w-5 h-5" />
                        Generate Outfit
                    </button>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20"
                        >
                            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                            <p className="text-red-200 text-sm">{error}</p>
                        </motion.div>
                    )}
                </motion.div>
            )}

            {/* ── Loading State ───────────────────────────────── */}
            {loading && <StylistLoader paletteHexes={paletteHexes} />}

            {/* ── Result State ────────────────────────────────── */}
            {outfit && !loading && (
                <div className="w-full flex flex-col gap-6 pb-20">
                    <OutfitDisplay outfit={outfit} />

                    <button
                        onClick={generateOutfit}
                        className="mx-auto px-6 py-3 rounded-full border border-white/20 text-white hover:bg-white/10 transition-all text-sm font-semibold flex items-center gap-2"
                    >
                        <RefreshCcw className="w-4 h-4" />
                        Generate New Outfit
                        {outfitCount > 0 && (
                            <span className="text-white/40 text-xs">#{outfitCount + 1}</span>
                        )}
                    </button>

                    {usedProductUrls.length > 0 && (
                        <p className="text-center text-white/20 text-[10px] tracking-wider">
                            {usedProductUrls.length} items excluded from next generation
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
//    STYLIST LOADER — Premium animated loading experience
// ═══════════════════════════════════════════════════════════════

import { motion } from 'framer-motion';

function StylistLoader({ paletteHexes }: { paletteHexes: string[] }) {
    const [stepIdx, setStepIdx] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setStepIdx((prev) => (prev + 1) % LOADING_STEPS.length);
        }, 2500);
        return () => clearInterval(timer);
    }, []);

    const step = LOADING_STEPS[stepIdx];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center gap-8 py-20 w-full"
        >
            {/* Original overlapping breathing circles */}
            <div className="relative w-24 h-24 mb-6">
                {paletteHexes.slice(0, 6).map((hex, i) => {
                    const angle = (i * Math.PI) / 3;
                    return (
                        <motion.div
                            key={i}
                            className="absolute w-10 h-10 rounded-full opacity-80 mix-blend-screen"
                            style={{
                                backgroundColor: hex,
                                top: '50%',
                                left: '50%',
                                marginTop: -20,
                                marginLeft: -20,
                            }}
                            animate={{
                                x: [
                                    Math.cos(angle) * 15,
                                    Math.cos(angle) * 25,
                                    Math.cos(angle) * 15,
                                ],
                                y: [
                                    Math.sin(angle) * 15,
                                    Math.sin(angle) * 25,
                                    Math.sin(angle) * 15,
                                ],
                            }}
                            transition={{
                                duration: 2.5,
                                repeat: Infinity,
                                ease: 'easeInOut',
                            }}
                        />
                    );
                })}
                <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
                </div>
            </div>

            {/* Animated step text */}
            <motion.div
                key={stepIdx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center gap-3"
            >
                <span className="text-2xl">{step.icon}</span>
                <p className="text-white/60 text-sm font-medium tracking-wide text-center">
                    {step.text}
                </p>
            </motion.div>

            {/* Progress dots */}
            <div className="flex gap-2">
                {LOADING_STEPS.map((_, i) => (
                    <div
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i <= stepIdx ? 'bg-red-400 scale-100' : 'bg-white/10 scale-75'
                            }`}
                    />
                ))}
            </div>
        </motion.div>
    );
}

export default function ShoppingAgentPage() {
    return (
        <AppLayout>
            <Suspense
                fallback={
                    <div className="flex flex-col items-center justify-center min-h-[60vh] text-on-surface-variant gap-4">
                        <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                        <p className="font-label text-sm">Loading AI Stylist…</p>
                    </div>
                }
            >
                <ShoppingAgentContent />
            </Suspense>
        </AppLayout>
    );
}
