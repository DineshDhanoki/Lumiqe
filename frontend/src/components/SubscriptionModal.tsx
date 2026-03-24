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
                        className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[100]"
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
                        <div className="relative bg-[#1A1A1A] border border-white/10 rounded-3xl p-8 overflow-hidden shadow-2xl">
                            {/* Decorative background glows */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-red-500/20 blur-[50px] -z-10" />

                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10 text-white/70 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="flex flex-col items-center text-center mt-4">
                                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
                                    <Lock className="w-8 h-8 text-red-500" />
                                </div>

                                <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">
                                    Unlock Premium Vibes
                                </h2>

                                <p className="text-white/60 mb-8 leading-relaxed">
                                    You&apos;ve used your free premium peek! Upgrade to access the Gym, Party, and Formal curated catalogs matched to your exact color season.
                                </p>

                                <div className="w-full space-y-3">
                                    <Link
                                        href="/upgrade"
                                        onClick={onClose}
                                        aria-label="Upgrade to premium"
                                        className="group relative w-full flex items-center justify-center gap-2 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 px-8 shadow-[0_0_20px_-5px_rgba(220,38,38,0.5)] transition-all"
                                    >
                                        <Sparkles className="w-5 h-5" />
                                        Upgrade Now
                                    </Link>

                                    <button
                                        onClick={onClose}
                                        aria-label="Stay on free plan"
                                        className="w-full rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white py-4 px-8 transition-colors font-medium"
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
