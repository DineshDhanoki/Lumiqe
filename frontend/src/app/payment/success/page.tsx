'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle, Sparkles, ArrowRight, Crown } from 'lucide-react';

function SuccessContent() {
    const searchParams = useSearchParams();
    const _sessionId = searchParams.get('session_id');
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
                    <CheckCircle className="w-10 h-10 text-green-400" />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <Crown className="w-5 h-5 text-yellow-400" />
                        <span className="text-sm font-bold text-yellow-400 uppercase tracking-widest">
                            Premium Activated
                        </span>
                    </div>

                    <h1 className="text-4xl font-extrabold text-white mb-4">
                        Welcome to Premium!
                    </h1>

                    <p className="text-white/60 text-lg mb-8">
                        Your subscription is active. Unlimited scans, AI Stylist, and all premium features are now unlocked.
                    </p>

                    <Link
                        href="/analyze"
                        className="group inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold px-8 py-4 rounded-full shadow-[0_0_30px_-5px_rgba(220,38,38,0.5)] transition-all"
                    >
                        <Sparkles className="w-5 h-5" />
                        Start Analyzing
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>

                    <p className="text-white/30 text-sm mt-6">
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
                    <Sparkles className="w-8 h-8 text-red-500 animate-pulse" />
                </div>
            }
        >
            <SuccessContent />
        </Suspense>
    );
}
