'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Sparkles, ArrowLeft, Camera, ShoppingBag, MessageCircle,
    User, Scissors, LayoutGrid, ChevronRight, Clock,
    Droplets, Zap, Star, BookOpen, Shirt
} from 'lucide-react';

interface AnalysisEntry {
    season: string;
    hexColor: string;
    undertone: string;
    confidence: number;
    contrastLevel: string;
    palette: string[];
    metal: string;
    timestamp: number;
}

interface BodyShapeData { shape: string; timestamp: number; }
interface StylePersonalityData { personality: string; timestamp: number; }

const SHAPE_LABELS: Record<string, string> = {
    hourglass: 'Hourglass', pear: 'Pear', apple: 'Apple',
    rectangle: 'Rectangle', inverted_triangle: 'Inverted Triangle',
};
const SHAPE_EMOJIS: Record<string, string> = {
    hourglass: '⌛', pear: '🍐', apple: '🍎', rectangle: '▭', inverted_triangle: '▽',
};
const PERSONALITY_LABELS: Record<string, string> = {
    classic: 'The Classic', romantic: 'The Romantic', edgy: 'The Edgy',
    boho: 'The Bohemian', minimalist: 'The Minimalist',
};
const PERSONALITY_EMOJIS: Record<string, string> = {
    classic: '👔', romantic: '🌸', edgy: '⚡', boho: '🌿', minimalist: '◼',
};

const SKINCARE: Record<string, { routine: string[]; ingredients: string[]; avoid: string[] }> = {
    warm: {
        routine: ['Oil cleanser to remove daily grime', 'Vitamin C serum for glow', 'SPF 30+ — warm-toned faces show sun damage easily', 'Hydrating moisturiser with ceramides'],
        ingredients: ['Vitamin C', 'Retinol', 'Niacinamide', 'Ceramides', 'Rosehip oil'],
        avoid: ['Heavy silicone-based formulas that dull your natural warmth', 'Purple-toned primers'],
    },
    cool: {
        routine: ['Gentle foam cleanser', 'Hyaluronic acid serum for hydration', 'Broad-spectrum SPF 50', 'Lightweight gel moisturiser'],
        ingredients: ['Hyaluronic acid', 'Peptides', 'Centella Asiatica', 'Niacinamide', 'Alpha Arbutin'],
        avoid: ['Orange or bronzing products that fight your cool undertone', 'Heavy oils that cause redness'],
    },
    neutral: {
        routine: ['Micellar water or balancing cleanser', 'Antioxidant serum morning', 'SPF 30+ daily', 'Barrier repair moisturiser'],
        ingredients: ['Vitamin E', 'Green tea extract', 'Zinc', 'Squalane', 'Peptides'],
        avoid: ['Extremes — overly cooling or warming formulas can throw your balance off'],
    },
};

function timeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

