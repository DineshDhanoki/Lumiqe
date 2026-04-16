'use client';

import { motion } from 'framer-motion';
import { useTranslation } from '@/lib/hooks/useTranslation';

interface HeroSectionProps {
    onOpenAuth: () => void;
}

export default function HeroSection({ onOpenAuth }: HeroSectionProps) {
    const { t } = useTranslation();

    return (
        <section className="relative pt-32 pb-32 px-6 overflow-hidden">
            <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                {/* Left: text */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="z-10"
                >
                    <span className="font-label text-[10px] tracking-[0.3em] uppercase text-on-surface-variant/60 block mb-4">
                        AI Color Analysis
                    </span>

                    <h1 className="text-7xl md:text-8xl font-display leading-[0.9] mb-8 tracking-tighter text-on-surface">
                        {t('heroDiscoverYour')} <br />
                        <span className="italic text-primary">
                            {t('heroTrueColors')}
                        </span>
                    </h1>

                    <p className="text-xl text-on-surface-variant max-w-lg mb-10 leading-relaxed font-light">
                        {t('heroSubtitle')}
                    </p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className="flex flex-col sm:flex-row gap-6"
                    >
                        <button
                            onClick={onOpenAuth}
                            className="group flex items-center justify-center gap-2 rounded-full bg-primary-container text-on-primary-container font-headline font-bold text-base tracking-wide px-10 py-5 shadow-xl hover:opacity-90 active:scale-95 transition-all"
                        >
                            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                            {t('heroStartFreeTrial')}
                        </button>

                        <a
                            href="#demo"
                            className="flex items-center justify-center gap-2 rounded-full bg-transparent border border-primary/30 text-primary font-headline font-semibold text-base px-10 py-5 backdrop-blur-md hover:bg-primary/5 transition-all"
                        >
                            <span className="material-symbols-outlined text-base opacity-70">play_circle</span>
                            {t('heroSeeLiveDemo')}
                        </a>
                    </motion.div>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="mt-6 text-on-surface-variant text-xs font-mono tracking-wider"
                    >
                        {t('heroNoCreditCard')}
                    </motion.p>
                </motion.div>

                {/* Right: phone mockup */}
                <motion.div
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                    className="relative flex justify-center items-center"
                >
                    {/* Glow */}
                    <div className="absolute inset-0 bg-primary-container/10 rounded-full blur-[120px] scale-75 pointer-events-none" />

                    {/* Phone frame */}
                    <div className="relative w-full max-w-[340px] aspect-[9/19] rounded-[3rem] p-3 bg-surface-container-highest border border-outline-variant/20"
                        style={{ boxShadow: '0 40px 60px -15px rgba(196, 151, 62, 0.08)' }}>
                        <div className="w-full h-full rounded-[2.5rem] overflow-hidden relative"
                            style={{ background: 'linear-gradient(135deg, #2D1B0D 0%, #4A3219 40%, #1A120B 100%)' }}>

                            {/* Portrait photo — add /public/hero-portrait.jpg to enable */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="/hero-portrait.jpg"
                                alt="AI Fashion Analysis"
                                className="absolute inset-0 w-full h-full object-cover"
                                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                            />

                            {/* Subtle pattern overlay */}
                            <div className="absolute inset-0 opacity-20"
                                style={{ background: 'radial-gradient(ellipse at 30% 20%, rgba(240,191,98,0.3) 0%, transparent 60%)' }} />

                            {/* Bottom overlay card */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-6 flex flex-col justify-end">
                                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
                                    <p className="font-mono text-[10px] text-primary uppercase tracking-[0.2em] mb-1">Analysis Complete</p>
                                    <p className="font-display text-xl text-on-surface">Deep Winter</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
