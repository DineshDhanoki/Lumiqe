'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import AppLayout from '@/components/layout/AppLayout';

export default function VirtualTryOnPage() {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email.trim()) setSubmitted(true);
    };

    return (
        <AppLayout>
            {/* Ambient background — full bleed */}
            <div className="-mx-4 sm:-mx-6 lg:-mx-10 -mt-8 -mb-10 lg:-mb-10 relative min-h-[calc(100vh-5rem)] flex items-center justify-center overflow-hidden px-6">
                {/* Ambient glows */}
                <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-secondary-container/10 rounded-full blur-[120px] pointer-events-none" />

                {/* Decorative image layer */}
                <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
                    <div
                        className="w-full h-full"
                        style={{
                            background: 'radial-gradient(ellipse at 30% 40%, rgba(196,151,62,0.15) 0%, transparent 60%), radial-gradient(ellipse at 70% 70%, rgba(68,54,156,0.1) 0%, transparent 60%)',
                        }}
                    />
                </div>

                {/* Center card */}
                <div className="relative z-10 w-full max-w-2xl py-16">
                    {/* Floating sparkle icons */}
                    <div className="absolute -top-12 -left-8 text-primary/40 hidden lg:block">
                        <span className="material-symbols-outlined text-4xl">auto_awesome</span>
                    </div>
                    <div className="absolute -bottom-8 -right-6 text-secondary/30 hidden lg:block">
                        <span className="material-symbols-outlined text-3xl">flare</span>
                    </div>
                    <div className="absolute top-1/4 -right-12 text-tertiary/20 hidden lg:block">
                        <span className="material-symbols-outlined text-2xl">colors_spark</span>
                    </div>

                    {/* Glass card */}
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="rounded-[24px] p-12 md:p-20 text-center relative overflow-hidden"
                        style={{
                            background: 'rgba(19,19,21,0.7)',
                            backdropFilter: 'blur(24px)',
                            WebkitBackdropFilter: 'blur(24px)',
                            border: '0.5px solid rgba(196,151,62,0.2)',
                        }}
                    >
                        {/* Top ambient line */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[1px]"
                            style={{ background: 'linear-gradient(to right, transparent, rgba(196,151,62,0.4), transparent)' }} />

                        <div className="space-y-8">
                            {/* Badge */}
                            <div
                                className="inline-block px-4 py-1 rounded-full"
                                style={{ background: 'rgba(68,54,156,0.1)', border: '0.5px solid rgba(196,151,62,0.2)' }}
                            >
                                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-secondary">
                                    AI Precision Engine
                                </span>
                            </div>

                            {/* Heading */}
                            <h1 className="font-display text-6xl md:text-8xl tracking-tighter leading-[0.9] italic text-on-surface">
                                The Future<br />
                                <span className="text-primary-container">of Fit</span>
                            </h1>

                            {/* Description */}
                            <p className="max-w-md mx-auto font-headline text-sm md:text-base text-on-surface-variant font-light tracking-wide leading-relaxed">
                                Virtual Try-On is Coming Soon. Experience your curated silhouette in high-fidelity 3D, powered by Lumiqe&apos;s intelligent styling agent.
                            </p>

                            {/* Waitlist form */}
                            <div className="pt-8 max-w-sm mx-auto">
                                {submitted ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-center py-6"
                                    >
                                        <span
                                            className="material-symbols-outlined text-5xl text-primary block mx-auto mb-4"
                                            style={{ fontVariationSettings: "'FILL' 1" }}
                                        >
                                            check_circle
                                        </span>
                                        <p className="font-headline font-bold text-on-surface text-sm uppercase tracking-widest">
                                            You&apos;re on the list
                                        </p>
                                        <p className="font-mono text-[10px] text-on-surface-variant/50 mt-2 uppercase tracking-widest">
                                            We&apos;ll notify you when it&apos;s ready
                                        </p>
                                    </motion.div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="relative group">
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Your email for priority access"
                                            required
                                            className="w-full bg-transparent border-b border-outline-variant py-4 px-2 font-label text-sm focus:outline-none focus:border-primary transition-colors text-on-surface placeholder:text-on-surface-variant/30"
                                        />
                                        <div className="mt-8">
                                            <button
                                                type="submit"
                                                className="w-full text-on-primary font-headline font-extrabold text-xs uppercase tracking-[0.25em] py-5 rounded-[10px] hover:opacity-90 active:scale-[0.98] transition-all duration-300"
                                                style={{
                                                    background: 'linear-gradient(to right, #c4973e, #f0bf62)',
                                                    boxShadow: '0 10px 40px rgba(196,151,62,0.15)',
                                                }}
                                            >
                                                Join Waitlist
                                            </button>
                                        </div>
                                    </form>
                                )}
                                <p className="mt-6 font-mono text-[9px] text-on-surface-variant/40 uppercase tracking-widest">
                                    Limited slots available for beta atelier access
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Footer line */}
                    <div className="mt-16 flex items-center justify-center gap-12 opacity-20">
                        <span className="font-mono text-[10px] text-on-surface tracking-widest">OBSIDIAN LUXE v2.4</span>
                        <span className="font-mono text-[10px] text-on-surface tracking-widest">© 2026 LUMIQE DIGITAL ATELIER</span>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
