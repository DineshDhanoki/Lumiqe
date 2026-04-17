'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

import { useTranslation } from '@/lib/hooks/useTranslation';
import { timeAgo } from '@/lib/timeAgo';

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
        <div className="grid grid-cols-1 gap-6">
            {/* Color Season */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="bg-surface-container/50 border border-primary/10 rounded-3xl p-6 relative overflow-hidden"
            >
                {lastAnalysis && (
                    <div
                        className="absolute inset-0 opacity-10 rounded-3xl"
                        style={{ background: `radial-gradient(circle at top right, ${lastAnalysis.hexColor}, transparent 70%)` }}
                    />
                )}
                <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                    <p className="text-on-surface-variant text-xs font-label font-bold uppercase tracking-wider">{t('colorSeason')}</p>
                </div>
                {lastAnalysis ? (
                    <>
                        <div className="w-12 h-12 rounded-2xl border border-outline-variant/30 mb-3" style={{ backgroundColor: lastAnalysis.hexColor }} />
                        <p className="font-headline text-xl font-bold text-on-surface">{lastAnalysis.season}</p>
                        <p className="text-on-surface-variant text-xs mt-1 capitalize">{lastAnalysis.undertone} undertone · {lastAnalysis.contrastLevel} contrast</p>
                        <div className="flex gap-1.5 mt-3">
                            {lastAnalysis.palette.slice(0, 5).map((c) => (
                                <div key={`palette-${c}`} className="w-6 h-6 rounded-full border border-outline-variant/30" style={{ backgroundColor: c }} />
                            ))}
                        </div>
                        <Link href={resultsHref} className="mt-4 flex items-center gap-1 text-primary text-xs font-label font-semibold hover:text-primary/80 transition-colors">
                            {t('viewFullResults')} <span className="material-symbols-outlined text-sm">chevron_right</span>
                        </Link>
                    </>
                ) : (
                    <div className="text-center py-4">
                        <p className="text-on-surface-variant text-sm mb-3">{t('noAnalysisYet')}</p>
                        <Link href="/analyze" className="text-xs text-primary font-label font-semibold hover:text-primary/80">
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
                className="bg-surface-container/50 border border-primary/10 rounded-3xl p-6"
            >
                <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                    <p className="text-on-surface-variant text-xs font-label font-bold uppercase tracking-wider">{t('bodyShape')}</p>
                </div>
                {bodyShape ? (
                    <>
                        <div className="text-4xl mb-2">{SHAPE_EMOJIS[bodyShape.shape] ?? '▭'}</div>
                        <p className="font-headline text-xl font-bold text-on-surface">{SHAPE_LABELS[bodyShape.shape] ?? bodyShape.shape}</p>
                        <p className="text-on-surface-variant text-xs mt-1">{timeAgo(bodyShape.timestamp)}</p>
                        <Link href="/quiz/body-shape" className="mt-4 flex items-center gap-1 text-primary text-xs font-label font-semibold hover:text-primary/80 transition-colors">
                            {t('retakeQuiz')} <span className="material-symbols-outlined text-sm">chevron_right</span>
                        </Link>
                    </>
                ) : (
                    <div className="text-center py-4">
                        <p className="text-on-surface-variant text-sm mb-3">{t('notTakenYet')}</p>
                        <Link href="/quiz/body-shape" className="inline-flex items-center gap-1.5 text-xs bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-full font-label font-semibold hover:bg-primary/20 transition-colors">
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
                className="bg-surface-container/50 border border-primary/10 rounded-3xl p-6"
            >
                <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <p className="text-on-surface-variant text-xs font-label font-bold uppercase tracking-wider">{t('stylePersonality')}</p>
                </div>
                {stylePersonality ? (
                    <>
                        <div className="text-4xl mb-2">{PERSONALITY_EMOJIS[stylePersonality.personality] ?? '✦'}</div>
                        <p className="font-headline text-xl font-bold text-on-surface">{PERSONALITY_LABELS[stylePersonality.personality] ?? stylePersonality.personality}</p>
                        <p className="text-on-surface-variant text-xs mt-1">{timeAgo(stylePersonality.timestamp)}</p>
                        <Link href="/quiz/style" className="mt-4 flex items-center gap-1 text-primary text-xs font-label font-semibold hover:text-primary/80 transition-colors">
                            {t('retakeQuiz')} <span className="material-symbols-outlined text-sm">chevron_right</span>
                        </Link>
                    </>
                ) : (
                    <div className="text-center py-4">
                        <p className="text-on-surface-variant text-sm mb-3">{t('notTakenYet')}</p>
                        <Link href="/quiz/style" className="inline-flex items-center gap-1.5 text-xs bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-full font-label font-semibold hover:bg-primary/20 transition-colors">
                            {t('takeQuiz')}
                        </Link>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
