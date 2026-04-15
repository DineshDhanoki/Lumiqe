'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface AnalysisPoint {
    id: string;
    season: string;
    hex_color: string;
    undertone: string;
    confidence: number;
    contrast_level?: string;
    palette: string[];
    metal?: string;
    created_at: string | null;
}

interface Props {
    analyses: AnalysisPoint[];
}

function formatDate(iso: string | null): string {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function AnalysisCard({ analysis, label }: { analysis: AnalysisPoint; label: string }) {
    return (
        <div className="bg-surface-container/50 border border-primary/10 rounded-2xl p-5 flex-1 min-w-0">
            <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-3">{label}</p>
            <div className="flex items-center gap-3 mb-4">
                <div
                    className="w-14 h-14 rounded-2xl border-2 border-primary/20"
                    style={{ backgroundColor: analysis.hex_color }}
                />
                <div>
                    <p className="text-on-surface font-bold text-lg">{analysis.season}</p>
                    <p className="text-on-surface-variant text-xs capitalize">{analysis.undertone} · {Math.round(analysis.confidence * 100)}%</p>
                    <p className="text-on-surface-variant/50 text-xs">{formatDate(analysis.created_at)}</p>
                </div>
            </div>
            <div className="flex gap-1.5 flex-wrap">
                {analysis.palette.slice(0, 6).map((color, i) => (
                    <div
                        key={i}
                        className="w-8 h-8 rounded-lg border border-primary/10"
                        style={{ backgroundColor: color }}
                        title={color}
                    />
                ))}
            </div>
        </div>
    );
}

export default function CompareView({ analyses }: Props) {
    const [leftIdx, setLeftIdx] = useState(0);
    const [rightIdx, setRightIdx] = useState(analyses.length > 1 ? 1 : 0);

    if (analyses.length < 2) return null;

    const left = analyses[leftIdx];
    const right = analyses[rightIdx];
    const seasonChanged = left.season !== right.season;

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
        >
            <div className="flex items-center justify-between">
                <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">Compare Analyses</p>
                {seasonChanged && (
                    <span className="text-xs bg-amber-500/15 text-amber-300 border border-amber-500/25 px-2.5 py-1 rounded-full">
                        Different seasons
                    </span>
                )}
            </div>

            {/* Selectors */}
            <div className="flex gap-3 items-center">
                <select
                    value={leftIdx}
                    onChange={(e) => setLeftIdx(Number(e.target.value))}
                    className="flex-1 bg-surface-container/50 border border-primary/10 rounded-xl px-3 py-2 text-sm text-on-surface appearance-none"
                >
                    {analyses.map((a, i) => (
                        <option key={a.id} value={i}>
                            {a.season} — {formatDate(a.created_at)}
                        </option>
                    ))}
                </select>
                <span className="material-symbols-outlined text-xl text-on-surface-variant/50 flex-shrink-0">swap_horiz</span>
                <select
                    value={rightIdx}
                    onChange={(e) => setRightIdx(Number(e.target.value))}
                    className="flex-1 bg-surface-container/50 border border-primary/10 rounded-xl px-3 py-2 text-sm text-on-surface appearance-none"
                >
                    {analyses.map((a, i) => (
                        <option key={a.id} value={i}>
                            {a.season} — {formatDate(a.created_at)}
                        </option>
                    ))}
                </select>
            </div>

            {/* Side by side */}
            <div className="flex gap-4 flex-col sm:flex-row">
                <AnalysisCard analysis={left} label="Analysis A" />
                <AnalysisCard analysis={right} label="Analysis B" />
            </div>
        </motion.div>
    );
}
