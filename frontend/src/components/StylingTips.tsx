'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
            className="bg-surface-container/50 border border-primary/10 p-6 md:p-8 rounded-3xl relative overflow-hidden"
        >
            {/* Subtle glow behind the card */}
            <div
                className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-[0.06] blur-3xl pointer-events-none"
                style={{ background: `radial-gradient(circle, #fbbf24, transparent 70%)` }}
            />

            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl text-yellow-400" style={{ fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
                </div>
                <div>
                    <h3 className="text-xl font-bold text-on-surface tracking-tight">Styling Tips</h3>
                    <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-xs text-yellow-500/60" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
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
                    <div className="h-4 w-full bg-surface-container/30 rounded-lg animate-pulse" />
                    <div className="h-4 w-[90%] bg-surface-container/30 rounded-lg animate-pulse" style={{ animationDelay: '0.1s' }} />
                    <div className="h-4 w-[75%] bg-surface-container/30 rounded-lg animate-pulse" style={{ animationDelay: '0.2s' }} />
                </div>
            ) : displayTip ? (
                /* ── Generated Tip ────────────────────────── */
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <p className="text-on-surface/80 text-lg leading-relaxed border-l-2 border-yellow-500/50 pl-5 font-light">
                        {displayTip}
                    </p>

                    {/* Source badge */}
                    {dynamicTip && (
                        <div className="mt-4 flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                            <span className="text-[10px] font-medium text-on-surface-variant/50 uppercase tracking-wider">
                                Generated for your {season} profile
                            </span>
                        </div>
                    )}
                </motion.div>
            ) : error ? (
                /* ── Error Fallback ───────────────────────── */
                <p className="text-on-surface-variant text-base leading-relaxed border-l-2 border-primary/20 pl-5 italic">
                    Personalized tips are temporarily unavailable. Your season is {season} —
                    lean into deep, rich tones and avoid anything too muted or washed out.
                </p>
            ) : null}
        </motion.div>
    );
}
