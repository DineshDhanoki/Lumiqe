'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Crown, Sparkles, LogOut, Loader2, User, CreditCard, Droplets } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface UserProfile {
    id: number;
    name: string;
    email: string;
    is_premium: boolean;
    free_scans_left: number;
    season: string | null;
    palette: string[] | null;
    stripe_subscription_id: string | null;
    created_at: string;
}

export default function AccountPage() {
    const { data: session, status } = useSession();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function fetchProfile() {
            if (status !== 'authenticated') return;

            if (!(session as any)?.backendToken) {
                setError('Session expired. Please log out and back in.');
                setLoading(false);
                return;
            }

            try {
                const res = await fetch(`${API_BASE}/api/auth/me`, {
                    headers: {
                        'Authorization': `Bearer ${(session as any).backendToken}`
                    }
                });

                if (!res.ok) throw new Error('Failed to fetch profile. Please try logging in again.');
                const data = await res.json();
                setProfile(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        if (status === 'authenticated') {
            fetchProfile();
        } else if (status === 'unauthenticated') {
            window.location.href = '/';
        }
    }, [session, status]);

    const handleManageSubscription = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/stripe/portal`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${(session as any)?.backendToken}`
                }
            });
            const data = await res.json();
            if (data.portal_url) {
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
                <p className="text-red-400 mb-4">{error || 'Could not load profile'}</p>
                <Link href="/" className="text-white underline">Return Home</Link>
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
                            Your Account
                        </h1>
                        <button
                            onClick={() => signOut({ callbackUrl: '/' })}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-red-400 transition border border-white/10"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="text-sm font-medium">Log Out</span>
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

                                <div className="text-xs text-white/30 uppercase tracking-widest font-semibold mb-2">Member Since</div>
                                <p className="text-white/80 text-sm">
                                    {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </p>
                            </div>

                            {/* Subscription Card */}
                            <div className={`p-6 rounded-3xl border relative overflow-hidden ${profile.is_premium
                                ? 'bg-gradient-to-br from-red-950/40 to-black border-red-500/30'
                                : 'bg-white/[0.02] border-white/10'
                                }`}
                            >
                                {profile.is_premium && (
                                    <div className="absolute top-0 right-0 p-4">
                                        <div className="w-12 h-12 bg-red-500/20 rounded-full blur-xl absolute" />
                                        <Crown className="w-6 h-6 text-red-400 relative z-10" />
                                    </div>
                                )}

                                <div className="flex items-center gap-2 mb-4">
                                    <CreditCard className="w-5 h-5 text-white/50" />
                                    <h3 className="text-lg font-bold text-white">Plan</h3>
                                </div>

                                <div className="mb-6">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${profile.is_premium
                                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                        : 'bg-white/10 text-white/60 border border-white/10'
                                        }`}>
                                        {profile.is_premium ? 'Lumiqe Premium' : 'Free Tier'}
                                    </span>
                                </div>

                                {profile.is_premium ? (
                                    <button
                                        onClick={handleManageSubscription}
                                        className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-semibold transition border border-white/10"
                                    >
                                        Manage Subscription
                                    </button>
                                ) : (
                                    <div className="space-y-4">
                                        <p className="text-white/50 text-sm">
                                            {profile.free_scans_left} free scans remaining
                                        </p>
                                        <Link
                                            href="/pricing"
                                            className="block w-full text-center py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition shadow-[0_0_20px_-5px_rgba(220,38,38,0.4)]"
                                        >
                                            Upgrade Full Access
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column - Color Profile & Improvements */}
                        <div className="md:col-span-2 space-y-6">
                            {/* Color Profile Card */}
                            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 relative overflow-hidden">
                                <div className="flex items-start justify-between mb-8 z-10 relative">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Droplets className="w-5 h-5 text-red-400" />
                                            <h3 className="text-xl font-bold text-white">Your Color Profile</h3>
                                        </div>
                                        <p className="text-white/50 text-sm">Based on your latest scan analysis</p>
                                    </div>

                                    {profile.season && (
                                        <div className="text-right">
                                            <div className="text-xs text-red-400 uppercase tracking-widest font-bold mb-1">Season</div>
                                            <div className="text-2xl font-extrabold text-white">{profile.season}</div>
                                        </div>
                                    )}
                                </div>

                                {profile.palette && profile.palette.length > 0 ? (
                                    <div className="z-10 relative">
                                        <div className="text-xs text-white/40 uppercase tracking-widest font-semibold mb-3">Core Palette</div>
                                        <div className="flex flex-wrap gap-3">
                                            {profile.palette.map((hex, i) => (
                                                <div key={i} className="group relative">
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
                                                href="/feed"
                                                className="flex-1 py-3 px-6 rounded-full bg-white text-black font-bold text-sm text-center hover:bg-gray-200 transition"
                                            >
                                                Shop My Colors
                                            </Link>
                                            <Link
                                                href="/analyze"
                                                className="py-3 px-6 rounded-full bg-white/5 text-white border border-white/10 text-sm font-semibold hover:bg-white/10 transition"
                                            >
                                                Retake Scan
                                            </Link>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 z-10 relative bg-black/20 rounded-2xl border border-white/5">
                                        <Sparkles className="w-8 h-8 text-white/20 mx-auto mb-3" />
                                        <p className="text-white/60 mb-4">You haven&apos;t analyzed your skin tone yet.</p>
                                        <Link
                                            href="/analyze"
                                            className="inline-block py-2 px-6 rounded-full bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition"
                                        >
                                            Start Free Scan
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
                                    Fashion Insights & Tracker
                                </h3>
                                <p className="text-white/50 text-sm mb-6">Your personal style metrics and recommendations</p>

                                {profile.is_premium ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                            <div className="text-xs text-white/40 uppercase tracking-widest font-semibold mb-2">Style Rating</div>
                                            <div className="text-3xl font-extrabold text-green-400 mb-1">92%</div>
                                            <div className="text-xs text-white/50">Based on color adherence</div>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                            <div className="text-xs text-white/40 uppercase tracking-widest font-semibold mb-2">Saved Outfits</div>
                                            <div className="text-3xl font-extrabold text-white mb-1">14</div>
                                            <div className="text-xs text-white/50">In your digital wardrobe</div>
                                        </div>
                                        <div className="col-span-2 p-5 rounded-2xl bg-yellow-500/10 border border-yellow-500/20">
                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
                                                    <Sparkles className="w-5 h-5 text-yellow-400" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-white mb-1">AI Stylist Tip</h4>
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
                                            <h4 className="text-lg font-bold text-white mb-2">Unlock Fashion Insights</h4>
                                            <p className="text-sm text-white/60 mb-4 max-w-sm">
                                                Upgrade to Premium to track your style improvements, save outfits, and get daily AI stylist tips.
                                            </p>
                                            <Link
                                                href="/pricing"
                                                className="px-6 py-2 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition"
                                            >
                                                View Plans
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
