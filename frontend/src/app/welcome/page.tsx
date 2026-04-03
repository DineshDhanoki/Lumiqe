'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Camera, Palette, ShoppingBag, Sun, Sparkles, Eye, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

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
    const { data: session } = useSession();
    const [mounted, setMounted] = useState(false);
    const [age, setAge] = useState('');
    const [sex, setSex] = useState('');
    const [ageError, setAgeError] = useState('');
    const [sexError, setSexError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setMounted(true);
        localStorage.setItem(WELCOME_KEY, 'true');
    }, []);

    const validateAndProceed = async () => {
        let valid = true;

        // Validate age
        const ageNum = parseInt(age, 10);
        if (!age.trim()) {
            setAgeError('Age is required');
            valid = false;
        } else if (isNaN(ageNum) || ageNum < 13 || ageNum > 100) {
            setAgeError('Enter a valid age (13–100)');
            valid = false;
        } else {
            setAgeError('');
        }

        // Validate sex
        if (!sex) {
            setSexError('Please select an option');
            valid = false;
        } else {
            setSexError('');
        }

        if (!valid) return;

        // Save to backend
        setSaving(true);
        try {
            await apiFetch('/api/profile/quiz', {
                method: 'POST',
                body: JSON.stringify({ age: ageNum, sex }),
            }, session);
        } catch {
            // Non-blocking — profile data is supplementary
            console.error('Failed to save profile data');
        }
        setSaving(false);

        router.push('/analyze');
    };

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

                    {/* Profile Setup */}
                    <motion.div
                        variants={itemVariants}
                        className="mb-8 p-5 rounded-2xl bg-white/[0.03] border border-white/10"
                    >
                        <p className="text-xs font-bold uppercase tracking-wider text-white/40 mb-5">
                            Tell us about yourself
                        </p>

                        {/* Age */}
                        <div className="mb-5">
                            <label htmlFor="age" className="block text-sm font-semibold text-white/80 mb-2">
                                Age
                            </label>
                            <input
                                id="age"
                                type="number"
                                inputMode="numeric"
                                min={13}
                                max={100}
                                placeholder="e.g. 25"
                                value={age}
                                onChange={(e) => { setAge(e.target.value); setAgeError(''); }}
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition text-sm"
                            />
                            {ageError && <p className="text-red-400 text-xs mt-1.5">{ageError}</p>}
                        </div>

                        {/* Sex */}
                        <div>
                            <label className="block text-sm font-semibold text-white/80 mb-2">
                                Sex
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {['Male', 'Female', 'Other'].map((option) => (
                                    <button
                                        key={option}
                                        type="button"
                                        onClick={() => { setSex(option); setSexError(''); }}
                                        className={`py-3 rounded-xl text-sm font-semibold transition-all border ${
                                            sex === option
                                                ? 'bg-red-600/20 border-red-500/50 text-red-300'
                                                : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                                        }`}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                            {sexError && <p className="text-red-400 text-xs mt-1.5">{sexError}</p>}
                        </div>

                        <p className="text-white/30 text-xs mt-4">
                            This helps our AI deliver more accurate color analysis for your skin tone.
                        </p>
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
                            onClick={validateAndProceed}
                            disabled={saving}
                            className="w-full py-4 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-base transition-colors shadow-[0_0_30px_-5px_rgba(220,38,38,0.4)] hover:shadow-[0_0_40px_-5px_rgba(220,38,38,0.5)] disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                            {saving ? 'Saving...' : 'Start My Analysis →'}
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
