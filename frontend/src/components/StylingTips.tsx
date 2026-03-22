'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, Sparkles } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface StylingTipsProps {
    season: string;
    contrastLevel: string;
    hexCode: string;
    staticTip?: string;
}

export default function StylingTips({ season, contrastLevel, hexCode, staticTip }: StylingTipsProps) {
    const [dynamicTip, setDynamicTip] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchTip = async () => {
            try {
                const params = new URLSearchParams({
                    season,
                    contrast_level: contrastLevel || 'Medium',
                    hex_code: hexCode || '#000000',
                });

                const res = await apiFetch(
                    `/api/generate-styling-tip?${params}`,
                    {},
                );

                if (!res.ok) {
                    setError(true);
                    return;
                }

                const data = await res.json();
                setDynamicTip(data.tip);
            } catch (err) {
                console.error('Failed to fetch styling tip:', err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchTip();
    }, [season, contrastLevel, hexCode]);

    const displayTip = dynamicTip || staticTip;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-zinc-900/50 border border-white/10 p-6 md:p-8 rounded-3xl relative overflow-hidden"
        >
            {/* Subtle glow behind the card */}
            <div
                className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-[0.06] blur-3xl pointer-events-none"
                style={{ background: `radial-gradient(circle, #fbbf24, transparent 70%)` }}
            />

            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                    <Lightbulb className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">Styling Tips</h3>
                    <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-yellow-500/60" />
                        <span className="text-[10px] font-medium text-yellow-500/60 uppercase tracking-widest">
                            AI-Powered
                        </span>
                    </div>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                /* ── Shimmer Loading State ────────────────── */
                <div className="space-y-3 pl-5 border-l-2 border-yellow-500/20">
                    <div className="h-4 w-full bg-white/5 rounded-lg animate-pulse" />
                    <div className="h-4 w-[90%] bg-white/5 rounded-lg animate-pulse" style={{ animationDelay: '0.1s' }} />
                    <div className="h-4 w-[75%] bg-white/5 rounded-lg animate-pulse" style={{ animationDelay: '0.2s' }} />
                </div>
            ) : displayTip ? (
                /* ── Generated Tip ────────────────────────── */
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <p className="text-white/80 text-lg leading-relaxed border-l-2 border-yellow-500/50 pl-5 font-light">
                        {displayTip}
                    </p>

                    {/* Source badge */}
                    {dynamicTip && (
                        <div className="mt-4 flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                            <span className="text-[10px] font-medium text-white/30 uppercase tracking-wider">
                                Generated for your {season} profile
                            </span>
                        </div>
                    )}
                </motion.div>
            ) : error ? (
                /* ── Error Fallback ───────────────────────── */
                <p className="text-white/50 text-base leading-relaxed border-l-2 border-white/10 pl-5 italic">
                    Personalized tips are temporarily unavailable. Your season is {season} —
                    lean into deep, rich tones and avoid anything too muted or washed out.
                </p>
            ) : null}
        </motion.div>
    );
}
