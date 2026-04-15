'use client';

import Link from 'next/link';

interface UserProfile {
    is_premium: boolean;
    free_scans_left: number;
    credits: number;
    trial_ends_at: string | null;
    stripe_subscription_id: string | null;
    season: string | null;
}

interface SubscriptionPanelProps {
    profile: UserProfile;
    onManageSubscription: () => void;
}

const PREMIUM_FEATURES = [
    'Unlimited AI scans',
    'AI Stylist chat',
    'Wardrobe tracker',
    'All product vibes',
    'Daily outfit suggestions',
];

export default function SubscriptionPanel({ profile, onManageSubscription }: SubscriptionPanelProps) {
    // ── Premium ──────────────────────────────────────────────
    if (profile.is_premium) {
        return (
            <section className="bg-surface-container rounded-3xl overflow-hidden">
                <div className="px-8 py-6 border-b border-outline-variant/10 bg-surface-container-high/20 flex items-center justify-between">
                    <h3 className="font-headline text-xl font-bold text-on-surface">Subscription Management</h3>
                    <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-[10px] font-mono tracking-widest uppercase">
                        Premium
                    </span>
                </div>
                <div className="p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-2xl bg-surface-container-high/30 border border-outline-variant/10">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                                    workspace_premium
                                </span>
                                <p className="font-headline text-lg font-semibold text-on-surface">Obsidian Annual Access</p>
                            </div>
                            <p className="text-on-surface-variant text-sm ml-7">Full access to all features</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                onClick={onManageSubscription}
                                className="px-6 py-3 font-label text-[10px] uppercase tracking-widest text-on-surface border border-outline-variant/30 rounded-full hover:bg-surface-container-high/50 transition-colors"
                            >
                                Manage Billing
                            </button>
                        </div>
                    </div>

                    {/* Feature list */}
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {PREMIUM_FEATURES.map((feat) => (
                            <div key={feat} className="flex items-center gap-2 text-sm text-on-surface-variant">
                                <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                                    check_circle
                                </span>
                                {feat}
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    // ── Trial ─────────────────────────────────────────────────
    if (profile.trial_ends_at && new Date(profile.trial_ends_at) > new Date()) {
        const trialEnd = new Date(profile.trial_ends_at);
        const daysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
        const trialEndDate = trialEnd.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

        return (
            <section className="bg-surface-container rounded-3xl overflow-hidden">
                <div className="px-8 py-6 border-b border-outline-variant/10 bg-surface-container-high/20 flex items-center justify-between">
                    <h3 className="font-headline text-xl font-bold text-on-surface">Subscription Management</h3>
                    <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-[10px] font-mono tracking-widest uppercase">
                        Trial
                    </span>
                </div>
                <div className="p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-2xl bg-surface-container-high/30 border border-outline-variant/10">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="material-symbols-outlined text-primary text-xl">schedule</span>
                                <p className="font-headline text-lg font-semibold text-on-surface">{daysLeft} days remaining</p>
                            </div>
                            <p className="text-on-surface-variant text-sm ml-7">Trial ends {trialEndDate}</p>
                            <p className="text-on-surface-variant/60 text-xs ml-7 mt-1">After trial: 3 free scans, no AI Stylist</p>
                        </div>
                        <Link
                            href="/pricing"
                            className="px-6 py-3 font-label text-[10px] uppercase tracking-widest text-primary border border-primary/30 rounded-full bg-primary/5 hover:bg-primary/10 transition-colors whitespace-nowrap"
                        >
                            Upgrade Plan
                        </Link>
                    </div>
                </div>
            </section>
        );
    }

    // ── Free ─────────────────────────────────────────────────
    return (
        <section className="bg-surface-container rounded-3xl overflow-hidden">
            <div className="px-8 py-6 border-b border-outline-variant/10 bg-surface-container-high/20 flex items-center justify-between">
                <h3 className="font-headline text-xl font-bold text-on-surface">Subscription Management</h3>
                <span className="px-3 py-1 bg-surface-container-high text-on-surface-variant border border-outline-variant/20 rounded-full text-[10px] font-mono tracking-widest uppercase">
                    Free
                </span>
            </div>
            <div className="p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-2xl bg-surface-container-high/30 border border-outline-variant/10">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="material-symbols-outlined text-on-surface-variant text-xl">credit_card</span>
                            <p className="font-headline text-lg font-semibold text-on-surface">Free Plan</p>
                        </div>
                        <p className="text-on-surface-variant text-sm ml-7">{profile.free_scans_left} free scans remaining</p>
                        {profile.credits > 0 && (
                            <p className="text-on-surface-variant/60 text-xs ml-7 mt-1">{profile.credits} credits available</p>
                        )}
                    </div>
                    <Link
                        href="/pricing"
                        className="px-6 py-3 font-label text-[10px] uppercase tracking-widest bg-gradient-to-r from-primary-container to-primary text-on-primary rounded-full hover:opacity-90 transition-opacity whitespace-nowrap shadow-[0_0_20px_-5px_rgba(240,191,98,0.3)]"
                    >
                        Upgrade for Full Access
                    </Link>
                </div>
            </div>
        </section>
    );
}
