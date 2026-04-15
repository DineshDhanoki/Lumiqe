'use client';

import { motion } from 'framer-motion';

interface FreeTrialProps {
    onOpenAuth: () => void;
}

export default function FreeTrial({ onOpenAuth }: FreeTrialProps) {
    const benefits = [
        "1 Free Analysis Scan",
        "Instant Season Detection",
        "Identify your exact undertones",
        "No credit card required"
    ];

    return (
        <section className="py-24 px-6 relative bg-gradient-to-br from-background via-primary/5 to-background border-y border-primary/5 overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-12 relative z-10">
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="flex-1 text-center md:text-left"
                >
                    <h2 className="font-headline text-4xl md:text-5xl font-bold text-on-surface mb-6">
                        Try Lumiqe <span className="text-primary">For Free</span>
                    </h2>
                    <p className="text-lg text-on-surface-variant mb-8 leading-relaxed">
                        Not sure if your wardrobe matches your skin tone? Get your first AI-powered analysis completely free. Discover your season, undertone, and exactly which colors to wear.
                    </p>

                    <ul className="space-y-4 mb-8 text-left inline-block md:block">
                        {benefits.map((benefit, idx) => (
                            <li key={idx} className="flex items-center gap-3 text-on-surface">
                                <span className="material-symbols-outlined text-xl text-green-400 shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                <span>{benefit}</span>
                            </li>
                        ))}
                    </ul>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="flex-1 w-full max-w-sm bg-surface-container/30 border border-primary/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative"
                >
                    <div className="absolute top-0 right-0 -mt-3 -mr-3 bg-primary-container text-on-primary-container text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg transform rotate-6">
                        Limited Time
                    </div>

                    <h3 className="text-2xl font-bold text-on-surface mb-2">Free Trial Pass</h3>
                    <p className="text-on-surface-variant text-sm mb-8">Create an account to claim your scan.</p>

                    <div className="text-center mb-8">
                        <span className="text-5xl font-bold text-on-surface">$0</span>
                        <span className="text-on-surface-variant"> / first scan</span>
                    </div>

                    <button
                        onClick={onOpenAuth}
                        className="w-full flex items-center justify-center gap-2 bg-primary-container hover:bg-primary text-on-primary-container font-bold py-4 rounded-full transition-all shadow-[0_0_20px_-5px_rgba(240,191,98,0.3)] transform hover:scale-[1.02]"
                    >
                        Claim Free Trial
                        <span className="material-symbols-outlined text-xl">arrow_forward</span>
                    </button>

                    <p className="text-xs text-on-surface-variant text-center mt-4">
                        Takes less than a minute. Secure & Private.
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
