'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Sparkles, Zap, Crown, ArrowRight, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

interface PricingProps {
    onOpenAuth?: () => void;
}

export default function Pricing({ onOpenAuth }: PricingProps) {
    const [isAnnual, setIsAnnual] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [checkoutError, setCheckoutError] = useState('');
    const { data: session } = useSession();

    const handleSubscribe = async (plan: 'monthly' | 'annual') => {
        if (!session) {
            onOpenAuth?.();
            return;
        }

        setIsLoading(true);
        setCheckoutError('');

        try {
            const res = await fetch(`${API_BASE}/api/stripe/checkout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${(session as any)?.backendToken}`,
                },
                body: JSON.stringify({ plan }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err?.detail || 'Failed to create checkout session');
            }
            const data = await res.json();
            window.location.href = data.checkout_url;
        } catch (err: any) {
            console.error('Checkout error:', err);
            setCheckoutError(err.message || 'Payment service unavailable. Please try again.');
            setIsLoading(false);
        }
    };


    const freeFeatures = [
        { text: '1 color analysis scan', included: true },
        { text: 'Core 6-color palette', included: true },
        { text: 'Celebrity color match', included: true },
        { text: 'Palette card download', included: true },
        { text: 'Standard clothing recommendations', included: true },
        { text: 'AI Styling Tips', included: false },
        { text: 'Complete Full-Fit Generation', included: false },
        { text: 'Live In-Store Tag Scanner', included: false },
        { text: 'Unlock all aesthetics (Gym, Party, Streetwear)', included: false },
    ];

    const premiumFeatures = [
        { text: '100 AI Scans per month', included: true },
        { text: 'Core 6-color palette', included: true },
        { text: 'Celebrity color match', included: true },
        { text: 'Palette card download', included: true },
        { text: 'Unlock all aesthetics (Gym, Party, Streetwear)', included: true },
        { text: 'AI Styling Tips (Daily)', included: true },
        { text: 'Complete Full-Fit Generation', included: true },
        { text: 'Live In-Store Tag Scanner (100 tags/mo)', included: true },
        { text: 'Priority support', included: true },
    ];

    return (
        <section id="pricing" className="py-24 px-6">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <p className="text-red-400 text-sm font-bold tracking-widest uppercase mb-4">
                        Pricing
                    </p>
                    <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
                        Simple, transparent pricing
                    </h2>
                    <p className="text-white/60 text-lg max-w-xl mx-auto">
                        Start free. Upgrade when you&apos;re ready to unlock your full style potential.
                    </p>

                    {/* Billing Toggle */}
                    <div className="flex items-center justify-center gap-4 mt-8">
                        <span className={`text-sm font-medium transition-colors ${!isAnnual ? 'text-white' : 'text-white/40'}`}>
                            Monthly
                        </span>
                        <button
                            onClick={() => setIsAnnual(!isAnnual)}
                            className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${isAnnual ? 'bg-red-600' : 'bg-white/20'}`}
                        >
                            <div
                                className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 ${isAnnual ? 'translate-x-7' : 'translate-x-0.5'}`}
                            />
                        </button>
                        <span className={`text-sm font-medium transition-colors ${isAnnual ? 'text-white' : 'text-white/40'}`}>
                            Annual
                        </span>
                        {isAnnual && (
                            <motion.span
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-xs font-bold bg-green-500/20 text-green-400 px-3 py-1 rounded-full border border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.3)] animate-pulse"
                            >
                                Save 72%
                            </motion.span>
                        )}
                    </div>
                </motion.div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Free Plan */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="relative bg-zinc-900/60 border border-white/10 rounded-3xl p-8 flex flex-col"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                <Zap className="w-5 h-5 text-white/70" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Free</h3>
                        </div>

                        <div className="mb-8">
                            <div className="flex items-baseline gap-1">
                                <span className="text-5xl font-extrabold text-white">₹0</span>
                                <span className="text-white/40 text-sm">/forever</span>
                            </div>
                            <p className="text-white/50 text-sm mt-2">Perfect to try Lumiqe</p>
                        </div>

                        <ul className="space-y-3 mb-8 flex-1">
                            {freeFeatures.map((f, i) => (
                                <li key={i} className="flex items-center gap-3">
                                    {f.included ? (
                                        <Check className="w-4 h-4 text-green-400 shrink-0" />
                                    ) : (
                                        <X className="w-4 h-4 text-white/20 shrink-0" />
                                    )}
                                    <span className={`text-sm ${f.included ? 'text-white/80' : 'text-white/30'}`}>
                                        {f.text}
                                    </span>
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={() => onOpenAuth?.()}
                            className="w-full py-3.5 rounded-full border border-white/20 text-white font-semibold text-sm hover:bg-white/10 transition-all"
                        >
                            Get Started Free
                        </button>
                    </motion.div>

                    {/* Premium Plan */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="relative bg-gradient-to-b from-red-950/40 to-zinc-900/60 border-2 border-red-500/50 rounded-3xl p-8 flex flex-col shadow-[0_0_100px_-20px_rgba(220,38,38,0.5)] z-10 scale-105"
                    >
                        {/* Popular Badge */}
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                            <span className="bg-red-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                                MOST POPULAR
                            </span>
                        </div>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                                <Crown className="w-5 h-5 text-red-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Premium</h3>
                        </div>

                        <div className="mb-8">
                            <div className="flex items-baseline gap-1">
                                <span className="text-5xl font-extrabold text-white">
                                    ₹{isAnnual ? '499' : '149'}
                                </span>
                                <span className="text-white/40 text-sm">
                                    /{isAnnual ? 'year' : 'month'}
                                </span>
                            </div>
                            <p className="text-white/50 text-sm mt-2">
                                {isAnnual
                                    ? 'Just ₹41/month — best margin value!'
                                    : 'Cancel anytime, no lock-in'}
                            </p>
                        </div>

                        <ul className="space-y-3 mb-8 flex-1">
                            {premiumFeatures.map((f, i) => (
                                <li key={i} className="flex items-center gap-3">
                                    <Check className="w-4 h-4 text-red-400 shrink-0" />
                                    <span className="text-sm text-white/80">{f.text}</span>
                                </li>
                            ))}
                        </ul>

                        {checkoutError && (
                            <p className="text-red-400 text-xs text-center mt-3">{checkoutError}</p>
                        )}
                        <button
                            onClick={() => handleSubscribe(isAnnual ? 'annual' : 'monthly')}
                            disabled={isLoading}
                            className="group w-full py-3.5 rounded-full bg-red-600 hover:bg-red-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm shadow-[0_0_30px_-5px_rgba(220,38,38,0.5)] transition-all flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Opening Stripe...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    Upgrade to Premium
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
