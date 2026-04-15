'use client';

import { motion } from 'framer-motion';
import { useTranslation } from '@/lib/hooks/useTranslation';

export default function Testimonials() {
    const { t } = useTranslation();

    const testimonials = [
        { name: t('testimonial1Name'), season: t('testimonial1Season'), text: t('testimonial1Text') },
        { name: t('testimonial2Name'), season: t('testimonial2Season'), text: t('testimonial2Text') },
        { name: t('testimonial3Name'), season: t('testimonial3Season'), text: t('testimonial3Text') },
    ];

    return (
        <section className="py-24 px-6 relative bg-surface-container/20 border-y border-primary/5 overflow-hidden">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <span className="font-label text-[10px] tracking-[0.3em] uppercase text-on-surface-variant/60 block mb-3">
                        Social Proof
                    </span>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="font-display italic text-4xl md:text-5xl text-on-surface"
                    >
                        {t('testimonialsTitle')}
                    </motion.h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                    {testimonials.map((item, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.15 }}
                            className="p-8 rounded-3xl bg-surface-container/30 border border-primary/10 backdrop-blur-md flex flex-col h-full"
                        >
                            <div className="flex gap-0.5 mb-6">
                                {[...Array(5)].map((_, i) => (
                                    <span
                                        key={i}
                                        className="material-symbols-outlined text-primary text-base"
                                        style={{ fontVariationSettings: "'FILL' 1" }}
                                    >
                                        star
                                    </span>
                                ))}
                            </div>
                            <p className="text-on-surface-variant leading-relaxed text-sm mb-8 flex-grow">
                                &ldquo;{item.text}&rdquo;
                            </p>
                            <div>
                                <h4 className="font-headline text-on-surface font-bold">{item.name}</h4>
                                <p className="text-xs text-primary font-mono mt-0.5">{item.season}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
