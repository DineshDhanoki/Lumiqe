'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Sparkles, Zap, Crown, ArrowRight, Loader2, CreditCard } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { events } from '@/lib/analytics';
import { apiFetch } from '@/lib/api';
import { useTranslation } from '@/lib/hooks/useTranslation';

interface PricingProps {
    onOpenAuth?: () => void;
}

export default function Pricing({ onOpenAuth }: PricingProps) {
    const { t } = useTranslation();
    const [isAnnual, setIsAnnual] = useState(false);
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
    const [checkoutError, setCheckoutError] = useState('');
    const { data: session } = useSession();

    const handleSubscribe = async (plan: 'monthly' | 'annual') => {
        if (!session) {
            onOpenAuth?.();
            return;
        }

        setLoadingPlan(plan);
        setCheckoutError('');
        events.checkoutStarted(plan);

        try {
            const res = await apiFetch('/api/stripe/checkout', {
                method: 'POST',
                body: JSON.stringify({ plan }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err?.detail || 'Failed to create checkout session');
            }
            const data = await res.json();
            if (typeof window !== 'undefined') window.location.href = data.checkout_url;
        } catch (err: unknown) {
            console.error('Checkout error:', err);
            setCheckoutError(err instanceof Error ? err.message : t('pricingPaymentError'));
            setLoadingPlan(null);
        }
    };

    const handleBuyCredits = async () => {
        if (!session) {
            onOpenAuth?.();
            return;
        }

        setLoadingPlan('credits');
        setCheckoutError('');
        events.creditsPurchased(1);

        try {
            const res = await apiFetch('/api/stripe/buy-credits', {
                method: 'POST',
                body: JSON.stringify({ pack: 'single' }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err?.detail || 'Failed to create checkout session');
            }
            const data = await res.json();
            if (typeof window !== 'undefined') window.location.href = data.checkout_url;
        } catch (err: unknown) {
            console.error('Credit purchase error:', err);
            setCheckoutError(err instanceof Error ? err.message : t('pricingPaymentError'));
            setLoadingPlan(null);
        }
    };

    const freeFeatures = [
        { text: t('pricingFreeF1'), included: true },
        { text: t('pricingFreeF2'), included: true },
        { text: t('pricingFreeF3'), included: true },
        { text: t('pricingFreeF4'), included: true },
        { text: t('pricingFreeF5'), included: true },
        { text: t('pricingFreeF6'), included: true },
        { text: t('pricingFreeF7'), included: false },
        { text: t('pricingFreeF8'), included: false },
    ];

    const singlePackFeatures = [
        { text: t('pricingSingleF1'), included: true },
        { text: t('pricingSingleF2'), included: true },
        { text: t('pricingSingleF3'), included: true },
        { text: t('pricingSingleF4'), included: true },
        { text: t('pricingSingleF5'), included: true },
    ];

    const premiumFeatures = [
        { text: t('pricingPremiumF1'), included: true },
        { text: t('pricingPremiumF2'), included: true },
        { text: t('pricingPremiumF3'), included: true },
        { text: t('pricingPremiumF4'), included: true },
        { text: t('pricingPremiumF5'), included: true },
        { text: t('pricingPremiumF6'), included: true },
        { text: t('pricingPremiumF7'), included: true },
        { text: t('pricingPremiumF8'), included: true },
        { text: t('pricingPremiumF9'), included: true },
    ];

    return (
        <section id="pricing" className="py-16 md:py-24 px-4 sm:px-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <p className="text-red-400 text-sm font-bold tracking-widest uppercase mb-4">
                        {t('pricingLabel')}
                    </p>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4">
                        {t('pricingTitle')}
                    </h2>
                    <p className="text-white/60 text-lg max-w-xl mx-auto">
                        {t('pricingSubtitle')}
                    </p>

                    {/* Billing Toggle */}
                    <div className="flex items-center justify-center gap-4 mt-8">
                        <span className={`text-sm font-medium transition-colors ${!isAnnual ? 'text-white' : 'text-white/40'}`}>
                            {t('pricingMonthly')}
                        </span>
                        <button
                            onClick={() => setIsAnnual(!isAnnual)}
                            role="switch"
                            aria-checked={isAnnual}
                            aria-label={t('pricingToggle')}
                            className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${isAnnual ? 'bg-red-600' : 'bg-white/20'}`}
                        >
                            <div
                                className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 ${isAnnual ? 'translate-x-7' : 'translate-x-0.5'}`}
                            />
                        </button>
                        <span className={`text-sm font-medium transition-colors ${isAnnual ? 'text-white' : 'text-white/40'}`}>
                            {t('pricingAnnual')}
                        </span>
                        {isAnnual && (
                            <motion.span
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-xs font-bold bg-green-500/20 text-green-400 px-3 py-1 rounded-full border border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.3)] animate-pulse"
                            >
                                {t('pricingSave')}
                            </motion.span>
                        )}
                    </div>
                </motion.div>

                {checkoutError && (
                    <p className="text-red-400 text-sm text-center mb-6">{checkoutError}</p>
                )}

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-3 gap-8 md:gap-6 max-w-5xl mx-auto">
                    {/* Free Plan */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="relative bg-zinc-900/60 border border-white/10 rounded-3xl p-7 flex flex-col"
                    >
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                <Zap className="w-5 h-5 text-white/70" />
                            </div>
                            <h3 className="text-xl font-bold text-white">{t('pricingFree')}</h3>
                        </div>

                        <div className="mb-6">
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-extrabold text-white">{'\u20b9'}0</span>
                                <span className="text-white/40 text-sm">{t('pricingForever')}</span>
                            </div>
                            <p className="text-white/50 text-sm mt-2">{t('pricingFreeDesc')}</p>
                        </div>

                        <ul className="space-y-2.5 mb-6 flex-1">
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
                            className="w-full py-3 rounded-full border border-white/20 text-white font-semibold text-sm hover:bg-white/10 transition-all"
                        >
                            {t('pricingGetStarted')}
                        </button>
                    </motion.div>

                    {/* Single Pack */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.15 }}
                        className="relative bg-zinc-900/60 border border-amber-500/30 rounded-3xl p-7 flex flex-col"
                    >
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                                <CreditCard className="w-5 h-5 text-amber-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white">{t('pricingSinglePack')}</h3>
                        </div>

                        <div className="mb-6">
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-extrabold text-white">{'\u20b9'}29</span>
                                <span className="text-white/40 text-sm">{t('pricingSingleRange')}</span>
                            </div>
                            <p className="text-white/50 text-sm mt-2">{t('pricingSingleDesc')}</p>
                        </div>

                        <ul className="space-y-2.5 mb-6 flex-1">
                            {singlePackFeatures.map((f, i) => (
                                <li key={i} className="flex items-center gap-3">
                                    <Check className="w-4 h-4 text-amber-400 shrink-0" />
                                    <span className="text-sm text-white/80">{f.text}</span>
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={handleBuyCredits}
                            disabled={loadingPlan === 'credits'}
                            className="group w-full py-3 rounded-full border border-amber-500/40 text-white font-semibold text-sm hover:bg-amber-500/10 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            {loadingPlan === 'credits' ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {t('pricingOpeningStripe')}
                                </>
                            ) : (
                                <>{t('pricingBuyCredit')}</>
                            )}
                        </button>
                    </motion.div>

                    {/* Premium Plan */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="relative bg-gradient-to-b from-red-950/40 to-zinc-900/60 border-2 border-red-500/50 rounded-3xl p-7 flex flex-col shadow-[0_0_100px_-20px_rgba(220,38,38,0.5)]"
                    >
                        {/* Popular Badge */}
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                            <span className="bg-red-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                                {t('pricingMostPopular')}
                            </span>
                        </div>

                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                                <Crown className="w-5 h-5 text-red-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white">{t('pricingPremium')}</h3>
                        </div>

                        <div className="mb-6">
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-extrabold text-white">
                                    {'\u20b9'}{isAnnual ? '999' : '149'}
                                </span>
                                <span className="text-white/40 text-sm">
                                    {isAnnual ? t('pricingPerYear') : t('pricingPerMonth')}
                                </span>
                            </div>
                            <p className="text-white/50 text-sm mt-2">
                                {isAnnual ? t('pricingBestValue') : t('pricingPremiumDesc')}
                            </p>
                        </div>

                        <ul className="space-y-2.5 mb-6 flex-1">
                            {premiumFeatures.map((f, i) => (
                                <li key={i} className="flex items-center gap-3">
                                    <Check className="w-4 h-4 text-red-400 shrink-0" />
                                    <span className="text-sm text-white/80">{f.text}</span>
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={() => handleSubscribe(isAnnual ? 'annual' : 'monthly')}
                            disabled={loadingPlan === 'monthly' || loadingPlan === 'annual'}
                            className="group w-full py-3 rounded-full bg-red-600 hover:bg-red-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm shadow-[0_0_30px_-5px_rgba(220,38,38,0.5)] transition-all flex items-center justify-center gap-2"
                        >
                            {loadingPlan === 'monthly' || loadingPlan === 'annual' ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {t('pricingOpeningStripe')}
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    {t('pricingUpgrade')}
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
