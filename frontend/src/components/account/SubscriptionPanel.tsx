'use client';

import { Crown, CreditCard, Clock } from 'lucide-react';
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

export default function SubscriptionPanel({ profile, onManageSubscription }: SubscriptionPanelProps) {
    if (profile.is_premium) {
        return (
            <div className="bg-tertiary/10 border border-tertiary/20 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-3">
                    <Crown className="w-5 h-5 text-tertiary" />
                    <span className="text-tertiary font-label font-semibold">Premium Active</span>
                </div>
                <p className="text-on-surface-variant text-sm mb-4">You have access to all features</p>
                <ul className="text-on-surface-variant text-sm space-y-1 mb-4">
                    <li>&#10003; Unlimited scans</li>
                    <li>&#10003; AI Stylist chat</li>
                    <li>&#10003; Wardrobe tracker</li>
                    <li>&#10003; All product vibes</li>
                    <li>&#10003; Daily outfit suggestions</li>
                </ul>
                <button
                    onClick={onManageSubscription}
                    className="w-full py-3 rounded-xl bg-surface-container hover:bg-surface-container/80 text-on-surface text-sm font-label font-semibold transition border border-outline-variant/30"
                >
                    Manage Subscription
                </button>
            </div>
        );
    }

    if (profile.trial_ends_at && new Date(profile.trial_ends_at) > new Date()) {
        const trialEnd = new Date(profile.trial_ends_at);
        const daysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
        const trialEndDate = trialEnd.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        return (
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-5 h-5 text-yellow-400" />
                    <span className="text-yellow-400 font-label font-semibold">Trial &mdash; {daysLeft} days remaining</span>
                </div>
                <p className="text-on-surface-variant text-sm mb-2">Your trial ends on {trialEndDate}</p>
                <p className="text-on-surface-variant text-sm mb-4">After trial: 3 free scans, no AI Stylist</p>
                <Link
                    href="/pricing"
                    className="block w-full text-center py-3 rounded-xl bg-primary-container hover:bg-primary text-on-primary-container text-sm font-label font-bold transition"
                >
                    Upgrade to Premium &mdash; &#8377;149/mo
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-surface-container/50 border border-primary/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
                <CreditCard className="w-5 h-5 text-on-surface-variant" />
                <span className="text-on-surface font-label font-semibold">Free Plan</span>
            </div>
            <p className="text-on-surface-variant text-sm mb-2">{profile.free_scans_left} free scans remaining</p>
            {profile.credits > 0 && (
                <p className="text-on-surface-variant text-sm mb-2">{profile.credits} credits</p>
            )}
            <Link
                href="/pricing"
                className="block w-full text-center py-3 rounded-xl bg-primary-container hover:bg-primary text-on-primary-container text-sm font-label font-bold transition shadow-[0_0_20px_-5px_rgba(240,191,98,0.2)] mt-4"
            >
                Upgrade for unlimited access
            </Link>
        </div>
    );
}
