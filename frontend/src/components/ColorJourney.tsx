'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Clock, TrendingUp, AlertCircle } from 'lucide-react';

interface TrendPoint {
    id: string;
    season: string;
    hex_color: string;
    undertone: string;
    confidence: number;
    created_at: string | null;
}

interface Props {
    points: TrendPoint[];
    seasonChanged: boolean;
    nudge: string | null;
}

function formatDate(iso: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ColorJourney({ points, seasonChanged, nudge }: Props) {
    if (points.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
        >
            <div className="flex items-center justify-between">
                <p className="text-white/40 text-xs font-bold uppercase tracking-wider">Your Color Journey</p>
                {seasonChanged && (
                    <span className="text-xs bg-amber-500/15 text-amber-300 border border-amber-500/25 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> Season shifted
                    </span>
                )}
            </div>

            {/* Re-scan nudge */}
            {nudge && (
                <div className="flex items-start gap-3 bg-red-950/30 border border-red-500/20 rounded-2xl p-4">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm text-white/70">{nudge}</p>
                        <Link href="/analyze" className="text-xs text-red-400 font-semibold hover:text-red-300 mt-1 inline-block">
                            Scan again →
                        </Link>
                    </div>
                </div>
            )}

            {/* Timeline */}
            <div className="bg-zinc-900/60 border border-white/10 rounded-3xl p-6">
                <div className="relative">
                    {/* Vertical line */}
                    {points.length > 1 && (
                        <div className="absolute left-[19px] top-6 bottom-6 w-px bg-white/10" />
                    )}

                    <div className="space-y-6">
                        {points.slice(0, 10).map((point, i) => (
                            <Link
                                key={point.id}
                                href={`/results/${point.id}`}
                                className="flex items-center gap-4 group relative"
                            >
                                {/* Color swatch (on the timeline line) */}
                                <div
                                    className="w-10 h-10 rounded-xl border-2 border-white/20 flex-shrink-0 group-hover:scale-110 transition-transform z-10"
                                    style={{ backgroundColor: point.hex_color }}
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-semibold text-sm truncate group-hover:text-red-300 transition-colors">
                                        {point.season}
                                        {i === 0 && <span className="ml-2 text-xs text-red-400 font-normal">Latest</span>}
                                    </p>
                                    <p className="text-white/40 text-xs capitalize">
                                        {point.undertone} · {Math.round(point.confidence * 100)}% confidence
                                    </p>
                                </div>
                                <p className="text-white/30 text-xs flex items-center gap-1 flex-shrink-0">
                                    <Clock className="w-3 h-3" />
                                    {formatDate(point.created_at)}
                                </p>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
