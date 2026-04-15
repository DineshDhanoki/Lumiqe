'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

function SuccessContent() {
    const searchParams = useSearchParams();
    void searchParams.get('session_id'); // reserved for Stripe session validation
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    window.location.href = '/analyze';
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    return (
        <main className="min-h-screen flex items-center justify-center px-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="max-w-md w-full text-center"
            >
                {/* Success Animation */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="w-20 h-20 mx-auto mb-8 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center"
                >
                    <span className="material-symbols-outlined text-5xl text-green-400" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-xl text-yellow-400" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                        <span className="text-sm font-bold text-yellow-400 uppercase tracking-widest">
                            Premium Activated
                        </span>
                    </div>

                    <h1 className="text-4xl font-extrabold text-on-surface mb-4">
                        Welcome to Premium!
                    </h1>

                    <p className="text-on-surface-variant text-lg mb-8">
                        Your subscription is active. Unlimited scans, AI Stylist, and all premium features are now unlocked.
                    </p>

                    <Link
                        href="/analyze"
                        className="group inline-flex items-center gap-2 bg-primary-container hover:bg-primary text-on-primary-container font-bold px-8 py-4 rounded-full shadow-[0_0_30px_-5px_rgba(220,38,38,0.5)] transition-all"
                    >
                        <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                        Start Analyzing
                        <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </Link>

                    <p className="text-on-surface-variant/50 text-sm mt-6">
                        Redirecting in {countdown}s...
                    </p>
                </motion.div>
            </motion.div>
        </main>
    );
}

export default function PaymentSuccess() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl text-primary animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                </div>
            }
        >
            <SuccessContent />
        </Suspense>
    );
}
