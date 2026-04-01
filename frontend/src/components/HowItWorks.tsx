'use client';

import { motion } from 'framer-motion';
import { Camera, Cpu, Palette } from 'lucide-react';

const steps = [
    {
        icon: Camera,
        title: 'Upload a Selfie',
        description: 'Snap a well-lit, makeup-free photo facing natural light. We run privacy-first, analyzing the image directly in-memory.',
    },
    {
        icon: Cpu,
        title: 'AI Analyzes 100K+ Pixels',
        description: 'Our custom vision engine extracts your true skin chromaticity, isolating it from shadows and lighting bias.',
    },
    {
        icon: Palette,
        title: 'Get Your Palette',
        description: 'Discover your color season, metallic matches, and custom shopping recommendations that make you glow.',
    }
];

export default function HowItWorks() {
    return (
        <section id="how-it-works" className="py-16 md:py-24 px-4 sm:px-6 relative bg-black/40 border-y border-white/5">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6"
                    >
                        How It Works
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ delay: 0.1 }}
                        className="text-lg text-white/60 max-w-2xl mx-auto"
                    >
                        Science meets style. A simple three-step process built on rigorous color theory.
                    </motion.p>
                </div>

                <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mt-12 md:mt-20">
                    {/* Connector Line (hidden on mobile) */}
                    <div className="hidden md:block absolute top-[40px] left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

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
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-600/20 to-red-900/40 border border-white/10 flex items-center justify-center mb-8 backdrop-blur-md shadow-lg group-hover:border-red-500/50 group-hover:-translate-y-2 transition-all duration-300">
                                <step.icon className="w-8 h-8 text-red-400 group-hover:text-red-300" />

                                {/* Step Number Badge */}
                                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-sm border-4 border-black">
                                    {index + 1}
                                </div>
                            </div>

                            {/* Step Content */}
                            <h3 className="text-2xl font-bold text-white mb-4">
                                {step.title}
                            </h3>
                            <p className="text-white/60 leading-relaxed max-w-sm">
                                {step.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
