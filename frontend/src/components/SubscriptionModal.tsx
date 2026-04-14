'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Sparkles, X } from 'lucide-react';
import Link from 'next/link';

interface SubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

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

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Subscription plans"
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md z-[101]"
                    >
                        <div className="relative bg-surface border border-primary/10 rounded-3xl p-8 overflow-hidden shadow-2xl">
                            {/* Decorative background glows */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-primary/10 blur-[50px] -z-10" />

                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 rounded-full bg-surface-container/50 hover:bg-surface-container transition-colors border border-outline-variant/30 text-on-surface-variant hover:text-on-surface"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="flex flex-col items-center text-center mt-4">
                                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(240,191,98,0.2)]">
                                    <Lock className="w-8 h-8 text-primary" />
                                </div>

                                <h2 className="text-2xl font-bold text-on-surface mb-3 tracking-tight">
                                    Unlock Premium Vibes
                                </h2>

                                <p className="text-on-surface-variant mb-8 leading-relaxed">
                                    You&apos;ve used your free premium peek! Upgrade to access the Gym, Party, and Formal curated catalogs matched to your exact color season.
                                </p>

                                <div className="w-full space-y-3">
                                    <Link
                                        href="/upgrade"
                                        onClick={onClose}
                                        aria-label="Upgrade to premium"
                                        className="group relative w-full flex items-center justify-center gap-2 rounded-full bg-primary-container hover:bg-primary text-on-primary-container font-bold py-4 px-8 shadow-[0_0_20px_-5px_rgba(240,191,98,0.3)] transition-all"
                                    >
                                        <Sparkles className="w-5 h-5" />
                                        Upgrade Now
                                    </Link>

                                    <button
                                        onClick={onClose}
                                        aria-label="Stay on free plan"
                                        className="w-full rounded-full bg-surface-container/50 hover:bg-surface-container border border-outline-variant/30 text-on-surface py-4 px-8 transition-colors font-medium"
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
