'use client';

import { motion } from 'framer-motion';

const STEPS = [
    {
        icon: 'upload_file',
        colorClass: 'text-primary',
        hoverBg: 'group-hover:bg-primary-container',
        hoverIcon: 'group-hover:text-on-primary-container',
        title: '01. Upload',
        desc: 'Provide a natural light selfie. Our system detects over 200 data points across your skin, eyes, and hair.',
    },
    {
        icon: 'neurology',
        colorClass: 'text-secondary',
        hoverBg: 'group-hover:bg-secondary-container',
        hoverIcon: 'group-hover:text-white',
        title: '02. AI Analyzes',
        desc: 'Our AI simulates thousands of lighting conditions and drape combinations to find your perfect contrast ratio.',
    },
    {
        icon: 'palette',
        colorClass: 'text-tertiary',
        hoverBg: 'group-hover:bg-tertiary-container',
        hoverIcon: 'group-hover:text-on-tertiary-container',
        title: '03. Discover Palette',
        desc: 'Receive a curated 60-color digital lookbook and bespoke styling advice tailored exclusively to you.',
    },
];

export default function HowItWorks() {
    return (
        <section id="how-it-works" className="py-16 md:py-24 px-4 sm:px-6 relative bg-surface-container/20 border-y border-primary/5">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                    <div>
                        <span className="font-mono text-secondary text-sm uppercase tracking-[0.3em] block">
                            The Process
                        </span>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-100px' }}
                            className="font-display text-5xl text-on-surface mt-4"
                        >
                            Precision Engineering
                        </motion.h2>
                    </div>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-100px' }}
                        transition={{ delay: 0.1 }}
                        className="text-on-surface-variant font-light text-lg max-w-md"
                    >
                        Our three-step methodology combines dermatologist-approved color theory with proprietary neural networks.
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
                                <span className={`material-symbols-outlined text-2xl ${step.colorClass} ${step.hoverIcon}`}>
                                    {step.icon}
                                </span>
                            </div>

                            <h3 className="font-headline text-xl font-bold text-on-surface mb-4">
                                {step.title}
                            </h3>
                            <p className="text-on-surface-variant leading-relaxed text-sm max-w-sm">
                                {step.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
