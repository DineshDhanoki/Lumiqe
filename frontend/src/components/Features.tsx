'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, Crosshair, ShoppingBag, Layers } from 'lucide-react';

const features = [
    {
        icon: Crosshair,
        title: 'Clinical-Grade Accuracy',
        description: 'We calculate your Individual Typology Angle (ITA) and dominant K-Means skin cluster, eliminating the guesswork of standard quizzes.',
        color: 'from-orange-500/20 to-red-500/20',
        iconColor: 'text-orange-400',
    },
    {
        icon: Layers,
        title: '12 Season Framework',
        description: 'Go beyond just warm/cool. We map you to one of 12 distinct color seasons to find the exact saturation and contrast that flatters you.',
        color: 'from-rose-500/20 to-pink-500/20',
        iconColor: 'text-rose-400',
    },
    {
        icon: ShoppingBag,
        title: 'Curated Shopping',
        description: 'Get an instant feed of clothing, makeup, and jewelry specifically chosen to match your analyzed season. No more buying the wrong shade.',
        color: 'from-red-500/20 to-rose-600/20',
        iconColor: 'text-red-400',
    },
    {
        icon: ShieldCheck,
        title: 'Privacy by Design',
        description: 'Your photos never leave our temporary server memory. We extract the mathematical hex codes and immediately discard the image.',
        color: 'from-stone-500/20 to-zinc-500/20',
        iconColor: 'text-stone-400',
    }
];

export default function Features() {
    return (
        <section id="features" className="py-16 md:py-24 px-4 sm:px-6 relative">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6"
                    >
                        Why Choose Lumiqe
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ delay: 0.1 }}
                        className="text-lg text-white/60 max-w-2xl mx-auto"
                    >
                        The most advanced color analysis engine ever built for the web.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            whileInView={{ opacity: 1, scale: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            className={`p-6 sm:p-8 rounded-3xl bg-gradient-to-br ${feature.color} bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors group`}
                        >
                            <feature.icon className={`w-10 h-10 ${feature.iconColor} mb-6`} />
                            <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">
                                {feature.title}
                            </h3>
                            <p className="text-white/70 leading-relaxed">
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
