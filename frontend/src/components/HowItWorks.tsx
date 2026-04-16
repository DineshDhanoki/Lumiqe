'use client';

import { motion } from 'framer-motion';
import { useTranslation } from '@/lib/hooks/useTranslation';

const STEPS = [
    {
        icon: 'upload_file',
        number: '01',
        colorClass: 'text-primary',
        hoverBg: 'group-hover:bg-primary/20 group-hover:border-primary/40',
        titleKey: 'howItWorksStep1Title' as const,
        descKey: 'howItWorksStep1Desc' as const,
    },
    {
        icon: 'neurology',
        number: '02',
        colorClass: 'text-secondary',
        hoverBg: 'group-hover:bg-secondary/20 group-hover:border-secondary/40',
        titleKey: 'howItWorksStep2Title' as const,
        descKey: 'howItWorksStep2Desc' as const,
    },
    {
        icon: 'palette',
        number: '03',
        colorClass: 'text-tertiary',
        hoverBg: 'group-hover:bg-tertiary/20 group-hover:border-tertiary/40',
        titleKey: 'howItWorksStep3Title' as const,
        descKey: 'howItWorksStep3Desc' as const,
    },
];

export default function HowItWorks() {
    const { t } = useTranslation();

    return (
        <section id="how-it-works" className="py-16 md:py-24 px-4 sm:px-6 relative bg-surface-container/20 border-y border-primary/5">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                    <div>
                        <span className="font-label text-[10px] tracking-[0.3em] uppercase text-on-surface-variant/60 block mb-3">
                            The Process
                        </span>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-100px' }}
                            className="font-display text-4xl sm:text-5xl text-on-surface mt-4"
                        >
                            {t('howItWorksTitle')}
                        </motion.h2>
                    </div>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-100px' }}
                        transition={{ delay: 0.1 }}
                        className="text-on-surface-variant font-light text-base max-w-md"
                    >
                        {t('howItWorksSubtitle')}
                    </motion.p>
                </div>

                <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                    {/* Connector line */}
                    <div className="hidden md:block absolute top-8 left-[18%] right-[18%] h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

                    {STEPS.map((step, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-50px' }}
                            transition={{ delay: index * 0.2, duration: 0.6 }}
                            className="relative flex flex-col items-start text-left group"
                        >
                            <div className={`relative w-16 h-16 rounded-full bg-surface-container-high border border-outline-variant/20 flex items-center justify-center mb-8 ${step.hoverBg} transition-all duration-500`}>
                                <span
                                    className={`material-symbols-outlined text-2xl ${step.colorClass}`}
                                >
                                    {step.icon}
                                </span>
                                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary-container text-on-primary font-mono text-[9px] font-bold flex items-center justify-center border-2 border-background">
                                    {step.number}
                                </div>
                            </div>

                            <h3 className="font-headline text-xl font-bold text-on-surface mb-4">
                                {t(step.titleKey)}
                            </h3>
                            <p className="text-on-surface-variant leading-relaxed text-sm max-w-sm">
                                {t(step.descKey)}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
