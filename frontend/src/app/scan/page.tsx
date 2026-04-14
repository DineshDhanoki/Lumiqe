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
                        className="bg-surface-container/50 border border-primary/10 rounded-3xl p-8 text-center"
                    >
                        <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
                        <h2 className="text-xl font-bold mb-2">Scan Your Face First</h2>
                        <p className="text-on-surface-variant text-sm mb-6">
                            We need to know your color season before we can match clothing. It takes 3 seconds.
                        </p>
                        <Link
                            href="/analyze"
                            className="inline-flex items-center gap-2 bg-primary-container hover:bg-primary text-on-primary-container font-bold py-3 px-6 rounded-full transition-all"
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
                            <label className="flex flex-col items-center justify-center w-full min-h-[280px] rounded-3xl border-2 border-dashed border-primary/20 bg-surface-container/30 backdrop-blur-md cursor-pointer hover:bg-surface-container/30 hover:border-primary/30 transition-all overflow-hidden">
                                {isScanning ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="relative">
                                            <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-red-500 animate-spin" />
                                        </div>
                                        <p className="text-on-surface-variant font-medium animate-pulse">Analyzing colors...</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-4 p-8">
                                        <div className="p-4 rounded-full bg-surface-container/30">
                                            <Camera className="w-10 h-10 text-on-surface" />
                                        </div>
                                        <div className="text-center space-y-1">
                                            <p className="text-lg font-medium text-on-surface">Tap to Upload</p>
                                            <p className="text-sm text-on-surface-variant">Photo of a clothing item</p>
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
                                    className="flex items-center gap-3 bg-primary/5 border border-primary/20 text-primary px-5 py-3 rounded-2xl text-sm"
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
                                    <div className={`rounded-3xl border p-6 ${verdictConfig[result.verdict as keyof typeof verdictConfig]?.bg || 'bg-surface-container/50 border-primary/10'}`}>
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className={verdictConfig[result.verdict as keyof typeof verdictConfig]?.color}>
                                                    {verdictConfig[result.verdict as keyof typeof verdictConfig]?.icon}
                                                </div>
                                                <div>
                                                    <h3 className="text-2xl font-bold text-on-surface">
                                                        {verdictConfig[result.verdict as keyof typeof verdictConfig]?.label}
                                                    </h3>
                                                    <p className="text-on-surface-variant text-sm">{result.item_name}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-4xl font-bold text-on-surface">{result.match_score}%</span>
                                                <p className="text-on-surface-variant text-xs">Match</p>
                                            </div>
                                        </div>

                                        {/* Color Comparison */}
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1 text-center">
                                                <div
                                                    className="w-full aspect-square rounded-2xl border border-primary/10 mb-2"
                                                    style={{ backgroundColor: result.item_hex }}
                                                />
                                                <p className="text-xs text-on-surface-variant">Item Color</p>
                                                <p className="text-xs font-mono text-on-surface-variant">{result.item_hex}</p>
                                            </div>
                                            <div className="text-on-surface-variant/50 text-2xl font-light">vs</div>
                                            <div className="flex-1 text-center">
                                                <div
                                                    className="w-full aspect-square rounded-2xl border border-primary/10 mb-2"
                                                    style={{ backgroundColor: result.best_palette_match }}
                                                />
                                                <p className="text-xs text-on-surface-variant">Best Match</p>
                                                <p className="text-xs font-mono text-on-surface-variant">{result.best_palette_match}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Suggestions */}
                                    {result.suggestions.length > 0 && result.match_score < 70 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 }}
                                            className="bg-surface-container/50 border border-primary/10 rounded-3xl p-6"
                                        >
                                            <h4 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-4">
                                                Try These Instead
                                            </h4>
                                            <div className="flex gap-4">
                                                {result.suggestions.map((suggestion, idx) => (
                                                    <div key={idx} className="flex-1 text-center">
                                                        <div
                                                            className="w-full aspect-square rounded-2xl border border-primary/10 mb-2 hover:scale-105 transition-transform"
                                                            style={{ backgroundColor: suggestion.hex }}
                                                        />
                                                        <p className="text-xs font-medium text-on-surface-variant">{suggestion.name}</p>
                                                        <p className="text-[10px] text-on-surface-variant font-mono">{suggestion.hex}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Scan Again Button */}
                                    <button
                                        onClick={() => { setResult(null); setError(null); }}
                                        className="w-full py-3 rounded-full border border-primary/10 text-on-surface-variant hover:text-on-surface hover:bg-surface-container/30 transition-all text-sm font-medium"
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
