'use client';

import { motion } from 'framer-motion';
import { ArrowRight, PlayCircle } from 'lucide-react';
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

                <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-on-surface drop-shadow-2xl">
                    {t('heroDiscoverYour')} <br className="hidden sm:block" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-container via-primary to-on-surface">
                        {t('heroTrueColors')}
                    </span>
                </h1>

                <p className="max-w-2xl text-base sm:text-lg md:text-xl text-on-surface-variant leading-relaxed drop-shadow-md px-2">
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
                        className="group relative flex items-center justify-center gap-2 w-full sm:w-auto rounded-full bg-primary-container hover:bg-primary text-on-primary-container font-bold text-lg py-4 px-8 shadow-[0_0_40px_-10px_rgba(240,191,98,0.3)] hover:shadow-[0_0_60px_-15px_rgba(240,191,98,0.5)] transition-all transform hover:scale-[1.02]"
                    >
                        {t('heroStartFreeTrial')}
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <a
                        href="#demo"
                        className="flex items-center justify-center gap-2 w-full sm:w-auto rounded-full bg-surface-container/50 hover:bg-surface-container text-on-surface font-medium text-lg py-4 px-8 border border-outline-variant/20 hover:border-outline-variant/50 backdrop-blur-md transition-all"
                    >
                        <PlayCircle className="w-5 h-5 opacity-70" />
                        {t('heroSeeLiveDemo')}
                    </a>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mt-4 text-on-surface-variant text-sm"
                >
                    {t('heroNoCreditCard')}
                </motion.p>
            </motion.div>
        </AuroraBackground>
    );
}
