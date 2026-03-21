'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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

    useEffect(() => {
        fetch(`${API_BASE}/api/share/${token}`)
            .then(res => res.ok ? res.json() : null)
            .then(d => setData(d))
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    }, [token]);

    if (loading) {
        return (
            <div className="min-h-screen bg-transparent flex flex-col items-center justify-center gap-4 text-white/50">
                <Sparkles className="w-8 h-8 text-red-500 animate-pulse" />
                <p>Loading shared analysis...</p>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-6 text-center">
                <Sparkles className="w-12 h-12 text-red-500 mb-6" />
                <h1 className="text-3xl font-bold text-white mb-4">Analysis Not Found</h1>
                <p className="text-white/60 mb-8">This shared link may have expired or doesn't exist.</p>
                <Link href="/" className="px-6 py-3 bg-red-600 rounded-full text-white font-medium hover:bg-red-500 transition-colors">
                    Discover Your Colors
                </Link>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-transparent text-white font-sans pb-24">
            {/* Nav */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-center">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-red-400" />
                    <span className="text-xl font-bold tracking-widest text-white">LUMIQE</span>
                </div>
            </nav>

            <div className="max-w-2xl mx-auto px-4 pt-28">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
                    <p className="text-red-400 text-sm font-bold tracking-widest uppercase mb-3">Color Analysis Result</p>
                    <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-200 via-rose-300 to-white mb-6">
                        {data.season}
                    </h1>

                    {/* Skin color + info */}
                    <div className="flex items-center justify-center gap-6 mb-8">
                        <div
                            className="w-24 h-24 rounded-3xl border-2 border-white/20 shadow-2xl"
                            style={{ backgroundColor: data.hex_color }}
                        />
                        <div className="text-left">
                            <p className="text-white/50 text-sm capitalize">{data.undertone} undertone</p>
                            {data.contrast_level && (
                                <p className="text-white/50 text-sm">{data.contrast_level} contrast</p>
                            )}
                            <p className="text-white/50 text-sm">{Math.round(data.confidence * 100)}% confidence</p>
                            {data.metal && (
                                <p className="text-white/50 text-sm">Best metal: {data.metal}</p>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Palette */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-zinc-900/50 border border-white/10 p-6 md:p-8 rounded-3xl mb-8"
                >
                    <h3 className="text-xl font-bold text-white mb-5 text-center">Recommended Palette</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                        {data.palette.map((color, i) => (
                            <div
                                key={i}
                                className="aspect-square rounded-2xl shadow-inner border border-white/10 flex items-end p-2"
                                style={{ backgroundColor: color }}
                            >
                                <span className="text-xs font-mono font-bold bg-black/50 text-white px-1.5 py-0.5 rounded backdrop-blur-md w-full text-center truncate">
                                    {color}
                                </span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-red-950/30 border border-red-500/30 rounded-3xl p-8 md:p-12 text-center"
                >
                    <Sparkles className="w-10 h-10 text-red-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-white mb-3">Discover your own colors</h3>
                    <p className="text-white/60 max-w-md mx-auto mb-6">
                        Find your exact color season in seconds with AI-powered analysis. Get your personalized palette, styling tips, and curated shopping recommendations.
                    </p>
                    <Link
                        href="/analyze"
                        className="inline-flex items-center gap-2 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 px-8 transition-all hover:scale-105"
                    >
                        Analyze My Colors <ArrowRight className="w-5 h-5" />
                    </Link>
                </motion.div>
            </div>
        </main>
    );
}
