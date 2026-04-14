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
                    <p className="text-primary text-sm font-label font-bold tracking-widest uppercase mb-4">
                        {t('pricingLabel')}
                    </p>
                    <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-on-surface mb-4">
                        {t('pricingTitle')}
                    </h2>
                    <p className="text-on-surface-variant text-lg max-w-xl mx-auto">
                        {t('pricingSubtitle')}
                    </p>

                    {/* Billing Toggle */}
                    <div className="flex items-center justify-center gap-4 mt-8">
                        <span className={`text-sm font-label font-medium transition-colors ${!isAnnual ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                            {t('pricingMonthly')}
                        </span>
                        <button
                            onClick={() => setIsAnnual(!isAnnual)}
                            role="switch"
                            aria-checked={isAnnual}
                            aria-label={t('pricingToggle')}
                            className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${isAnnual ? 'bg-primary-container' : 'bg-surface-container'}`}
                        >
                            <div
                                className={`absolute top-0.5 w-6 h-6 rounded-full bg-on-surface shadow-md transition-transform duration-300 ${isAnnual ? 'translate-x-7' : 'translate-x-0.5'}`}
                            />
                        </button>
                        <span className={`text-sm font-label font-medium transition-colors ${isAnnual ? 'text-on-surface' : 'text-on-surface-variant'}`}>
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
                    <p className="text-primary text-sm text-center mb-6">{checkoutError}</p>
                )}

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-3 gap-8 md:gap-6 max-w-5xl mx-auto">
                    {/* Free Plan */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="relative bg-surface-container/50 border border-primary/10 rounded-3xl p-7 flex flex-col"
                    >
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center">
                                <Zap className="w-5 h-5 text-on-surface-variant" />
                            </div>
                            <h3 className="font-headline text-xl font-bold text-on-surface">{t('pricingFree')}</h3>
                        </div>

                        <div className="mb-6">
                            <div className="flex items-baseline gap-1">
                                <span className="font-display text-4xl font-extrabold text-on-surface">{'\u20b9'}0</span>
                                <span className="text-on-surface-variant text-sm">{t('pricingForever')}</span>
                            </div>
                            <p className="text-on-surface-variant text-sm mt-2">{t('pricingFreeDesc')}</p>
                        </div>

                        <ul className="space-y-2.5 mb-6 flex-1">
                            {freeFeatures.map((f, i) => (
                                <li key={i} className="flex items-center gap-3">
                                    {f.included ? (
                                        <Check className="w-4 h-4 text-tertiary shrink-0" />
                                    ) : (
                                        <X className="w-4 h-4 text-on-surface-variant/30 shrink-0" />
                                    )}
                                    <span className={`text-sm ${f.included ? 'text-on-surface-variant' : 'text-on-surface-variant/40'}`}>
                                        {f.text}
                                    </span>
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={() => onOpenAuth?.()}
                            className="w-full py-3 rounded-full border border-outline-variant/30 text-on-surface font-label font-semibold text-sm hover:bg-surface-container transition-all"
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
                        className="relative bg-surface-container/50 border border-primary/30 rounded-3xl p-7 flex flex-col"
                    >
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                                <CreditCard className="w-5 h-5 text-primary" />
                            </div>
                            <h3 className="font-headline text-xl font-bold text-on-surface">{t('pricingSinglePack')}</h3>
                        </div>

                        <div className="mb-6">
                            <div className="flex items-baseline gap-1">
                                <span className="font-display text-4xl font-extrabold text-on-surface">{'\u20b9'}29</span>
                                <span className="text-on-surface-variant text-sm">{t('pricingSingleRange')}</span>
                            </div>
                            <p className="text-on-surface-variant text-sm mt-2">{t('pricingSingleDesc')}</p>
                        </div>

                        <ul className="space-y-2.5 mb-6 flex-1">
                            {singlePackFeatures.map((f, i) => (
                                <li key={i} className="flex items-center gap-3">
                                    <Check className="w-4 h-4 text-primary shrink-0" />
                                    <span className="text-sm text-on-surface-variant">{f.text}</span>
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={handleBuyCredits}
                            disabled={loadingPlan === 'credits'}
                            className="group w-full py-3 rounded-full border border-primary/30 text-on-surface font-label font-semibold text-sm hover:bg-primary/10 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
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
                        className="relative bg-gradient-to-b from-primary/10 to-surface-container/60 border-2 border-primary/40 rounded-3xl p-7 flex flex-col shadow-[0_0_100px_-20px_rgba(240,191,98,0.2)]"
                    >
                        {/* Popular Badge */}
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                            <span className="bg-primary-container text-on-primary-container text-xs font-label font-bold px-4 py-1.5 rounded-full shadow-lg">
                                {t('pricingMostPopular')}
                            </span>
                        </div>

                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                                <Crown className="w-5 h-5 text-primary" />
                            </div>
                            <h3 className="font-headline text-xl font-bold text-on-surface">{t('pricingPremium')}</h3>
                        </div>

                        <div className="mb-6">
                            <div className="flex items-baseline gap-1">
                                <span className="font-display text-4xl font-extrabold text-on-surface">
                                    {'\u20b9'}{isAnnual ? '999' : '149'}
                                </span>
                                <span className="text-on-surface-variant text-sm">
                                    {isAnnual ? t('pricingPerYear') : t('pricingPerMonth')}
                                </span>
                            </div>
                            <p className="text-on-surface-variant text-sm mt-2">
                                {isAnnual ? t('pricingBestValue') : t('pricingPremiumDesc')}
                            </p>
                        </div>

                        <ul className="space-y-2.5 mb-6 flex-1">
                            {premiumFeatures.map((f, i) => (
                                <li key={i} className="flex items-center gap-3">
                                    <Check className="w-4 h-4 text-primary shrink-0" />
                                    <span className="text-sm text-on-surface-variant">{f.text}</span>
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={() => handleSubscribe(isAnnual ? 'annual' : 'monthly')}
                            disabled={loadingPlan === 'monthly' || loadingPlan === 'annual'}
                            className="group w-full py-3 rounded-full bg-primary-container hover:bg-primary disabled:opacity-60 disabled:cursor-not-allowed text-on-primary-container font-label font-bold text-sm shadow-[0_0_30px_-5px_rgba(240,191,98,0.3)] transition-all flex items-center justify-center gap-2"
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
