'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const testimonials = [
    {
        name: "Sarah M.",
        season: "Deep Winter",
        text: "I used to wear beige all the time because I thought it was 'safe.' Lumiqe told me I was a Deep Winter and gave me a palette of emeralds and ruby reds. The compliments haven't stopped since.",
    },
    {
        name: "Priya K.",
        season: "True Autumn",
        text: "As a woman of color, online color quizzes have never worked for me. The AI engine accurately detected my rich warm undertone and didn't just default to 'dark = winter'. Incredible science.",
    },
    {
        name: "Elena R.",
        season: "Light Spring",
        text: "The jewelry recommendation completely changed my look. I switched from silver to gold based on my result and my skin literally looks warmer and brighter in photos now.",
    }
];

export default function Testimonials() {
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
                        What People Are Saying
                    </motion.h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                    {testimonials.map((t, idx) => (
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
                                &ldquo;{t.text}&rdquo;
                            </p>
                            <div>
                                <h4 className="text-white font-bold">{t.name}</h4>
                                <p className="text-sm text-red-300 font-medium">{t.season}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
