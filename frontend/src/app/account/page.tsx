'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Crown, Sparkles, LogOut, Loader2, User } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { apiFetch } from '@/lib/api';
import { useTranslation } from '@/lib/hooks/useTranslation';
import SubscriptionPanel from '@/components/account/SubscriptionPanel';
import ColorProfileSection from '@/components/account/ColorProfileSection';
import DataPrivacySection from '@/components/account/DataPrivacySection';
import AppLayout from '@/components/layout/AppLayout';

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
    age: number | null;
    sex: string | null;
    stripe_subscription_id: string | null;
    created_at: string;
}

export default function AccountPage() {
    const { t } = useTranslation();
    const { data: session, status } = useSession();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Age/sex edit state
    const [editingProfile, setEditingProfile] = useState(false);
    const [editAge, setEditAge] = useState('');
    const [editSex, setEditSex] = useState('');
    const [editError, setEditError] = useState('');
    const [savingProfile, setSavingProfile] = useState(false);
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
            // Validate URL is a Stripe billing portal URL before redirecting (prevent open redirect)
            if (data.portal_url && typeof data.portal_url === 'string' && data.portal_url.startsWith('https://billing.stripe.com/') && typeof window !== 'undefined') {
                window.location.href = data.portal_url;
            }
        } catch (err) {
            console.error('Failed to open billing portal', err);
        }
    };

    const handleExportData = async () => {
        setExporting(true);
        try {
            const res = await apiFetch('/api/auth/me/export');
            if (!res.ok) throw new Error('Export failed');
            const data = await res.json();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `lumiqe-data-export-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export failed', err);
            setError('Failed to export data. Please try again.');
        } finally {
            setExporting(false);
        }
    };

    const handleDeleteAccount = async () => {
        setDeleting(true);
        try {
            const res = await apiFetch('/api/auth/me', { method: 'DELETE' });
            if (!res.ok) throw new Error('Deletion failed');
            signOut({ callbackUrl: '/' });
        } catch (err) {
            console.error('Account deletion failed', err);
            setError('Failed to delete account. Please try again.');
            setDeleting(false);
            setDeleteConfirm(false);
        }
    };

    const handleSaveProfile = async () => {
        const ageNum = parseInt(editAge, 10);
        if (editAge && (isNaN(ageNum) || ageNum < 13 || ageNum > 100)) {
            setEditError('Enter a valid age (13–100)');
            return;
        }
        setEditError('');
        setSavingProfile(true);
        try {
            const body: Record<string, unknown> = {};
            if (editAge) body.age = ageNum;
            if (editSex) body.sex = editSex;
            const res = await apiFetch('/api/profile/quiz', {
                method: 'POST',
                body: JSON.stringify(body),
            });
            if (!res.ok) throw new Error('Save failed');
            // Update local profile state
            setProfile((prev) => prev ? { ...prev, age: ageNum || prev.age, sex: editSex || prev.sex } : prev);
            setEditingProfile(false);
        } catch {
            setEditError('Failed to save. Please try again.');
        } finally {
            setSavingProfile(false);
        }
    };

    if (status === 'loading' || loading) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
            </AppLayout>
        );
    }

    if (error || !profile) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center min-h-[60vh] flex-col">
                    <p className="text-error mb-4 font-label">{error || t('couldNotLoadProfile')}</p>
                    <Link href="/" className="text-primary underline font-label">{t('returnHome')}</Link>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto">
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

                                {/* Age & Sex */}
                                <div className="mt-6 pt-5 border-t border-white/10">
                                    {!editingProfile ? (
                                        <>
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="text-xs text-white/30 uppercase tracking-widest font-semibold">Profile Details</div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setEditAge(profile.age?.toString() || '');
                                                        setEditSex(profile.sex || '');
                                                        setEditingProfile(true);
                                                        setEditError('');
                                                    }}
                                                    className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors"
                                                >
                                                    Edit
                                                </button>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-white/50">Age</span>
                                                    <span className="text-white/80">{profile.age || '—'}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-white/50">Sex</span>
                                                    <span className="text-white/80">{profile.sex || '—'}</span>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="space-y-4">
                                            <div>
                                                <label htmlFor="edit-age" className="block text-xs text-white/50 mb-1.5">Age</label>
                                                <input
                                                    id="edit-age"
                                                    type="number"
                                                    inputMode="numeric"
                                                    min={13}
                                                    max={100}
                                                    value={editAge}
                                                    onChange={(e) => setEditAge(e.target.value)}
                                                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-white/50 mb-1.5">Sex</label>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {['Male', 'Female', 'Other'].map((option) => (
                                                        <button
                                                            key={option}
                                                            type="button"
                                                            onClick={() => setEditSex(option)}
                                                            className={`py-2 rounded-lg text-xs font-semibold transition-all border ${
                                                                editSex === option
                                                                    ? 'bg-red-600/20 border-red-500/50 text-red-300'
                                                                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                                                            }`}
                                                        >
                                                            {option}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            {editError && <p className="text-red-400 text-xs">{editError}</p>}
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={handleSaveProfile}
                                                    disabled={savingProfile}
                                                    className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition disabled:opacity-50"
                                                >
                                                    {savingProfile ? 'Saving...' : 'Save'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setEditingProfile(false)}
                                                    className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 text-xs font-medium transition border border-white/10"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Subscription & Plan */}
                            <SubscriptionPanel
                                profile={profile}
                                onManageSubscription={handleManageSubscription}
                            />
                        </div>

                        {/* Right Column - Color Profile & Improvements */}
                        <div className="md:col-span-2 space-y-6">
                            <ColorProfileSection
                                season={profile.season}
                                palette={profile.palette}
                                colorProfileLabel={t('yourColorProfile')}
                                basedOnLatestScanLabel={t('basedOnLatestScan')}
                                seasonLabel={t('season')}
                                shopMyColorsLabel={t('shopMyColors')}
                                retakeScanLabel={t('retakeScan')}
                                notAnalyzedYetLabel={t('notAnalyzedYet')}
                                startFreeScanLabel={t('startFreeScan')}
                            />

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

                    {/* GDPR — Data & Privacy */}
                    <DataPrivacySection
                        exporting={exporting}
                        deleting={deleting}
                        deleteConfirm={deleteConfirm}
                        onExport={handleExportData}
                        onDeleteRequest={() => setDeleteConfirm(true)}
                        onDeleteConfirm={handleDeleteAccount}
                        onDeleteCancel={() => setDeleteConfirm(false)}
                    />
                </motion.div>
            </div>
        </AppLayout>
    );
}
