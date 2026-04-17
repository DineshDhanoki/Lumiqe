'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { events } from '@/lib/analytics';
import { apiFetch } from '@/lib/api';
import { useTranslation } from '@/lib/hooks/useTranslation';

interface PricingProps {
    onOpenAuth?: () => void;
}

export default function Pricing({ onOpenAuth }: PricingProps) {
    const { t } = useTranslation();
    const [isAnnual, setIsAnnual] = useState(true);
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

    return (
        <section id="pricing" className="pt-32 pb-24 px-4 md:px-8 max-w-7xl mx-auto min-h-screen"
            style={{ background: 'radial-gradient(circle at top right, #18181F 0%, #09090B 100%)' }}>

            {/* Hero header */}
            <motion.header
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center mb-16 space-y-6"
            >
                <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight text-on-surface">
                    Elevate Your Presence.
                </h1>
                <p className="max-w-2xl mx-auto text-on-surface-variant text-lg leading-relaxed">
                    Choose the tier that reflects your ambition. Our AI-curated digital atelier is designed for those who view style as a science.
                </p>

                {/* Monthly / Annual toggle */}
                <div className="flex items-center justify-center gap-4 pt-4">
                    <span className={`font-label text-sm transition-colors ${!isAnnual ? 'text-on-surface' : 'text-on-surface-variant'}`}>Monthly</span>
                    <button
                        role="switch"
                        aria-checked={isAnnual}
                        onClick={() => setIsAnnual(!isAnnual)}
                        className="relative w-14 h-7 bg-surface-container-highest rounded-full p-1 transition-all duration-300"
                    >
                        <div className={`absolute top-1 w-5 h-5 bg-primary rounded-full shadow-sm transition-all duration-300 ${isAnnual ? 'right-1' : 'left-1'}`} />
                    </button>
                    <span className={`font-label text-sm transition-colors ${isAnnual ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                        Annual{' '}
                        <span className="text-primary-container font-mono ml-1 text-xs">(-20%)</span>
                    </span>
                </div>
            </motion.header>

            {checkoutError && (
                <p className="text-primary text-sm text-center mb-8">{checkoutError}</p>
            )}

            {/* Pricing cards — 2-column */}
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-24">

                {/* Free Tier */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="bg-surface-container-low rounded-3xl p-10 flex flex-col justify-between border border-white/5 hover:border-white/10 transition-all duration-500"
                >
                    <div>
                        <h3 className="font-headline font-bold text-xs uppercase tracking-[0.2em] text-on-surface-variant mb-4">Essentials</h3>
                        <h2 className="font-display text-4xl font-bold text-on-surface mb-2">Free Tier</h2>
                        <div className="flex items-baseline gap-1 mb-8">
                            <span className="text-3xl font-headline font-bold text-on-surface">$0</span>
                            <span className="text-on-surface-variant font-label text-sm">/ forever</span>
                        </div>
                        <ul className="space-y-4 mb-12">
                            {[
                                { text: 'Basic Skin Tone Analysis', included: true },
                                { text: 'Digital Wardrobe (Up to 25 items)', included: true },
                                { text: 'Seasonal Color Palette (Static)', included: true },
                                { text: 'AI Personal Stylist', included: false },
                            ].map((f) => (
                                <li key={f.text} className={`flex items-center gap-3 ${f.included ? 'text-on-surface-variant' : 'text-on-surface/20'}`}>
                                    {f.included ? (
                                        <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                                    ) : (
                                        <span className="material-symbols-outlined text-lg">block</span>
                                    )}
                                    <span className="font-label text-sm">{f.text}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <button
                        onClick={() => onOpenAuth?.()}
                        className="w-full py-4 rounded-[10px] border border-outline-variant text-on-surface font-label font-medium hover:bg-white/5 transition-all"
                    >
                        Begin Journey
                    </button>
                </motion.div>

                {/* Pro Tier */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="relative bg-surface-container rounded-3xl p-10 flex flex-col justify-between border border-primary/30 transition-all duration-500 overflow-hidden"
                    style={{ boxShadow: '0 0 40px -10px rgba(196,151,62,0.2)' }}
                >
                    {/* Background accent */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-[80px]" />
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="font-headline font-bold text-xs uppercase tracking-[0.2em] text-primary">Elite Access</h3>
                            <span className="bg-primary/20 text-primary-container text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider">Most Coveted</span>
                        </div>
                        <h2 className="font-display text-4xl font-bold text-on-surface mb-2">Pro Tier</h2>
                        <div className="flex items-baseline gap-1 mb-8">
                            <span className="text-3xl font-headline font-bold text-on-surface">
                                {isAnnual ? '$23' : '$29'}
                            </span>
                            <span className="text-on-surface-variant font-label text-sm">
                                {isAnnual ? '/ month billed annually' : '/ month'}
                            </span>
                        </div>
                        <ul className="space-y-4 mb-12">
                            {[
                                'Deep Neural Tone Mapping',
                                'Unlimited Vault Capacity',
                                'Real-time AI Style Consultation',
                                'VIP Community & Drops Access',
                            ].map((text) => (
                                <li key={text} className="flex items-center gap-3 text-on-surface">
                                    <span className="material-symbols-outlined text-primary text-lg">verified</span>
                                    <span className="font-label text-sm">{text}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <button
                        onClick={() => handleSubscribe(isAnnual ? 'annual' : 'monthly')}
                        disabled={loadingPlan === 'monthly' || loadingPlan === 'annual'}
                        className="relative z-10 w-full py-4 rounded-[10px] bg-primary text-on-primary font-label font-bold hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                        {loadingPlan === 'monthly' || loadingPlan === 'annual' ? (
                            <>
                                <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                                Opening checkout...
                            </>
                        ) : (
                            'Upgrade to Elite'
                        )}
                    </button>
                </motion.div>
            </div>

            {/* Comparison table */}
            <section className="max-w-5xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <h2 className="font-display text-3xl font-bold text-on-surface">A Closer Look</h2>
                    <p className="font-label text-on-surface-variant text-sm">The technical specifications of your digital transformation.</p>
                </motion.div>
                <div className="overflow-hidden rounded-2xl border border-white/5 bg-surface-container-low/50 backdrop-blur-sm">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="p-6 font-headline text-xs uppercase tracking-widest text-on-surface-variant font-semibold">Feature</th>
                                <th className="p-6 font-headline text-xs uppercase tracking-widest text-on-surface-variant font-semibold">Essentials</th>
                                <th className="p-6 font-headline text-xs uppercase tracking-widest text-primary font-semibold">Pro Tier</th>
                            </tr>
                        </thead>
                        <tbody className="font-label text-sm">
                            {[
                                { feature: 'Wardrobe Size', free: '25 Items', pro: 'Infinite' },
                                { feature: 'Color Analysis', free: '12-Point Analysis', pro: 'Spectral Skin Mapping' },
                                { feature: 'AI Suggestions', free: '3 Daily', pro: 'Real-time / Unlimited' },
                                { feature: 'Style History', free: '7 Days', pro: 'Full Archive' },
                            ].map((row, i) => (
                                <tr key={row.feature} className={i < 3 ? 'border-b border-white/5' : ''}>
                                    <td className="p-6 text-on-surface font-medium">{row.feature}</td>
                                    <td className="p-6 text-on-surface-variant">{row.free}</td>
                                    <td className="p-6 text-primary">{row.pro}</td>
                                </tr>
                            ))}
                            <tr>
                                <td className="p-6 text-on-surface font-medium">Priority Support</td>
                                <td className="p-6 text-on-surface-variant">
                                    <span className="material-symbols-outlined text-on-surface/10">horizontal_rule</span>
                                </td>
                                <td className="p-6 text-primary">
                                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Aesthetic imagery */}
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="mt-24 grid md:grid-cols-3 gap-6 max-w-5xl mx-auto"
            >
                {['/pricing-img-1.jpg', '/pricing-img-2.jpg', '/pricing-img-3.jpg'].map((src) => (
                    <div key={src} className="h-64 rounded-3xl overflow-hidden grayscale hover:grayscale-0 transition-all duration-700 bg-surface-container-high">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={src}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                        />
                    </div>
                ))}
            </motion.section>
        </section>
    );
}
