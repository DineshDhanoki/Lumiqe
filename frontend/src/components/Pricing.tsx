'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { events } from '@/lib/analytics';
import { apiFetch } from '@/lib/api';

interface PricingProps {
    onOpenAuth?: () => void;
}

export default function Pricing({ onOpenAuth }: PricingProps) {
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
    const [checkoutError, setCheckoutError] = useState('');
    const { data: session } = useSession();

    const handleSubscribe = async () => {
        if (!session) {
            onOpenAuth?.();
            return;
        }

        setLoadingPlan('annual');
        setCheckoutError('');
        events.checkoutStarted('annual');

        try {
            const res = await apiFetch('/api/stripe/checkout', {
                method: 'POST',
                body: JSON.stringify({ plan: 'annual' }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err?.detail || 'Failed to create checkout session');
            }
            const data = await res.json();
            if (typeof window !== 'undefined') window.location.href = data.checkout_url;
        } catch (err: unknown) {
            console.error('Checkout error:', err);
            setCheckoutError(err instanceof Error ? err.message : 'Payment error. Please try again.');
            setLoadingPlan(null);
        }
    };

    return (
        <section id="pricing" className="py-16 md:py-24 px-4 sm:px-6">
            <div className="max-w-[1280px] mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="font-display text-5xl text-on-surface mb-4">Invest In Your Aura</h2>
                    <p className="text-on-surface-variant">Choose the depth of your personal color transformation.</p>
                </motion.div>

                {checkoutError && (
                    <p className="text-primary text-sm text-center mb-8">{checkoutError}</p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Discovery — Free */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="p-10 rounded-3xl bg-surface-container border border-outline-variant/10 flex flex-col h-full"
                    >
                        <div className="mb-8">
                            <h3 className="font-headline text-xl font-bold mb-2">Discovery</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-headline font-extrabold">Free</span>
                            </div>
                        </div>
                        <ul className="space-y-4 mb-12 flex-grow">
                            <li className="flex items-center gap-3 text-on-surface-variant">
                                <span className="material-symbols-outlined text-green-500 text-sm">check_circle</span>
                                Basic Seasonal Analysis
                            </li>
                            <li className="flex items-center gap-3 text-on-surface-variant">
                                <span className="material-symbols-outlined text-green-500 text-sm">check_circle</span>
                                Essential 10-Color Palette
                            </li>
                            <li className="flex items-center gap-3 text-on-surface-variant opacity-40">
                                <span className="material-symbols-outlined text-zinc-600 text-sm">cancel</span>
                                AI Stylist Access
                            </li>
                        </ul>
                        <button
                            onClick={() => onOpenAuth?.()}
                            className="w-full py-4 rounded-xl border border-outline-variant font-bold hover:bg-white/5 transition-all"
                        >
                            Get Started
                        </button>
                    </motion.div>

                    {/* Elite Atelier — Pro */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="p-10 rounded-3xl bg-surface-container-highest border border-primary/30 flex flex-col h-full relative overflow-hidden"
                        style={{ boxShadow: '0 40px 60px -15px rgba(196,151,62,0.08)' }}
                    >
                        <div className="absolute top-6 right-8 bg-primary/20 text-primary text-[10px] font-mono tracking-widest px-3 py-1 rounded-full uppercase">Most Popular</div>
                        <div className="mb-8">
                            <h3 className="font-headline text-xl font-bold mb-2">Elite Atelier</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-headline font-extrabold">$29</span>
                                <span className="text-on-surface-variant text-sm">/one-time</span>
                            </div>
                        </div>
                        <ul className="space-y-4 mb-12 flex-grow">
                            {[
                                'Ultra-HD Deep Tissue Analysis',
                                'Complete 60-Color Lookbook',
                                'Unlimited Wardrobe Matching',
                                'Priority AI Stylist Concierge',
                            ].map((text) => (
                                <li key={text} className="flex items-center gap-3 text-on-surface">
                                    <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                    {text}
                                </li>
                            ))}
                        </ul>
                        <button
                            onClick={handleSubscribe}
                            disabled={loadingPlan === 'annual'}
                            className="w-full py-4 rounded-xl bg-primary text-on-primary-container font-bold hover:opacity-90 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            {loadingPlan === 'annual' ? (
                                <>
                                    <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                                    Opening checkout...
                                </>
                            ) : (
                                'Unlock Elite Access'
                            )}
                        </button>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
