'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

import { useTranslation } from '@/lib/hooks/useTranslation';
import { timeAgo } from '@/lib/timeAgo';

interface AnalysisEntry {
    id?: string;
    season: string;
    hexColor: string;
    undertone: string;
    confidence: number;
    contrastLevel: string;
    palette: string[];
    metal: string;
    timestamp: number;
}

interface Props {
    history: AnalysisEntry[];
}

export default function AnalysisHistory({ history }: Props) {
    const { t } = useTranslation();
    const [showAll, setShowAll] = useState(false);

    const visible = history.slice(0, showAll ? history.length : 10);

    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-4">{t('analysisHistory')}</p>
            <div className="space-y-3">
                {visible.map((entry) => (
                    <Link
                        key={entry.id || entry.timestamp}
                        href={entry.id ? `/results/${entry.id}` : `/results?season=${encodeURIComponent(entry.season)}&hexColor=${encodeURIComponent(entry.hexColor)}&undertone=${entry.undertone}&confidence=${entry.confidence}&contrastLevel=${entry.contrastLevel}&metal=${entry.metal}&palette=${entry.palette.join(',')}`}
                        className="flex items-center gap-4 bg-surface-container/50 border border-primary/10 rounded-2xl p-4 hover:border-primary/20 transition-all group"
                    >
                        <div className="w-10 h-10 rounded-xl border border-primary/20 flex-shrink-0" style={{ backgroundColor: entry.hexColor }} />
                        <div className="flex-1 min-w-0">
                            <p className="text-on-surface font-semibold text-sm truncate">{entry.season}</p>
                            <p className="text-on-surface-variant text-xs capitalize">{entry.undertone} · {entry.contrastLevel} contrast</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                            <div className="flex gap-1 justify-end mb-1">
                                {entry.palette.slice(0, 4).map((c) => (
                                    <div key={`history-${c}`} className="w-4 h-4 rounded-full border border-primary/10" style={{ backgroundColor: c }} />
                                ))}
                            </div>
                            <p className="text-on-surface-variant/50 text-xs flex items-center gap-1 justify-end">
                                <span className="material-symbols-outlined text-sm">schedule</span>{timeAgo(entry.timestamp)}
                            </p>
                        </div>
                        <span className="material-symbols-outlined text-lg text-on-surface-variant/30 group-hover:text-on-surface-variant transition-colors">chevron_right</span>
                    </Link>
                ))}
            </div>
            {history.length > 10 && !showAll && (
                <button
                    onClick={() => setShowAll(true)}
                    className="mt-3 w-full py-2 text-center text-sm text-on-surface-variant hover:text-on-surface transition-colors"
                >
                    Show all {history.length} analyses
                </button>
            )}
        </motion.div>
    );
}
