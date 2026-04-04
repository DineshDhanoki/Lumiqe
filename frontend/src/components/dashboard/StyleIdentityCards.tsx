'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, User, Star, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/lib/hooks/useTranslation';

const SHAPE_LABELS: Record<string, string> = {
    hourglass: 'Hourglass', pear: 'Pear', apple: 'Apple',
    rectangle: 'Rectangle', inverted_triangle: 'Inverted Triangle',
};
const SHAPE_EMOJIS: Record<string, string> = {
    hourglass: '⌛', pear: '🍐', apple: '🍎', rectangle: '▭', inverted_triangle: '▽',
};
const PERSONALITY_LABELS: Record<string, string> = {
    classic: 'The Classic', romantic: 'The Romantic', edgy: 'The Edgy',
    boho: 'The Bohemian', minimalist: 'The Minimalist',
};
const PERSONALITY_EMOJIS: Record<string, string> = {
    classic: '👔', romantic: '🌸', edgy: '⚡', boho: '🌿', minimalist: '◼',
};

function timeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

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

interface BodyShapeData { shape: string; timestamp: number; }
interface StylePersonalityData { personality: string; timestamp: number; }

interface Props {
    lastAnalysis: AnalysisEntry | null;
    bodyShape: BodyShapeData | null;
    stylePersonality: StylePersonalityData | null;
}

export default function StyleIdentityCards({ lastAnalysis, bodyShape, stylePersonality }: Props) {
    const { t } = useTranslation();

    const resultsHref = lastAnalysis
        ? `/results?season=${encodeURIComponent(lastAnalysis.season)}&hexColor=${encodeURIComponent(lastAnalysis.hexColor)}&undertone=${lastAnalysis.undertone}&confidence=${lastAnalysis.confidence}&contrastLevel=${lastAnalysis.contrastLevel}&metal=${lastAnalysis.metal}&palette=${lastAnalysis.palette.join(',')}`
        : '#';

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Color Season */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="bg-zinc-900/60 border border-white/10 rounded-3xl p-6 relative overflow-hidden"
            >
                {lastAnalysis && (
                    <div
                        className="absolute inset-0 opacity-10 rounded-3xl"
                        style={{ background: `radial-gradient(circle at top right, ${lastAnalysis.hexColor}, transparent 70%)` }}
                    />
                )}
                <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4 text-red-400" />
                    <p className="text-white/40 text-xs font-bold uppercase tracking-wider">{t('colorSeason')}</p>
                </div>
                {lastAnalysis ? (
                    <>
                        <div className="w-12 h-12 rounded-2xl border border-white/20 mb-3" style={{ backgroundColor: lastAnalysis.hexColor }} />
                        <p className="text-xl font-bold text-white">{lastAnalysis.season}</p>
                        <p className="text-white/40 text-xs mt-1 capitalize">{lastAnalysis.undertone} undertone · {lastAnalysis.contrastLevel} contrast</p>
                        <div className="flex gap-1.5 mt-3">
                            {lastAnalysis.palette.slice(0, 5).map((c) => (
                                <div key={`palette-${c}`} className="w-6 h-6 rounded-full border border-white/20" style={{ backgroundColor: c }} />
                            ))}
                        </div>
                        <Link href={resultsHref} className="mt-4 flex items-center gap-1 text-red-400 text-xs font-semibold hover:text-red-300 transition-colors">
                            {t('viewFullResults')} <ChevronRight className="w-3 h-3" />
                        </Link>
                    </>
                ) : (
                    <div className="text-center py-4">
                        <p className="text-white/40 text-sm mb-3">{t('noAnalysisYet')}</p>
                        <Link href="/analyze" className="text-xs text-red-400 font-semibold hover:text-red-300">
                            {t('startYourScan')}
                        </Link>
                    </div>
                )}
            </motion.div>

            {/* Body Shape */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-zinc-900/60 border border-white/10 rounded-3xl p-6"
            >
                <div className="flex items-center gap-2 mb-4">
                    <User className="w-4 h-4 text-red-400" />
                    <p className="text-white/40 text-xs font-bold uppercase tracking-wider">{t('bodyShape')}</p>
                </div>
                {bodyShape ? (
                    <>
                        <div className="text-4xl mb-2">{SHAPE_EMOJIS[bodyShape.shape] ?? '▭'}</div>
                        <p className="text-xl font-bold text-white">{SHAPE_LABELS[bodyShape.shape] ?? bodyShape.shape}</p>
                        <p className="text-white/40 text-xs mt-1">{timeAgo(bodyShape.timestamp)}</p>
                        <Link href="/quiz/body-shape" className="mt-4 flex items-center gap-1 text-red-400 text-xs font-semibold hover:text-red-300 transition-colors">
                            {t('retakeQuiz')} <ChevronRight className="w-3 h-3" />
                        </Link>
                    </>
                ) : (
                    <div className="text-center py-4">
                        <p className="text-white/40 text-sm mb-3">{t('notTakenYet')}</p>
                        <Link href="/quiz/body-shape" className="inline-flex items-center gap-1.5 text-xs bg-red-600/20 text-red-300 border border-red-500/20 px-3 py-1.5 rounded-full font-semibold hover:bg-red-600/30 transition-colors">
                            {t('takeQuiz')}
                        </Link>
                    </div>
                )}
            </motion.div>

            {/* Style Personality */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-zinc-900/60 border border-white/10 rounded-3xl p-6"
            >
                <div className="flex items-center gap-2 mb-4">
                    <Star className="w-4 h-4 text-red-400" />
                    <p className="text-white/40 text-xs font-bold uppercase tracking-wider">{t('stylePersonality')}</p>
                </div>
                {stylePersonality ? (
                    <>
                        <div className="text-4xl mb-2">{PERSONALITY_EMOJIS[stylePersonality.personality] ?? '✦'}</div>
                        <p className="text-xl font-bold text-white">{PERSONALITY_LABELS[stylePersonality.personality] ?? stylePersonality.personality}</p>
                        <p className="text-white/40 text-xs mt-1">{timeAgo(stylePersonality.timestamp)}</p>
                        <Link href="/quiz/style" className="mt-4 flex items-center gap-1 text-red-400 text-xs font-semibold hover:text-red-300 transition-colors">
                            {t('retakeQuiz')} <ChevronRight className="w-3 h-3" />
                        </Link>
                    </>
                ) : (
                    <div className="text-center py-4">
                        <p className="text-white/40 text-sm mb-3">{t('notTakenYet')}</p>
                        <Link href="/quiz/style" className="inline-flex items-center gap-1.5 text-xs bg-red-600/20 text-red-300 border border-red-500/20 px-3 py-1.5 rounded-full font-semibold hover:bg-red-600/30 transition-colors">
                            {t('takeQuiz')}
                        </Link>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
