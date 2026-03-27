'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Crown, Sparkles, LogOut, Loader2, User, CreditCard, Droplets, Clock } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { apiFetch } from '@/lib/api';
import { useTranslation } from '@/lib/hooks/useTranslation';

interface UserProfile {
    id: number;
    name: string;
    email: string;
    is_premium: boolean;
    free_scans_left: number;
    credits: number;
    trial_ends_at: string | null;
    season: string | null;
    palette: string[] | null;
    stripe_subscription_id: string | null;
    created_at: string;
}

export default function AccountPage() {
    const { t } = useTranslation();
    const { data: session, status } = useSession();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function fetchProfile() {
            if (status !== 'authenticated') return;

            try {
                const res = await apiFetch('/api/auth/me');
                if (!res.ok) throw new Error('Failed to fetch profile. Please try logging in again.');
                const data = await res.json();
                setProfile(data);
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        }

        if (status === 'authenticated') {
            fetchProfile();
        } else if (status === 'unauthenticated') {
            if (typeof window !== 'undefined') window.location.href = '/';
        }
    }, [session, status]);

    const handleManageSubscription = async () => {
        try {
            const res = await apiFetch('/api/stripe/portal', { method: 'POST' });
            const data = await res.json();
            if (data.portal_url && typeof window !== 'undefined') {
                window.location.href = data.portal_url;
            }
        } catch (err) {
            console.error('Failed to open billing portal', err);
        }
    };

    if (status === 'loading' || loading) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-zinc-950">
                <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
            </main>
        );
    }

    if (error || !profile) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-zinc-950 flex-col">
                <p className="text-red-400 mb-4">{error || t('couldNotLoadProfile')}</p>
                <Link href="/" className="text-white underline">{t('returnHome')}</Link>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-red-900/50">
            <Navbar />

            <div className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="flex items-center justify-between mb-12">
                        <h1 className="text-4xl font-extrabold flex items-center gap-3">
                            <User className="w-8 h-8 text-red-500" />
                            {t('yourAccount')}
                        </h1>
                        <button
                            onClick={() => signOut({ callbackUrl: '/' })}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-red-400 transition border border-white/10"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="text-sm font-medium">{t('logOut')}</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Left Column - Profile & Subscription */}
                        <div className="md:col-span-1 space-y-6">
                            {/* Profile Card */}
                            <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10">
                                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4 text-2xl font-bold text-red-400 border border-red-500/20">
                                    {profile.name.charAt(0).toUpperCase()}
                                </div>
                                <h2 className="text-xl font-bold text-white mb-1">{profile.name}</h2>
                                <p className="text-white/50 text-sm mb-6 truncate">{profile.email}</p>

                                <div className="text-xs text-white/30 uppercase tracking-widest font-semibold mb-2">{t('memberSince')}</div>
                                <p className="text-white/80 text-sm">
                                    {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </p>
                            </div>

                            {/* Subscription & Plan */}
                            {profile.is_premium ? (
                                <div className="bg-green-900/20 border border-green-500/30 rounded-2xl p-6">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Crown className="w-5 h-5 text-green-400" />
                                        <span className="text-green-400 font-semibold">Premium Active</span>
                                    </div>
                                    <p className="text-white/60 text-sm mb-4">You have access to all features</p>
                                    <ul className="text-white/70 text-sm space-y-1 mb-4">
                                        <li>&#10003; Unlimited scans</li>
                                        <li>&#10003; AI Stylist chat</li>
                                        <li>&#10003; Wardrobe tracker</li>
                                        <li>&#10003; All product vibes</li>
                                        <li>&#10003; Daily outfit suggestions</li>
                                    </ul>
                                    <button
                                        onClick={handleManageSubscription}
                                        className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-semibold transition border border-white/10"
                                    >
                                        Manage Subscription
                                    </button>
                                </div>
                            ) : profile.trial_ends_at && new Date(profile.trial_ends_at) > new Date() ? (
                                (() => {
                                    const trialEnd = new Date(profile.trial_ends_at as string);
                                    const daysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
                                    const trialEndDate = trialEnd.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                                    return (
                                        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-2xl p-6">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Clock className="w-5 h-5 text-yellow-400" />
                                                <span className="text-yellow-400 font-semibold">Trial &mdash; {daysLeft} days remaining</span>
                                            </div>
                                            <p className="text-white/60 text-sm mb-2">Your trial ends on {trialEndDate}</p>
                                            <p className="text-white/50 text-sm mb-4">After trial: 3 free scans, no AI Stylist</p>
                                            <Link
                                                href="/pricing"
                                                className="block w-full text-center py-3 rounded-xl bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-bold transition"
                                            >
                                                Upgrade to Premium &mdash; &#8377;149/mo
                                            </Link>
                                        </div>
                                    );
                                })()
                            ) : (
                                <div className="bg-zinc-800/50 border border-white/10 rounded-2xl p-6">
                                    <div className="flex items-center gap-2 mb-3">
                                        <CreditCard className="w-5 h-5 text-white/50" />
                                        <span className="text-white/80 font-semibold">Free Plan</span>
                                    </div>
                                    <p className="text-white/60 text-sm mb-2">{profile.free_scans_left} free scans remaining</p>
                                    {profile.credits > 0 && (
                                        <p className="text-white/60 text-sm mb-2">{profile.credits} credits</p>
                                    )}
                                    <Link
                                        href="/pricing"
                                        className="block w-full text-center py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition shadow-[0_0_20px_-5px_rgba(220,38,38,0.4)] mt-4"
                                    >
                                        Upgrade for unlimited access
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Right Column - Color Profile & Improvements */}
                        <div className="md:col-span-2 space-y-6">
                            {/* Color Profile Card */}
                            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 relative overflow-hidden">
                                <div className="flex items-start justify-between mb-8 z-10 relative">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Droplets className="w-5 h-5 text-red-400" />
                                            <h3 className="text-xl font-bold text-white">{t('yourColorProfile')}</h3>
                                        </div>
                                        <p className="text-white/50 text-sm">{t('basedOnLatestScan')}</p>
                                    </div>

                                    {profile.season && (
                                        <div className="text-right">
                                            <div className="text-xs text-red-400 uppercase tracking-widest font-bold mb-1">{t('season')}</div>
                                            <div className="text-2xl font-extrabold text-white">{profile.season}</div>
                                        </div>
                                    )}
                                </div>

                                {profile.palette && profile.palette.length > 0 ? (
                                    <div className="z-10 relative">
                                        <div className="text-xs text-white/40 uppercase tracking-widest font-semibold mb-3">Core Palette</div>
                                        <div className="flex flex-wrap gap-3">
                                            {profile.palette.map((hex) => (
                                                <div key={hex} className="group relative">
                                                    <div
                                                        className="w-12 h-12 rounded-full border-2 border-white/10 shadow-lg cursor-pointer transition-transform hover:scale-110 hover:border-white/50"
                                                        style={{ backgroundColor: hex }}
                                                    />
                                                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-[10px] py-1 px-2 rounded tracking-wider shadow-xl border border-white/10 z-20">
                                                        {hex}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-8 flex gap-4">
                                            <Link
                                                href="/shopping-agent"
                                                className="flex-1 py-3 px-6 rounded-full bg-white text-black font-bold text-sm text-center hover:bg-gray-200 transition"
                                            >
                                                {t('shopMyColors')}
                                            </Link>
                                            <Link
                                                href="/analyze"
                                                className="py-3 px-6 rounded-full bg-white/5 text-white border border-white/10 text-sm font-semibold hover:bg-white/10 transition"
                                            >
                                                {t('retakeScan')}
                                            </Link>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 z-10 relative bg-black/20 rounded-2xl border border-white/5">
                                        <Sparkles className="w-8 h-8 text-white/20 mx-auto mb-3" />
                                        <p className="text-white/60 mb-4">{t('notAnalyzedYet')}</p>
                                        <Link
                                            href="/analyze"
                                            className="inline-block py-2 px-6 rounded-full bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition"
                                        >
                                            {t('startFreeScan')}
                                        </Link>
                                    </div>
                                )}

                                {/* Decorative glow behind palette */}
                                {profile.palette && profile.palette.length > 0 && (
                                    <div
                                        className="absolute -right-20 -bottom-20 w-64 h-64 rounded-full blur-[100px] opacity-20 pointer-events-none"
                                        style={{ backgroundColor: profile.palette[0] }}
                                    />
                                )}
                            </div>

                            {/* Fashion Insights / Improvement Tracker (Premium) */}
                            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10">
                                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-yellow-400" />
                                    {t('fashionInsights')}
                                </h3>
                                <p className="text-white/50 text-sm mb-6">{t('fashionInsightsDesc')}</p>

                                {profile.is_premium ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                            <div className="text-xs text-white/40 uppercase tracking-widest font-semibold mb-2">{t('styleRating')}</div>
                                            <div className="text-3xl font-extrabold text-white/30 mb-1">&mdash;</div>
                                            <div className="text-xs text-white/50">Coming soon</div>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                            <div className="text-xs text-white/40 uppercase tracking-widest font-semibold mb-2">{t('savedOutfits')}</div>
                                            <div className="text-3xl font-extrabold text-white/30 mb-1">&mdash;</div>
                                            <div className="text-xs text-white/50">Coming soon</div>
                                        </div>
                                        <div className="col-span-2 p-5 rounded-2xl bg-yellow-500/10 border border-yellow-500/20">
                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
                                                    <Sparkles className="w-5 h-5 text-yellow-400" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-white mb-1">{t('aiStylistTip')}</h4>
                                                    <p className="text-sm text-yellow-100/70">
                                                        With {profile.season || 'your'} colors, try pairing deep navy trousers with a crisp white shirt for a high-contrast winter look.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative overflow-hidden rounded-2xl border border-white/10">
                                        {/* Blurred Premium Content */}
                                        <div className="p-6 bg-white/[0.02] filter blur-md opacity-50 flex gap-4 select-none">
                                            <div className="w-1/2 h-24 bg-white/10 rounded-xl" />
                                            <div className="w-1/2 h-24 bg-white/10 rounded-xl" />
                                        </div>

                                        {/* Paywall Overlay */}
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-10 flex-col px-6 text-center">
                                            <Crown className="w-8 h-8 text-red-500 mb-3" />
                                            <h4 className="text-lg font-bold text-white mb-2">{t('unlockFashionInsights')}</h4>
                                            <p className="text-sm text-white/60 mb-4 max-w-sm">
                                                {t('unlockFashionInsightsDesc')}
                                            </p>
                                            <Link
                                                href="/pricing"
                                                className="px-6 py-2 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition"
                                            >
                                                {t('viewPlans')}
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            <Footer />
        </main>
    );
}
