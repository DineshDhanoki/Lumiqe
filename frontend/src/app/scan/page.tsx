'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ArrowLeft, ShoppingBag, Sparkles, AlertCircle, Check, X } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import AppLayout from '@/components/layout/AppLayout';

interface ScanSuggestion {
    hex: string;
    name: string;
    delta_e: number;
}

interface ScanResult {
    item_hex: string;
    item_name: string;
    match_score: number;
    verdict: string;
    best_palette_match: string;
    suggestions: ScanSuggestion[];
}

export default function ScanPage() {
    const { data: session } = useSession();
    const [isScanning, setIsScanning] = useState(false);
    const [result, setResult] = useState<ScanResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleScan = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            setError('Please upload a valid image.');
            return;
        }

        setError(null);
        setIsScanning(true);
        setResult(null);

        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await apiFetch('/api/scan-item', {
                method: 'POST',
                body: formData,
            }, session);

            if (!res.ok) {
                const errData = await res.json();
                const detail = errData?.detail?.detail || errData?.detail || 'Scan failed';
                throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
            }

            const data: ScanResult = await res.json();
            setResult(data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Something went wrong.');
        } finally {
            setIsScanning(false);
        }
    };

    const verdictConfig = {
        BUY: { icon: <Check className="w-8 h-8" />, color: 'text-green-400', bg: 'bg-green-500/20 border-green-500/30', label: 'Buy It!' },
        MAYBE: { icon: <ShoppingBag className="w-8 h-8" />, color: 'text-yellow-400', bg: 'bg-yellow-500/20 border-yellow-500/30', label: 'Maybe...' },
        PASS: { icon: <X className="w-8 h-8" />, color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/30', label: 'Pass' },
    };

    // If user has no session and no email, show a CTA to analyze first
    const hasSession = !!session?.user?.email;

    return (
        <AppLayout>
            <div className="max-w-md mx-auto space-y-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-primary mb-2">Buy or Pass</p>
                    <h1 className="font-display text-4xl font-bold text-on-surface mb-2">Scan a Clothing Item</h1>
                    <p className="text-on-surface-variant text-sm">
                        Snap a photo and we&apos;ll tell you if it matches your palette.
                    </p>
                </motion.div>

                {!hasSession ? (
                    /* No palette CTA */
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 text-center"
                    >
                        <Sparkles className="w-12 h-12 text-red-400 mx-auto mb-4" />
                        <h2 className="text-xl font-bold mb-2">Scan Your Face First</h2>
                        <p className="text-white/60 text-sm mb-6">
                            We need to know your color season before we can match clothing. It takes 3 seconds.
                        </p>
                        <Link
                            href="/analyze"
                            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-full transition-all"
                        >
                            <Camera className="w-5 h-5" />
                            Analyze My Face
                        </Link>
                    </motion.div>
                ) : (
                    <>
                        {/* Upload Zone */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="relative"
                        >
                            <label className="flex flex-col items-center justify-center w-full min-h-[280px] rounded-3xl border-2 border-dashed border-white/20 bg-white/5 backdrop-blur-md cursor-pointer hover:bg-white/10 hover:border-white/30 transition-all overflow-hidden">
                                {isScanning ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="relative">
                                            <div className="w-16 h-16 rounded-full border-4 border-white/20 border-t-red-500 animate-spin" />
                                        </div>
                                        <p className="text-white/70 font-medium animate-pulse">Analyzing colors...</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-4 p-8">
                                        <div className="p-4 rounded-full bg-white/10">
                                            <Camera className="w-10 h-10 text-white" />
                                        </div>
                                        <div className="text-center space-y-1">
                                            <p className="text-lg font-medium text-white">Tap to Upload</p>
                                            <p className="text-sm text-white/50">Photo of a clothing item</p>
                                        </div>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={(e) => e.target.files?.[0] && handleScan(e.target.files[0])}
                                    disabled={isScanning}
                                />
                            </label>
                        </motion.div>

                        {/* Error */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="flex items-center gap-3 bg-red-900/50 border border-red-500/30 text-red-200 px-5 py-3 rounded-2xl text-sm"
                                >
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Result Card */}
                        <AnimatePresence>
                            {result && (
                                <motion.div
                                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ type: 'spring', damping: 20 }}
                                    className="space-y-6"
                                >
                                    {/* Verdict Card */}
                                    <div className={`rounded-3xl border p-6 ${verdictConfig[result.verdict as keyof typeof verdictConfig]?.bg || 'bg-zinc-900/50 border-white/10'}`}>
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className={verdictConfig[result.verdict as keyof typeof verdictConfig]?.color}>
                                                    {verdictConfig[result.verdict as keyof typeof verdictConfig]?.icon}
                                                </div>
                                                <div>
                                                    <h3 className="text-2xl font-bold text-white">
                                                        {verdictConfig[result.verdict as keyof typeof verdictConfig]?.label}
                                                    </h3>
                                                    <p className="text-white/60 text-sm">{result.item_name}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-4xl font-bold text-white">{result.match_score}%</span>
                                                <p className="text-white/50 text-xs">Match</p>
                                            </div>
                                        </div>

                                        {/* Color Comparison */}
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1 text-center">
                                                <div
                                                    className="w-full aspect-square rounded-2xl border border-white/10 mb-2"
                                                    style={{ backgroundColor: result.item_hex }}
                                                />
                                                <p className="text-xs text-white/50">Item Color</p>
                                                <p className="text-xs font-mono text-white/70">{result.item_hex}</p>
                                            </div>
                                            <div className="text-white/30 text-2xl font-light">vs</div>
                                            <div className="flex-1 text-center">
                                                <div
                                                    className="w-full aspect-square rounded-2xl border border-white/10 mb-2"
                                                    style={{ backgroundColor: result.best_palette_match }}
                                                />
                                                <p className="text-xs text-white/50">Best Match</p>
                                                <p className="text-xs font-mono text-white/70">{result.best_palette_match}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Suggestions */}
                                    {result.suggestions.length > 0 && result.match_score < 70 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 }}
                                            className="bg-zinc-900/50 border border-white/10 rounded-3xl p-6"
                                        >
                                            <h4 className="text-sm font-bold text-white/80 uppercase tracking-wider mb-4">
                                                Try These Instead
                                            </h4>
                                            <div className="flex gap-4">
                                                {result.suggestions.map((suggestion, idx) => (
                                                    <div key={idx} className="flex-1 text-center">
                                                        <div
                                                            className="w-full aspect-square rounded-2xl border border-white/10 mb-2 hover:scale-105 transition-transform"
                                                            style={{ backgroundColor: suggestion.hex }}
                                                        />
                                                        <p className="text-xs font-medium text-white/80">{suggestion.name}</p>
                                                        <p className="text-[10px] text-white/40 font-mono">{suggestion.hex}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Scan Again Button */}
                                    <button
                                        onClick={() => { setResult(null); setError(null); }}
                                        className="w-full py-3 rounded-full border border-white/10 text-white/70 hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
                                    >
                                        Scan Another Item
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </>
                )}
            </div>
        </AppLayout>
    );
}
