'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { useTranslation } from '@/lib/hooks/useTranslation';

export default function Testimonials() {
    const { t } = useTranslation();

    const testimonials = [
        { name: t('testimonial1Name'), season: t('testimonial1Season'), text: t('testimonial1Text') },
        { name: t('testimonial2Name'), season: t('testimonial2Season'), text: t('testimonial2Text') },
        { name: t('testimonial3Name'), season: t('testimonial3Season'), text: t('testimonial3Text') },
    ];

    return (
        <section className="py-24 px-6 relative bg-black/40 border-y border-white/5 overflow-hidden">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-5xl font-bold text-white mb-6"
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
                            className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md flex flex-col h-full"
                        >
                            <div className="flex gap-1 mb-6">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-4 h-4 text-red-400 fill-red-400" />
                                ))}
                            </div>
                            <p className="text-white/80 leading-relaxed max-w-sm mb-8 flex-grow">
                                &ldquo;{item.text}&rdquo;
                            </p>
                            <div>
                                <h4 className="text-white font-bold">{item.name}</h4>
                                <p className="text-sm text-red-300 font-medium">{item.season}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
