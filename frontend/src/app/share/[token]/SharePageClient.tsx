'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import CelebrityMatch from '@/components/CelebrityMatch';
import { API_BASE } from '@/lib/api';

interface ShareData {
    season: string;
    hex_color: string;
    undertone: string;
    confidence: number;
    contrast_level: string;
    palette: string[];
    metal: string;
}

export default function SharePageClient({ token }: { token: string }) {
    const [data, setData] = useState<ShareData | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    const baseShareUrl = typeof window !== 'undefined' ? window.location.href : '';

    const buildShareUrl = (source: string) => {
        const url = new URL(baseShareUrl || 'https://lumiqe.in');
        url.searchParams.set('utm_source', source);
        url.searchParams.set('utm_medium', 'social');
        url.searchParams.set('utm_campaign', 'share_result');
        return url.toString();
    };

    const copyLink = () => {
        navigator.clipboard.writeText(buildShareUrl('copy_link'));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    useEffect(() => {
        fetch(`${API_BASE}/api/share/${token}`)
            .then(res => res.ok ? res.json() : null)
            .then(d => setData(d))
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    }, [token]);

    if (loading) {
        return (
            <div className="min-h-screen bg-transparent flex flex-col items-center justify-center gap-4 text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl text-primary animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                <p>Loading shared analysis...</p>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-6 text-center">
                <span className="material-symbols-outlined text-6xl text-primary mb-6" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                <h1 className="text-3xl font-bold text-on-surface mb-4">Analysis Not Found</h1>
                <p className="text-on-surface-variant mb-8">This shared link may have expired or doesn&apos;t exist.</p>
                <Link href="/" className="px-6 py-3 bg-primary-container rounded-full text-on-primary-container font-medium hover:bg-primary transition-colors">
                    Discover Your Colors
                </Link>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-transparent text-on-surface font-sans pb-24">
            {/* Nav */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-b border-primary/10 px-6 py-4 flex items-center justify-center">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                    <span className="text-xl font-bold tracking-widest text-on-surface">LUMIQE</span>
                </div>
            </nav>

            <div className="max-w-2xl mx-auto px-4 pt-28">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
                    <p className="text-primary text-sm font-bold tracking-widest uppercase mb-3">Color Analysis Result</p>
                    <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-200 via-rose-300 to-white mb-6">
                        {data.season}
                    </h1>

                    {/* Skin color + info */}
                    <div className="flex items-center justify-center gap-6 mb-8">
                        <div
                            className="w-24 h-24 rounded-3xl border-2 border-primary/20 shadow-2xl"
                            style={{ backgroundColor: data.hex_color }}
                        />
                        <div className="text-left">
                            <p className="text-on-surface-variant text-sm capitalize">{data.undertone} undertone</p>
                            {data.contrast_level && (
                                <p className="text-on-surface-variant text-sm">{data.contrast_level} contrast</p>
                            )}
                            <p className="text-on-surface-variant text-sm">{Math.round(data.confidence * 100)}% confidence</p>
                            {data.metal && (
                                <p className="text-on-surface-variant text-sm">Best metal: {data.metal}</p>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Palette */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-surface-container/50 border border-primary/10 p-6 md:p-8 rounded-3xl mb-8"
                >
                    <h3 className="text-xl font-bold text-on-surface mb-5 text-center">Recommended Palette</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                        {data.palette.map((color, i) => (
                            <div
                                key={i}
                                className="aspect-square rounded-2xl shadow-inner border border-primary/10 flex items-end p-2"
                                style={{ backgroundColor: color }}
                            >
                                <span className="text-xs font-mono font-bold bg-black/50 text-on-surface px-1.5 py-0.5 rounded backdrop-blur-md w-full text-center truncate">
                                    {color}
                                </span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Celebrity Color Twins */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="mb-8"
                >
                    <CelebrityMatch celebrities={[]} season={data.season} />
                </motion.div>

                {/* Share Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-surface-container/50 border border-primary/10 p-6 rounded-3xl mb-8"
                >
                    <h3 className="text-lg font-bold text-on-surface mb-4">Share this result</h3>
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Check out this ${data.season} color analysis! \u{1F3A8} Discover your color season at ${buildShareUrl('whatsapp')}`)}`, '_blank')}
                            className="flex items-center gap-2 px-5 py-3 bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/30 rounded-xl text-sm font-semibold text-[#25D366] transition-all"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                            Share on WhatsApp
                        </button>
                        <button
                            onClick={copyLink}
                            className="flex items-center gap-2 px-4 py-2.5 bg-surface-container/30 hover:bg-surface-container/50 border border-primary/10 rounded-xl text-sm font-medium text-on-surface transition-all"
                        >
                            {copied ? <span className="material-symbols-outlined text-base text-green-400" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> : <span className="material-symbols-outlined text-base">content_copy</span>}
                            {copied ? 'Copied!' : 'Copy Link'}
                        </button>
                        <button
                            onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this ${data.season} color analysis!`)}&url=${encodeURIComponent(buildShareUrl('twitter'))}`, '_blank')}
                            className="flex items-center gap-2 px-4 py-2.5 bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/20 rounded-xl text-sm font-medium text-sky-300 transition-all"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                            Twitter/X
                        </button>
                    </div>
                </motion.div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="bg-primary/5 border border-primary/20 rounded-3xl p-8 md:p-12 text-center"
                >
                    <span className="material-symbols-outlined text-5xl text-primary block mx-auto mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                    <h3 className="text-2xl font-bold text-on-surface mb-3">Discover your own colors</h3>
                    <p className="text-on-surface-variant max-w-md mx-auto mb-6">
                        Find your exact color season in seconds with AI-powered analysis. Get your personalized palette, styling tips, and curated shopping recommendations.
                    </p>
                    <Link
                        href="/analyze"
                        className="inline-flex items-center gap-2 rounded-full bg-primary-container hover:bg-primary text-on-primary-container font-bold py-4 px-8 transition-all hover:scale-105"
                    >
                        Analyze My Colors <span className="material-symbols-outlined text-xl">arrow_forward</span>
                    </Link>
                </motion.div>
            </div>
        </main>
    );
}
