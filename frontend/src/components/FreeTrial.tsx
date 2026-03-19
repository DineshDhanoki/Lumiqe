'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight } from 'lucide-react';

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
        <section className="py-24 px-6 relative bg-gradient-to-br from-black via-red-950/20 to-black border-y border-white/5 overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-rose-900/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-12 relative z-10">
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="flex-1 text-center md:text-left"
                >
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        Try Lumiqe <span className="text-red-400">For Free</span>
                    </h2>
                    <p className="text-lg text-white/70 mb-8 leading-relaxed">
                        Not sure if your wardrobe matches your skin tone? Get your first AI-powered analysis completely free. Discover your season, undertone, and exactly which colors to wear.
                    </p>

                    <ul className="space-y-4 mb-8 text-left inline-block md:block">
                        {benefits.map((benefit, idx) => (
                            <li key={idx} className="flex items-center gap-3 text-white/80">
                                <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
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
                    className="flex-1 w-full max-w-sm bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative"
                >
                    <div className="absolute top-0 right-0 -mt-3 -mr-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg transform rotate-6">
                        Limited Time
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-2">Free Trial Pass</h3>
                    <p className="text-white/50 text-sm mb-8">Create an account to claim your scan.</p>

                    <div className="text-center mb-8">
                        <span className="text-5xl font-bold text-white">$0</span>
                        <span className="text-white/50"> / first scan</span>
                    </div>

                    <button
                        onClick={onOpenAuth}
                        className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-full transition-all shadow-[0_0_20px_-5px_rgba(220,38,38,0.5)] transform hover:scale-[1.02]"
                    >
                        Claim Free Trial
                        <ArrowRight className="w-5 h-5" />
                    </button>

                    <p className="text-xs text-white/40 text-center mt-4">
                        Takes less than a minute. Secure & Private.
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
