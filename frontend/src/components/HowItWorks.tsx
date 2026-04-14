'use client';

import { motion } from 'framer-motion';
import { Camera, Cpu, Palette } from 'lucide-react';
import { useTranslation } from '@/lib/hooks/useTranslation';

export default function HowItWorks() {
    const { t } = useTranslation();

    const steps = [
        {
            icon: Camera,
            title: t('howItWorksStep1Title'),
            description: t('howItWorksStep1Desc'),
        },
        {
            icon: Cpu,
            title: t('howItWorksStep2Title'),
            description: t('howItWorksStep2Desc'),
        },
        {
            icon: Palette,
            title: t('howItWorksStep3Title'),
            description: t('howItWorksStep3Desc'),
        }
    ];
    return (
        <section id="how-it-works" className="py-16 md:py-24 px-4 sm:px-6 relative bg-surface-container/20 border-y border-primary/5">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        className="font-headline text-3xl sm:text-4xl md:text-5xl font-bold text-on-surface mb-4 sm:mb-6"
                    >
                        {t('howItWorksTitle')}
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ delay: 0.1 }}
                        className="text-lg text-on-surface-variant max-w-2xl mx-auto"
                    >
                        {t('howItWorksSubtitle')}
                    </motion.p>
                </div>

                <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mt-12 md:mt-20">
                    {/* Connector Line (hidden on mobile) */}
                    <div className="hidden md:block absolute top-[40px] left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ delay: index * 0.2, duration: 0.6 }}
                            className="relative flex flex-col items-center text-center group"
                        >
                            {/* Step Icon */}
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/20 border border-primary/10 flex items-center justify-center mb-8 backdrop-blur-md shadow-lg group-hover:border-primary/50 group-hover:-translate-y-2 transition-all duration-300">
                                <step.icon className="w-8 h-8 text-primary group-hover:text-primary/80" />

                                {/* Step Number Badge */}
                                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-sm border-4 border-background">
                                    {index + 1}
                                </div>
                            </div>

                            {/* Step Content */}
                            <h3 className="text-2xl font-bold text-on-surface mb-4">
                                {step.title}
                            </h3>
                            <p className="text-on-surface-variant leading-relaxed max-w-sm">
                                {step.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
