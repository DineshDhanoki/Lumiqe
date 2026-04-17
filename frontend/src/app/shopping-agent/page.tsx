'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import OutfitDisplay, { CuratedOutfit } from '@/components/OutfitDisplay';
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
                <span className="material-symbols-outlined text-6xl text-primary mb-6" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                <h1 className="text-2xl font-bold text-on-surface mb-4">No Palette Found</h1>
                <p className="text-on-surface-variant mb-8 leading-relaxed">
                    You need to scan your face first so we know your skin-tone palette.
                    <br />
                    The AI Stylist matches outfits to <em>your</em> colors.
                </p>
                <Link
                    href="/"
                    className="px-6 py-3 bg-primary-container rounded-[10px] text-on-primary font-headline font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all"
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
        <div className="w-full">
            {/* Editorial Header */}
            <header className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-[9px] font-headline font-bold uppercase tracking-[0.2em]">AI Curated</span>
                </div>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="max-w-2xl">
                        <h1 className="font-display text-6xl md:text-8xl leading-tight tracking-tighter text-on-surface mb-4">
                            Your Curated <br/><span className="italic text-primary">Ensemble</span>
                        </h1>
                        <p className="text-on-surface-variant text-lg leading-relaxed max-w-lg">
                            Our AI agent synthesizes your style profile with current runway silhouettes to generate an 8-piece selection.
                        </p>
                    </div>
                </div>
            </header>

            {/* ── Config Form ─────────────────────────────────── */}
            {!outfit && !loading && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col gap-6 max-w-lg"
                >
                    {/* Palette Preview */}
                    <div className="flex flex-col gap-3 p-6 rounded-2xl bg-surface-container ghost-border">
                        <h2 className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/60">
                            Your Palette
                        </h2>
                        <div className="flex gap-2 flex-wrap">
                            {paletteHexes.map((hex, i) => (
                                <div
                                    key={i}
                                    className="w-9 h-9 rounded-xl border border-primary/20 shadow-inner hover:scale-110 transition-transform"
                                    style={{ backgroundColor: hex }}
                                    title={hex}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Gender */}
                    <div className="flex flex-col gap-3 p-6 rounded-2xl bg-surface-container ghost-border">
                        <h2 className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/60">
                            Gender
                        </h2>
                        <div className="flex gap-2">
                            {(['male', 'female'] as const).map((g) => (
                                <button
                                    key={g}
                                    onClick={() => setGender(g)}
                                    className={`flex-1 py-3 rounded-[10px] text-xs font-headline font-bold uppercase tracking-wider transition-all ${gender === g
                                        ? 'bg-primary-container text-on-primary shadow-sm'
                                        : 'bg-surface-container-high ghost-border text-on-surface-variant hover:text-on-surface'
                                        }`}
                                >
                                    {g === 'male' ? "Men's" : "Women's"}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={generateOutfit}
                        className="w-full py-4 rounded-[10px] bg-primary-container text-on-primary font-headline font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:opacity-90 active:scale-[0.98] transition-all"
                    >
                        <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                        Generate Ensemble
                    </button>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-start gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/20"
                        >
                            <span className="material-symbols-outlined text-xl text-primary shrink-0 mt-0.5">error</span>
                            <p className="text-primary text-sm">{error}</p>
                        </motion.div>
                    )}
                </motion.div>
            )}

            {/* ── Loading State ───────────────────────────────── */}
            {loading && <StylistLoader paletteHexes={paletteHexes} />}

            {/* ── Result State ────────────────────────────────── */}
            {outfit && !loading && (
                <div className="w-full flex flex-col gap-8 pb-20">
                    <OutfitDisplay outfit={outfit} />

                    <div className="flex justify-center">
                        <button
                            onClick={generateOutfit}
                            className="px-8 py-4 rounded-[10px] bg-primary-container text-on-primary font-headline font-bold uppercase tracking-widest text-xs flex items-center gap-3 hover:opacity-90 active:scale-95 transition-all"
                        >
                            <span className="material-symbols-outlined text-base">refresh</span>
                            Regenerate Ensemble
                            {outfitCount > 0 && (
                                <span className="font-mono text-[10px] opacity-60">#{outfitCount + 1}</span>
                            )}
                        </button>
                    </div>

                    {usedProductUrls.length > 0 && (
                        <p className="text-center text-on-surface-variant/30 font-mono text-[10px] tracking-wider">
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
                    <span className="material-symbols-outlined text-4xl text-on-surface-variant animate-spin">progress_activity</span>
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
                <p className="text-on-surface-variant text-sm font-medium tracking-wide text-center">
                    {step.text}
                </p>
            </motion.div>

            {/* Progress dots */}
            <div className="flex gap-2">
                {LOADING_STEPS.map((_, i) => (
                    <div
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i <= stepIdx ? 'bg-primary scale-100' : 'bg-surface-container/30 scale-75'
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
                        <span className="material-symbols-outlined text-4xl text-primary animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                        <p className="font-label text-sm">Loading AI Stylist…</p>
                    </div>
                }
            >
                <ShoppingAgentContent />
            </Suspense>
        </AppLayout>
    );
}
