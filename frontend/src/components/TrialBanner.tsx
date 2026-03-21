'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Crown, X } from 'lucide-react';
import Link from 'next/link';

interface TrialBannerProps {
    trialEndsAt: string | null;
    isPremium: boolean;
}

export default function TrialBanner({ trialEndsAt, isPremium }: TrialBannerProps) {
    const [timeLeft, setTimeLeft] = useState('');
    const [dismissed, setDismissed] = useState(false);
    const [expired, setExpired] = useState(false);

    useEffect(() => {
        if (!trialEndsAt || isPremium) return;

        const update = () => {
            const end = new Date(trialEndsAt).getTime();
            const now = Date.now();
            const diff = end - now;

            if (diff <= 0) {
                setExpired(true);
                setTimeLeft('');
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            if (days > 0) {
                setTimeLeft(`${days}d ${hours}h remaining`);
            } else if (hours > 0) {
                setTimeLeft(`${hours}h ${minutes}m remaining`);
            } else {
                setTimeLeft(`${minutes}m remaining`);
            }
        };

        update();
        const interval = setInterval(update, 60000);
        return () => clearInterval(interval);
    }, [trialEndsAt, isPremium]);

    if (isPremium || dismissed || !trialEndsAt) return null;

    // Expired trial — show upgrade modal
    if (expired) {
        return (
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-zinc-900 border border-red-500/30 rounded-2xl p-8 max-w-md w-full text-center"
                    >
                        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
                            <Crown className="w-8 h-8 text-red-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">
                            Your Trial Has Ended
                        </h3>
                        <p className="text-white/60 mb-6">
                            Upgrade to Premium to continue using unlimited scans, AI styling tips,
                            and all premium features.
                        </p>
                        <Link
                            href="/pricing"
                            className="block w-full py-3 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold transition-colors mb-3"
                        >
                            View Plans
                        </Link>
                        <button
                            onClick={() => setDismissed(true)}
                            className="text-white/40 text-sm hover:text-white/60 transition-colors"
                        >
                            Maybe later
                        </button>
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        );
    }

    // Active trial — show countdown banner
    return (
        <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-gradient-to-r from-red-900/80 to-red-800/60 border-b border-red-500/30"
        >
            <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-red-300" />
                    <span className="text-sm text-white/90">
                        <span className="font-semibold text-red-300">Premium Trial</span>
                        {' '}&mdash; {timeLeft}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/pricing"
                        className="text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-4 py-1.5 rounded-full transition-colors"
                    >
                        Upgrade Now
                    </Link>
                    <button
                        onClick={() => setDismissed(true)}
                        className="text-white/30 hover:text-white/60 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