export default function Dashboard() {
    const [lastAnalysis, setLastAnalysis] = useState<AnalysisEntry | null>(null);
    const [history, setHistory] = useState<AnalysisEntry[]>([]);
    const [bodyShape, setBodyShape] = useState<BodyShapeData | null>(null);
    const [stylePersonality, setStylePersonality] = useState<StylePersonalityData | null>(null);

    useEffect(() => {
        try {
            const last = localStorage.getItem('lumiqe-last-analysis');
            if (last) setLastAnalysis(JSON.parse(last));
            const hist = localStorage.getItem('lumiqe-history');
            if (hist) setHistory(JSON.parse(hist));
            const bs = localStorage.getItem('lumiqe-body-shape');
            if (bs) setBodyShape(JSON.parse(bs));
            const sp = localStorage.getItem('lumiqe-style-personality');
            if (sp) setStylePersonality(JSON.parse(sp));
        } catch { /* ignore */ }
    }, []);

    const skincare = lastAnalysis ? SKINCARE[lastAnalysis.undertone] ?? SKINCARE.neutral : null;

    return (
        <main className="min-h-screen bg-transparent text-white font-sans pb-24">
            {/* Nav */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
                <Link href="/" className="text-white/60 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium">
                    <ArrowLeft className="w-4 h-4" />
                    Home
                </Link>
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-red-400" />
                    <span className="text-xl font-bold tracking-widest text-white">LUMIQE</span>
                </div>
                <div className="w-20" />
            </nav>

            <div className="max-w-4xl mx-auto px-4 pt-28 space-y-8">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                    <p className="text-red-400 text-sm font-bold tracking-widest uppercase mb-3">Your Style Hub</p>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-200 via-rose-300 to-white">
                        Dashboard
                    </h1>
                </motion.div>

                {/* ── STYLE IDENTITY CARDS ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    {/* Color Season */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="bg-zinc-900/60 border border-white/10 rounded-3xl p-6 relative overflow-hidden"
                    >
                        {lastAnalysis && (
                            <div
                                className="absolute inset-0 opacity-10 rounded-3xl"
                                style={{ background: `radial-gradient(circle at top right, ${lastAnalysis.hexColor}, transparent 70%)` }}
                            />
                        )}
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles className="w-4 h-4 text-red-400" />
                            <p className="text-white/40 text-xs font-bold uppercase tracking-wider">Color Season</p>
                        </div>
                        {lastAnalysis ? (
                            <>
                                <div
                                    className="w-12 h-12 rounded-2xl border border-white/20 mb-3"
                                    style={{ backgroundColor: lastAnalysis.hexColor }}
                                />
                                <p className="text-xl font-bold text-white">{lastAnalysis.season}</p>
                                <p className="text-white/40 text-xs mt-1 capitalize">{lastAnalysis.undertone} undertone · {lastAnalysis.contrastLevel} contrast</p>
                                <div className="flex gap-1.5 mt-3">
                                    {lastAnalysis.palette.slice(0, 5).map((c, i) => (
                                        <div key={i} className="w-6 h-6 rounded-full border border-white/20" style={{ backgroundColor: c }} />
                                    ))}
                                </div>
                                <Link href={`/results?season=${encodeURIComponent(lastAnalysis.season)}&hexColor=${encodeURIComponent(lastAnalysis.hexColor)}&undertone=${lastAnalysis.undertone}&confidence=${lastAnalysis.confidence}&contrastLevel=${lastAnalysis.contrastLevel}&metal=${lastAnalysis.metal}&palette=${lastAnalysis.palette.join(',')}`}
                                    className="mt-4 flex items-center gap-1 text-red-400 text-xs font-semibold hover:text-red-300 transition-colors">
                                    View full results <ChevronRight className="w-3 h-3" />
                                </Link>
                            </>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-white/40 text-sm mb-3">No analysis yet</p>
                                <Link href="/analyze" className="text-xs text-red-400 font-semibold hover:text-red-300">
                                    Start your scan →
                                </Link>
                            </div>
                        )}
                    </motion.div>

                    {/* Body Shape */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-zinc-900/60 border border-white/10 rounded-3xl p-6"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <User className="w-4 h-4 text-red-400" />
                            <p className="text-white/40 text-xs font-bold uppercase tracking-wider">Body Shape</p>
                        </div>
                        {bodyShape ? (
                            <>
                                <div className="text-4xl mb-2">{SHAPE_EMOJIS[bodyShape.shape] ?? '▭'}</div>
                                <p className="text-xl font-bold text-white">{SHAPE_LABELS[bodyShape.shape] ?? bodyShape.shape}</p>
                                <p className="text-white/40 text-xs mt-1">{timeAgo(bodyShape.timestamp)}</p>
                                <Link href="/quiz/body-shape" className="mt-4 flex items-center gap-1 text-red-400 text-xs font-semibold hover:text-red-300 transition-colors">
                                    Retake quiz <ChevronRight className="w-3 h-3" />
                                </Link>
                            </>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-white/40 text-sm mb-3">Not taken yet</p>
                                <Link href="/quiz/body-shape" className="inline-flex items-center gap-1.5 text-xs bg-red-600/20 text-red-300 border border-red-500/20 px-3 py-1.5 rounded-full font-semibold hover:bg-red-600/30 transition-colors">
                                    Take quiz →
                                </Link>
                            </div>
                        )}
                    </motion.div>

                    {/* Style Personality */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="bg-zinc-900/60 border border-white/10 rounded-3xl p-6"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <Star className="w-4 h-4 text-red-400" />
                            <p className="text-white/40 text-xs font-bold uppercase tracking-wider">Style Personality</p>
                        </div>
                        {stylePersonality ? (
                            <>
                                <div className="text-4xl mb-2">{PERSONALITY_EMOJIS[stylePersonality.personality] ?? '✦'}</div>
                                <p className="text-xl font-bold text-white">{PERSONALITY_LABELS[stylePersonality.personality] ?? stylePersonality.personality}</p>
                                <p className="text-white/40 text-xs mt-1">{timeAgo(stylePersonality.timestamp)}</p>
                                <Link href="/quiz/style" className="mt-4 flex items-center gap-1 text-red-400 text-xs font-semibold hover:text-red-300 transition-colors">
                                    Retake quiz <ChevronRight className="w-3 h-3" />
                                </Link>
                            </>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-white/40 text-sm mb-3">Not taken yet</p>
                                <Link href="/quiz/style" className="inline-flex items-center gap-1.5 text-xs bg-red-600/20 text-red-300 border border-red-500/20 px-3 py-1.5 rounded-full font-semibold hover:bg-red-600/30 transition-colors">
                                    Take quiz →
                                </Link>
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* ── QUICK ACTIONS ── */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-4">Quick Actions</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { label: 'New Scan', icon: <Camera className="w-5 h-5" />, href: '/analyze', color: 'bg-red-600/20 border-red-500/20 hover:bg-red-600/30' },
                            { label: 'Shop Colors', icon: <ShoppingBag className="w-5 h-5" />, href: '/feed', color: 'bg-white/5 border-white/10 hover:bg-white/10' },
                            { label: 'AI Stylist', icon: <MessageCircle className="w-5 h-5" />, href: lastAnalysis ? `/results?season=${encodeURIComponent(lastAnalysis.season)}&hexColor=${encodeURIComponent(lastAnalysis.hexColor)}&undertone=${lastAnalysis.undertone}&confidence=${lastAnalysis.confidence}&contrastLevel=${lastAnalysis.contrastLevel}&metal=${lastAnalysis.metal}&palette=${lastAnalysis.palette.join(',')}` : '/analyze', color: 'bg-white/5 border-white/10 hover:bg-white/10' },
                            { label: 'Buy or Pass', icon: <Shirt className="w-5 h-5" />, href: '/scan', color: 'bg-white/5 border-white/10 hover:bg-white/10' },
                        ].map((action, i) => (
                            <Link key={i} href={action.href}
                                className={`flex flex-col items-center gap-2 p-5 rounded-2xl border text-white/70 hover:text-white transition-all ${action.color}`}>
                                {action.icon}
                                <span className="text-xs font-semibold">{action.label}</span>
                            </Link>
                        ))}
                    </div>
                </motion.div>

                {/* ── DISCOVERY QUIZZES ── */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                    <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-4">Analysis & Discovery</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Link href="/quiz/body-shape"
                            className="flex items-center gap-4 bg-zinc-900/60 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all group">
                            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center flex-shrink-0 text-2xl">⌛</div>
                            <div className="flex-1">
                                <p className="text-white font-semibold text-sm">Body Shape Analysis</p>
                                <p className="text-white/40 text-xs mt-0.5">6 questions · Find your silhouette</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" />
                        </Link>

                        <Link href="/quiz/style"
                            className="flex items-center gap-4 bg-zinc-900/60 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all group">
                            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 flex items-center justify-center flex-shrink-0 text-2xl">✨</div>
                            <div className="flex-1">
                                <p className="text-white font-semibold text-sm">Style Personality Quiz</p>
                                <p className="text-white/40 text-xs mt-0.5">10 questions · Discover your aesthetic</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" />
                        </Link>
                    </div>
                </motion.div>

                {/* ── SKINCARE GUIDE ── */}
                {skincare && (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-4">Skincare Guide</p>
                        <div className="bg-zinc-900/60 border border-white/10 rounded-3xl p-6 space-y-5">
                            <div className="flex items-center gap-2">
                                <Droplets className="w-5 h-5 text-red-400" />
                                <p className="text-white font-bold">
                                    Routine for {lastAnalysis?.undertone} undertones
                                </p>
                            </div>

                            <div>
                                <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-3">Daily Routine</p>
                                <ol className="space-y-2">
                                    {skincare.routine.map((step, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-white/70">
                                            <span className="w-5 h-5 rounded-full bg-red-600/30 text-red-300 text-xs flex items-center justify-center flex-shrink-0 font-bold mt-0.5">{i + 1}</span>
                                            {step}
                                        </li>
                                    ))}
                                </ol>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-green-400 text-xs font-bold uppercase tracking-wider mb-2">Key Ingredients</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {skincare.ingredients.map((ing, i) => (
                                            <span key={i} className="text-xs bg-green-500/15 text-green-300 border border-green-500/25 px-2.5 py-1 rounded-full">
                                                {ing}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-red-400 text-xs font-bold uppercase tracking-wider mb-2">Avoid</p>
                                    <ul className="space-y-1">
                                        {skincare.avoid.map((item, i) => (
                                            <li key={i} className="text-xs text-white/50 flex items-start gap-1.5">
                                                <span className="text-red-400 mt-0.5">✕</span>{item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ── ANALYSIS HISTORY ── */}
                {history.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                        <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-4">Analysis History</p>
                        <div className="space-y-3">
                            {history.map((entry, i) => (
                                <Link
                                    key={i}
                                    href={`/results?season=${encodeURIComponent(entry.season)}&hexColor=${encodeURIComponent(entry.hexColor)}&undertone=${entry.undertone}&confidence=${entry.confidence}&contrastLevel=${entry.contrastLevel}&metal=${entry.metal}&palette=${entry.palette.join(',')}`}
                                    className="flex items-center gap-4 bg-zinc-900/60 border border-white/10 rounded-2xl p-4 hover:border-white/20 transition-all group"
                                >
                                    <div className="w-10 h-10 rounded-xl border border-white/20 flex-shrink-0"
                                        style={{ backgroundColor: entry.hexColor }} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-semibold text-sm truncate">{entry.season}</p>
                                        <p className="text-white/40 text-xs capitalize">{entry.undertone} · {entry.contrastLevel} contrast</p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <div className="flex gap-1 justify-end mb-1">
                                            {entry.palette.slice(0, 4).map((c, j) => (
                                                <div key={j} className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: c }} />
                                            ))}
                                        </div>
                                        <p className="text-white/30 text-xs flex items-center gap-1 justify-end">
                                            <Clock className="w-3 h-3" />{timeAgo(entry.timestamp)}
                                        </p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" />
                                </Link>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* ── CTA if no data ── */}
                {!lastAnalysis && (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="bg-red-950/30 border border-red-500/30 rounded-3xl p-8 text-center">
                        <Sparkles className="w-10 h-10 text-red-500 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-white mb-3">Start your color journey</h3>
                        <p className="text-white/60 max-w-sm mx-auto mb-6">
                            Take your first color analysis to unlock your full dashboard — season, skincare guide, history, and more.
                        </p>
                        <Link href="/analyze"
                            className="inline-flex items-center gap-2 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-8 transition-all hover:scale-105">
                            <Camera className="w-5 h-5" /> Scan My Colors
                        </Link>
                    </motion.div>
                )}

            </div>
        </main>
    );
}
