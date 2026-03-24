'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Camera, Palette, ShoppingBag, Sun, Sparkles, Eye } from 'lucide-react';
import Link from 'next/link';

const WELCOME_KEY = 'lumiqe-welcome-seen';

const benefits = [
    {
        icon: Camera,
        title: 'AI Skin Analysis',
        description: 'Get your exact color season in seconds',
    },
    {
        icon: Palette,
        title: 'Personal Palette',
        description: 'Know which colors make you glow',
    },
    {
        icon: ShoppingBag,
        title: 'Smart Shopping',
        description: 'Never buy the wrong shade again',
    },
];

const tips = [
    { icon: Sun, text: 'Use natural daylight' },
    { icon: Sparkles, text: 'Remove heavy makeup' },
    { icon: Eye, text: 'Face the camera directly' },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.15, delayChildren: 0.2 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0, 0, 0.2, 1] as const } },
};

export default function WelcomePage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        localStorage.setItem(WELCOME_KEY, 'true');
    }, []);

    if (!mounted) {
        return (
            <div className="min-h-screen bg-stone-950 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-stone-950 text-white relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-red-500/8 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-16">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="w-full max-w-lg"
                >
                    {/* Header */}
                    <motion.div variants={itemVariants} className="text-center mb-10">
                        <div className="inline-flex items-center gap-2 mb-6">
                            <Sparkles className="w-5 h-5 text-red-400" />
                            <span className="text-sm font-bold uppercase tracking-widest text-red-400">
                                Lumiqe
                            </span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
                            Discover Your{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600">
                                True Colors
                            </span>
                        </h1>
                        <p className="text-white/60 text-lg leading-relaxed max-w-md mx-auto">
                            In 30 seconds, our AI will analyze your skin tone and unlock your
                            perfect color palette
                        </p>
                    </motion.div>

                    {/* Benefit cards */}
                    <motion.div variants={itemVariants} className="grid gap-4 mb-8">
                        {benefits.map((benefit) => (
                            <div
                                key={benefit.title}
                                className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-red-500/30 transition-colors"
                            >
                                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-red-600/15 flex items-center justify-center">
                                    <benefit.icon className="w-6 h-6 text-red-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white text-sm">
                                        {benefit.title}
                                    </h3>
                                    <p className="text-white/50 text-sm mt-0.5">
                                        {benefit.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </motion.div>

                    {/* Tips section */}
                    <motion.div
                        variants={itemVariants}
                        className="mb-8 p-5 rounded-2xl bg-white/[0.03] border border-white/10"
                    >
                        <p className="text-xs font-bold uppercase tracking-wider text-white/40 mb-4">
                            For best results
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                            {tips.map((tip) => (
                                <div
                                    key={tip.text}
                                    className="flex flex-col items-center text-center gap-2"
                                >
                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                                        <tip.icon className="w-5 h-5 text-white/50" />
                                    </div>
                                    <p className="text-xs text-white/50 leading-snug">
                                        {tip.text}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* CTA */}
                    <motion.div variants={itemVariants} className="space-y-4">
                        <button
                            onClick={() => router.push('/analyze')}
                            className="w-full py-4 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-base transition-colors shadow-[0_0_30px_-5px_rgba(220,38,38,0.4)] hover:shadow-[0_0_40px_-5px_rgba(220,38,38,0.5)]"
                        >
                            Start My Analysis &rarr;
                        </button>
                        <div className="text-center">
                            <Link
                                href="/dashboard"
                                className="text-white/40 hover:text-white/70 text-sm transition-colors"
                            >
                                Skip for now
                            </Link>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </main>
    );
}
