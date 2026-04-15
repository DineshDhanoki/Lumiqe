'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

    // ── Expired trial — modal ────────────────────────────────
    if (expired) {
        return (
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
                >
                    <motion.div
                        initial={{ scale: 0.92, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative bg-surface border border-primary/15 rounded-3xl p-8 max-w-md w-full text-center overflow-hidden shadow-2xl"
                    >
                        {/* Top accent line */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
                        {/* Glow */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-primary/8 blur-[60px] -z-10" />

                        <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(240,191,98,0.15)]">
                            <span className="material-symbols-outlined text-3xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                                workspace_premium
                            </span>
                        </div>

                        <span className="font-label text-[10px] tracking-[0.3em] uppercase text-on-surface-variant/60 block mb-2">
                            Trial Ended
                        </span>
                        <h3 className="font-display italic text-3xl text-on-surface mb-3">
                            Your Trial Has Ended
                        </h3>
                        <p className="text-on-surface-variant text-sm leading-relaxed mb-8">
                            Upgrade to Premium to continue with unlimited scans, AI styling,
                            and all premium features.
                        </p>

                        <Link
                            href="/pricing"
                            className="block w-full py-3.5 rounded-full bg-gradient-to-r from-primary-container to-primary text-on-primary font-label font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-opacity mb-3 shadow-[0_0_20px_-5px_rgba(240,191,98,0.3)]"
                        >
                            View Plans
                        </Link>
                        <button
                            onClick={() => setDismissed(true)}
                            className="text-on-surface-variant text-xs hover:text-on-surface transition-colors font-label uppercase tracking-widest"
                        >
                            Maybe later
                        </button>
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        );
    }

    // ── Active trial — top banner ────────────────────────────
    return (
        <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-gradient-to-r from-primary/10 via-primary/8 to-primary-container/15 border-b border-primary/15"
        >
            <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-primary text-base">schedule</span>
                    <span className="text-sm text-on-surface-variant">
                        <span className="font-label font-bold text-primary">Premium Trial</span>
                        {timeLeft && (
                            <> &mdash; <span className="font-mono text-xs">{timeLeft}</span></>
                        )}
                    </span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                    <Link
                        href="/pricing"
                        className="text-[10px] font-label font-bold uppercase tracking-widest bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-4 py-1.5 rounded-full transition-colors"
                    >
                        Upgrade Now
                    </Link>
                    <button
                        onClick={() => setDismissed(true)}
                        aria-label="Dismiss banner"
                        className="text-on-surface-variant/40 hover:text-on-surface-variant transition-colors"
                    >
                        <span className="material-symbols-outlined text-base">close</span>
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
