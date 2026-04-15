'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface SubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PREMIUM_PERKS = [
    'Unlimited AI colour scans',
    'AI Stylist chat, available 24/7',
    'All product vibes & curated feeds',
    'Daily outfit suggestions',
];

export default function SubscriptionModal({ isOpen, onClose }: SubscriptionModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-background/80 backdrop-blur-xl z-[100]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.94, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.94, y: 16 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Subscription plans"
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md z-[101]"
                    >
                        <div className="relative bg-surface border border-primary/15 rounded-3xl p-8 overflow-hidden shadow-2xl">
                            {/* Top accent line */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
                            {/* Gold glow */}
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-full h-32 bg-primary/8 blur-[60px] pointer-events-none" />

                            {/* Close */}
                            <button
                                onClick={onClose}
                                aria-label="Close modal"
                                className="absolute top-4 right-4 p-2 rounded-full bg-surface-container/50 hover:bg-surface-container border border-outline-variant/20 text-on-surface-variant hover:text-on-surface transition-colors"
                            >
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>

                            <div className="flex flex-col items-center text-center mt-2">
                                {/* Icon */}
                                <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-5 shadow-[0_0_30px_rgba(240,191,98,0.15)]">
                                    <span className="material-symbols-outlined text-3xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                                        lock
                                    </span>
                                </div>

                                <span className="font-label text-[10px] tracking-[0.3em] uppercase text-on-surface-variant/60 block mb-2">
                                    Premium Feature
                                </span>
                                <h2 className="font-display italic text-3xl text-on-surface mb-3">
                                    Unlock Premium Vibes
                                </h2>
                                <p className="text-on-surface-variant text-sm leading-relaxed mb-6 max-w-xs">
                                    You&apos;ve used your free preview. Upgrade for the full curated catalogue matched to your exact colour season.
                                </p>

                                {/* Perks list */}
                                <div className="w-full text-left space-y-2 mb-7">
                                    {PREMIUM_PERKS.map((perk) => (
                                        <div key={perk} className="flex items-center gap-2.5 text-sm text-on-surface-variant">
                                            <span className="material-symbols-outlined text-primary text-base flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                                                check_circle
                                            </span>
                                            {perk}
                                        </div>
                                    ))}
                                </div>

                                {/* CTAs */}
                                <div className="w-full space-y-3">
                                    <Link
                                        href="/upgrade"
                                        onClick={onClose}
                                        aria-label="Upgrade to premium"
                                        className="flex items-center justify-center gap-2 w-full py-4 rounded-full bg-gradient-to-r from-primary-container to-primary text-on-primary font-label font-bold text-xs uppercase tracking-widest hover:opacity-90 active:scale-[0.98] transition-all shadow-[0_0_20px_-5px_rgba(240,191,98,0.3)]"
                                    >
                                        <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                                        Upgrade Now
                                    </Link>
                                    <button
                                        onClick={onClose}
                                        aria-label="Stay on free plan"
                                        className="w-full py-4 rounded-full border border-outline-variant/20 text-on-surface-variant hover:text-on-surface hover:border-outline-variant/40 text-xs font-label uppercase tracking-widest transition-colors"
                                    >
                                        Back to Casual
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
