'use client';

import { motion } from 'framer-motion';
import { useTranslation } from '@/lib/hooks/useTranslation';

const FEATURES = [
    {
        icon: 'my_location',
        colorClass: 'text-primary',
        bgClass: 'bg-primary/10 border-primary/20',
        titleKey: 'featureClinicalTitle' as const,
        descKey: 'featureClinicalDesc' as const,
    },
    {
        icon: 'layers',
        colorClass: 'text-secondary',
        bgClass: 'bg-secondary/10 border-secondary/20',
        titleKey: 'featureSeasonTitle' as const,
        descKey: 'featureSeasonDesc' as const,
    },
    {
        icon: 'shopping_bag',
        colorClass: 'text-tertiary',
        bgClass: 'bg-tertiary/10 border-tertiary/20',
        titleKey: 'featureShoppingTitle' as const,
        descKey: 'featureShoppingDesc' as const,
    },
    {
        icon: 'verified_user',
        colorClass: 'text-on-surface-variant',
        bgClass: 'bg-surface-container-high border-outline-variant/20',
        titleKey: 'featurePrivacyTitle' as const,
        descKey: 'featurePrivacyDesc' as const,
    },
];

export default function Features() {
    const { t } = useTranslation();

    return (
        <section id="features" className="py-16 md:py-24 px-4 sm:px-6 relative">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <span className="font-label text-[10px] tracking-[0.3em] uppercase text-on-surface-variant/60 block mb-3">
                        Why Lumiqe
                    </span>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-100px' }}
                        className="font-display italic text-4xl sm:text-5xl text-on-surface mb-4 sm:mb-6"
                    >
                        {t('featuresTitle')}
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-100px' }}
                        transition={{ delay: 0.1 }}
                        className="text-lg text-on-surface-variant max-w-2xl mx-auto font-light"
                    >
                        {t('featuresSubtitle')}
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {FEATURES.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            whileInView={{ opacity: 1, scale: 1, y: 0 }}
                            viewport={{ once: true, margin: '-50px' }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            className="p-6 sm:p-8 rounded-3xl bg-surface-container/30 border border-primary/10 backdrop-blur-md hover:bg-surface-container/50 transition-colors group"
                        >
                            <div className={`w-14 h-14 rounded-2xl ${feature.bgClass} border flex items-center justify-center mb-6 group-hover:-translate-y-1 transition-transform`}>
                                <span
                                    className={`material-symbols-outlined text-2xl ${feature.colorClass}`}
                                    style={{ fontVariationSettings: "'FILL' 1" }}
                                >
                                    {feature.icon}
                                </span>
                            </div>
                            <h3 className="font-headline text-xl font-bold text-on-surface mb-3 tracking-tight">
                                {t(feature.titleKey)}
                            </h3>
                            <p className="text-on-surface-variant leading-relaxed text-sm">
                                {t(feature.descKey)}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
