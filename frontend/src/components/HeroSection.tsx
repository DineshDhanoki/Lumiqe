'use client';

import { motion } from 'framer-motion';
import { AuroraBackground } from '@/components/ui/aurora-background';
import { useTranslation } from '@/lib/hooks/useTranslation';

interface HeroSectionProps {
    onOpenAuth: () => void;
}

export default function HeroSection({ onOpenAuth }: HeroSectionProps) {
    const { t } = useTranslation();

    return (
        <AuroraBackground className="p-6 text-center relative overflow-hidden">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="flex flex-col items-center gap-6 max-w-4xl w-full z-10"
            >
                <span className="font-label text-[10px] tracking-[0.3em] uppercase text-on-surface-variant/60 block">
                    AI Color Analysis
                </span>

                <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display leading-[0.95] tracking-tight text-on-surface drop-shadow-2xl">
                    {t('heroDiscoverYour')} <br className="hidden sm:block" />
                    <span className="italic text-primary">
                        {t('heroTrueColors')}
                    </span>
                </h1>

                <p className="max-w-2xl text-base sm:text-lg md:text-xl text-on-surface-variant leading-relaxed drop-shadow-md px-2 font-light">
                    {t('heroSubtitle')}
                </p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="flex flex-col sm:flex-row items-center gap-4 mt-8 w-full sm:w-auto"
                >
                    <button
                        onClick={onOpenAuth}
                        className="group relative flex items-center justify-center gap-2 w-full sm:w-auto rounded-full bg-gradient-to-r from-primary-container to-primary text-on-primary font-label font-bold text-sm uppercase tracking-widest py-4 px-8 shadow-[0_0_40px_-10px_rgba(240,191,98,0.3)] hover:shadow-[0_0_60px_-15px_rgba(240,191,98,0.5)] hover:opacity-90 active:scale-[0.98] transition-all"
                    >
                        <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                        {t('heroStartFreeTrial')}
                        <span className="material-symbols-outlined text-base group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                    </button>

                    <a
                        href="#demo"
                        aria-label={t('heroSeeLiveDemo')}
                        className="flex items-center justify-center gap-2 w-full sm:w-auto rounded-full bg-surface-container/50 hover:bg-surface-container text-on-surface font-label font-medium text-sm uppercase tracking-widest py-4 px-8 border border-outline-variant/20 hover:border-primary/30 backdrop-blur-md transition-all"
                    >
                        <span className="material-symbols-outlined text-base opacity-70">play_circle</span>
                        {t('heroSeeLiveDemo')}
                    </a>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mt-4 text-on-surface-variant text-xs font-mono tracking-wider"
                >
                    {t('heroNoCreditCard')}
                </motion.p>
            </motion.div>
        </AuroraBackground>
    );
}
