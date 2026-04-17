'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
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
        BUY: { icon: 'verified', color: 'text-primary-container', label: 'BUY VERDICT' },
        MAYBE: { icon: 'help', color: 'text-secondary', label: 'MAYBE' },
        PASS: { icon: 'cancel', color: 'text-on-surface-variant', label: 'PASS' },
    };

    const hasSession = !!session?.user?.email;

    return (
        <AppLayout>
            {/* Header */}
            <header className="mb-12 text-center md:text-left">
                <h1 className="font-display text-5xl md:text-6xl text-primary-container tracking-tight mb-2">Buy or Pass</h1>
                <p className="font-mono text-[10px] text-on-surface-variant/40 uppercase tracking-[0.3em]">
                    AI-Powered Aesthetic Validation System v2.4
                </p>
            </header>

            {!hasSession ? (
                /* No session CTA */
                <div
                    className="max-w-xl mx-auto rounded-3xl p-8 text-center"
                    style={{ background: 'rgba(19,19,21,0.6)', backdropFilter: 'blur(16px)', border: '0.5px solid rgba(196,151,62,0.15)' }}
                >
                    <span className="material-symbols-outlined text-6xl text-primary block mx-auto mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                    <h2 className="font-headline font-bold text-xl mb-2">Scan Your Face First</h2>
                    <p className="text-on-surface-variant text-sm mb-6">
                        We need to know your color season before we can match clothing. It takes 3 seconds.
                    </p>
                    <Link
                        href="/analyze"
                        className="inline-flex items-center gap-2 bg-primary-container text-on-primary font-headline font-bold py-3 px-6 rounded-[10px] text-xs uppercase tracking-widest hover:opacity-90 transition-all"
                    >
                        <span className="material-symbols-outlined text-base">photo_camera</span>
                        Analyze My Face
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    {/* Left: Scanner Area */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="relative aspect-square w-full max-w-xl mx-auto lg:mx-0 group">
                            {/* Scanner Frame */}
                            <label className="absolute inset-0 border-2 border-dashed border-primary/20 rounded-3xl flex flex-col items-center justify-center bg-surface-container-low/30 cursor-pointer hover:border-primary/30 transition-all overflow-hidden">
                                {isScanning ? (
                                    <div className="flex flex-col items-center gap-4 p-8 text-center">
                                        <span className="material-symbols-outlined text-5xl text-primary/40 animate-pulse">document_scanner</span>
                                        <p className="text-on-surface-variant font-medium text-sm">Analyzing colors...</p>
                                        {/* Scanner line */}
                                        <div className="absolute w-full h-0.5 top-1/2 left-0"
                                            style={{ background: 'linear-gradient(90deg, transparent, #c4973e, transparent)', boxShadow: '0 0 15px #c4973e' }}
                                        />
                                    </div>
                                ) : result ? (
                                    <div className="flex flex-col items-center gap-4 p-8 text-center">
                                        <div
                                            className="w-20 h-20 rounded-2xl border border-primary/20 mb-2"
                                            style={{ backgroundColor: result.item_hex }}
                                        />
                                        <p className="text-on-surface text-sm font-medium">{result.item_name}</p>
                                        <p className="text-on-surface-variant/50 text-xs">Tap to scan a new item</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center text-center p-12 transition-all duration-700 group-hover:scale-105">
                                        <span className="material-symbols-outlined text-6xl text-primary/40 mb-6">document_scanner</span>
                                        <h3 className="font-headline text-xl font-semibold text-on-surface mb-2">Upload or Frame Item</h3>
                                        <p className="text-on-surface-variant text-sm max-w-xs">
                                            Capture a product photo for instant color compatibility analysis.
                                        </p>
                                        <div
                                            className="mt-8 px-8 py-3 font-headline font-bold text-xs uppercase tracking-widest text-on-primary rounded-[10px] hover:opacity-90 transition-all"
                                            style={{ background: 'linear-gradient(to right, #c4973e, #f0bf62)' }}
                                        >
                                            Select Image
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
                            {/* Ambient glow */}
                            <div className="absolute -inset-4 bg-primary/5 blur-3xl rounded-[3rem] -z-10" />
                        </div>

                        {/* AI Processing */}
                        <div
                            className="flex items-center gap-6 p-6 rounded-2xl"
                            style={{ background: 'rgba(19,19,21,0.6)', backdropFilter: 'blur(16px)', border: '0.5px solid rgba(196,151,62,0.15)' }}
                        >
                            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-secondary-container/20 text-secondary shrink-0">
                                <span className="material-symbols-outlined">model_training</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="font-mono text-[10px] text-secondary uppercase tracking-widest">Neural Texture Analysis</span>
                                    <span className="font-mono text-[10px] text-on-surface-variant/60">
                                        {isScanning ? 'Processing...' : 'Ready'}
                                    </span>
                                </div>
                                <div className="h-1 w-full bg-on-surface/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-secondary rounded-full transition-all duration-500"
                                        style={{ width: isScanning ? '75%' : result ? '100%' : '0%' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Error */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="flex items-center gap-3 bg-primary/5 border border-primary/20 text-primary px-5 py-3 rounded-2xl text-sm"
                                >
                                    <span className="material-symbols-outlined text-xl shrink-0">error</span>
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Right: Result Card */}
                    <AnimatePresence>
                        {result && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="lg:col-span-5 space-y-6"
                            >
                                {/* Verdict Card */}
                                <div
                                    className="rounded-3xl p-8 overflow-hidden relative"
                                    style={{ background: 'rgba(19,19,21,0.6)', backdropFilter: 'blur(16px)', border: '0.5px solid rgba(196,151,62,0.15)' }}
                                >
                                    <div className="absolute top-0 right-0 p-4">
                                        <span className="px-3 py-1 rounded-full bg-primary/10 text-primary-container font-mono text-[10px] uppercase tracking-tighter">
                                            Verified Result
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-primary-container text-on-primary shrink-0">
                                            <span className="material-symbols-outlined text-2xl"
                                                style={{ fontVariationSettings: "'FILL' 1" }}>
                                                {verdictConfig[result.verdict as keyof typeof verdictConfig]?.icon || 'help'}
                                            </span>
                                        </div>
                                        <div>
                                            <div className={`font-headline text-2xl font-bold ${verdictConfig[result.verdict as keyof typeof verdictConfig]?.color || 'text-primary-container'}`}>
                                                {verdictConfig[result.verdict as keyof typeof verdictConfig]?.label || result.verdict}
                                            </div>
                                            <div className="text-on-surface-variant/40 text-xs font-mono tracking-widest mt-0.5">
                                                {result.item_name}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        {/* Match % bar */}
                                        <div className="relative pt-2">
                                            <div className="flex justify-between items-end mb-2">
                                                <span className="font-headline text-sm text-on-surface/80">Style Compatibility</span>
                                                <span className="font-display text-4xl font-bold text-primary-container">{result.match_score}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-on-surface/5 rounded-full">
                                                <div
                                                    className="h-full rounded-full"
                                                    style={{
                                                        width: `${result.match_score}%`,
                                                        background: 'linear-gradient(to right, #c4973e, #f0bf62)',
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Color comparison */}
                                        <div>
                                            <h4 className="font-label text-xs uppercase tracking-[0.2em] text-on-surface-variant/40 mb-4">
                                                Chroma Alignment
                                            </h4>
                                            <div className="flex gap-4 items-center">
                                                <div className="flex-1 space-y-2">
                                                    <div className="text-[9px] font-mono text-on-surface-variant/30 uppercase">Detected</div>
                                                    <div
                                                        className="h-12 w-full rounded-[10px] flex items-center justify-center text-[10px] font-mono text-on-surface/40"
                                                        style={{ backgroundColor: result.item_hex }}
                                                    >
                                                        {result.item_hex}
                                                    </div>
                                                </div>
                                                <span className="material-symbols-outlined text-on-surface-variant/20 mt-4">compare_arrows</span>
                                                <div className="flex-1 space-y-2">
                                                    <div className="text-[9px] font-mono text-on-surface-variant/30 uppercase">Your Palette</div>
                                                    <div
                                                        className="h-12 w-full rounded-[10px] border border-primary/30 flex items-center justify-center text-[10px] font-mono text-primary/60"
                                                        style={{ backgroundColor: result.best_palette_match }}
                                                    >
                                                        {result.best_palette_match}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="grid grid-cols-2 gap-4 pt-2">
                                            <button
                                                onClick={() => { setResult(null); setError(null); }}
                                                className="px-6 py-4 rounded-2xl font-headline font-bold text-xs uppercase tracking-widest text-primary-container hover:bg-primary/5 transition-all"
                                                style={{ background: 'rgba(19,19,21,0.6)', border: '0.5px solid rgba(196,151,62,0.15)' }}
                                            >
                                                Scan Again
                                            </button>
                                            <Link
                                                href="/feed"
                                                className="px-6 py-4 bg-primary-container text-on-primary rounded-2xl font-headline font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all text-center"
                                            >
                                                Shop Similar
                                            </Link>
                                        </div>
                                    </div>
                                </div>

                                {/* Suggestions */}
                                {result.suggestions.length > 0 && result.match_score < 70 && (
                                    <div
                                        className="rounded-3xl p-6"
                                        style={{ background: 'rgba(19,19,21,0.6)', backdropFilter: 'blur(16px)', border: '0.5px solid rgba(196,151,62,0.15)' }}
                                    >
                                        <h3 className="font-display text-xl text-on-surface mb-4">Premium Alternatives</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            {result.suggestions.map((suggestion, idx) => (
                                                <div key={idx}
                                                    className="rounded-2xl p-3 cursor-pointer group"
                                                    style={{ background: 'rgba(19,19,21,0.6)', border: '0.5px solid rgba(196,151,62,0.15)' }}
                                                >
                                                    <div
                                                        className="aspect-square rounded-[10px] mb-3 group-hover:scale-105 transition-transform"
                                                        style={{ backgroundColor: suggestion.hex }}
                                                    />
                                                    <div className="font-headline text-[11px] font-bold text-on-surface uppercase truncate">
                                                        {suggestion.name}
                                                    </div>
                                                    <div className="font-mono text-[9px] text-on-surface-variant/30">{suggestion.hex}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* When no result yet — empty state right column */}
                    {!result && (
                        <div className="lg:col-span-5 hidden lg:flex items-center justify-center min-h-[400px]">
                            <div className="text-center space-y-4">
                                <span className="material-symbols-outlined text-6xl text-on-surface-variant/20 block">
                                    manage_search
                                </span>
                                <p className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant/30">
                                    Awaiting scan input
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </AppLayout>
    );
}
