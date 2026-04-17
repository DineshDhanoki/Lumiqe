'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

const WELCOME_KEY = 'lumiqe-welcome-seen';

const features = [
    {
        icon: 'document_scanner',
        title: 'Vision Scan',
        description: 'Our AI analyzes your wardrobe\'s DNA to identify silhouette patterns and tonal harmonies.',
        accentClass: 'bg-primary-container/10 text-primary',
    },
    {
        icon: 'auto_awesome_motion',
        title: 'Smart Feed',
        description: 'Hyper-personalized editorial looks generated specifically for your unique measurements.',
        accentClass: 'bg-secondary-container/10 text-secondary',
    },
    {
        icon: 'forum',
        title: 'The Atelier',
        description: 'Connect with elite style architects and share your curated seasonal lookbooks.',
        accentClass: 'bg-tertiary-container/10 text-tertiary',
    },
];

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
        if (!sex) {
            setSexError('Please select an option');
            valid = false;
        } else {
            setSexError('');
        }
        if (!valid) return;

        setSaving(true);
        try {
            await apiFetch('/api/profile/quiz', {
                method: 'POST',
                body: JSON.stringify({ age: ageNum, sex }),
            }, session);
        } catch {
            console.error('Failed to save profile data');
        }
        setSaving(false);
        router.push('/analyze');
    };

    if (!mounted) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
            </div>
        );
    }

    return (
        <main className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center bg-surface">
            {/* Ambient blobs */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary-container" style={{ filter: 'blur(80px)', opacity: 0.4 }} />
                <div className="absolute bottom-[10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-secondary-container" style={{ filter: 'blur(80px)', opacity: 0.4 }} />
                <div className="absolute top-[30%] left-[20%] w-[300px] h-[300px] rounded-full bg-tertiary-container" style={{ filter: 'blur(80px)', opacity: 0.4 }} />
            </div>

            {/* Branding top-left */}
            <div className="fixed top-8 left-8 z-50">
                <h2 className="font-display text-2xl font-bold tracking-tighter text-primary">LUMIQE</h2>
            </div>

            {/* Content */}
            <div className="relative z-10 w-full max-w-6xl px-6 md:px-12 py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                {/* Step indicator (desktop) */}
                <div className="hidden lg:flex lg:col-span-1 flex-col gap-8 items-center">
                    <div className="flex flex-col gap-4">
                        <div className="w-1 h-12 bg-primary rounded-full" />
                        <div className="w-1 h-12 bg-surface-container-highest rounded-full" />
                        <div className="w-1 h-12 bg-surface-container-highest rounded-full" />
                    </div>
                    <span className="font-mono text-[10px] tracking-tighter rotate-90 whitespace-nowrap text-primary/60">PROGRESS_METRIC_01</span>
                </div>

                {/* Main card */}
                <div className="lg:col-span-11 xl:col-span-10 space-y-12">
                    {/* Header */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        <div className="flex items-center gap-4">
                            <span className="font-mono text-xs tracking-[0.2em] text-primary uppercase">Identity Verification</span>
                            <div className="h-[1px] w-12 bg-outline-variant" />
                        </div>
                        <h1 className="font-display text-6xl md:text-8xl lg:text-9xl leading-[0.9] tracking-tighter text-on-surface">
                            Welcome to <br />
                            <span className="text-primary italic">Lumiqe</span>
                        </h1>
                        <p className="text-xl md:text-2xl font-light text-on-surface-variant leading-relaxed max-w-xl">
                            A curated digital atelier where your unique aesthetic is refined by artificial intelligence and high-fashion heritage.
                        </p>
                    </motion.div>

                    {/* Feature cards */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-6"
                    >
                        {features.map((f) => (
                            <div
                                key={f.title}
                                className="glass-panel ghost-border p-8 rounded-2xl space-y-6 group hover:bg-surface-container/40 transition-all duration-500"
                            >
                                <div className={`w-12 h-12 flex items-center justify-center rounded-xl ${f.accentClass}`}>
                                    <span className="material-symbols-outlined text-3xl">{f.icon}</span>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="font-headline font-bold text-lg uppercase tracking-wider text-on-surface">{f.title}</h3>
                                    <p className="text-sm text-on-surface-variant leading-snug">{f.description}</p>
                                </div>
                            </div>
                        ))}
                    </motion.div>

                    {/* Profile setup */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="glass-panel ghost-border p-8 rounded-2xl max-w-lg"
                    >
                        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/60 mb-6">
                            Tell us about yourself
                        </p>

                        {/* Age */}
                        <div className="floating-label-group mb-8">
                            <input
                                type="number"
                                inputMode="numeric"
                                min={13}
                                max={100}
                                placeholder=" "
                                id="welcome-age"
                                value={age}
                                onChange={(e) => { setAge(e.target.value); setAgeError(''); }}
                            />
                            <label htmlFor="welcome-age" className="uppercase tracking-widest text-xs">Age</label>
                        </div>
                        {ageError && <p className="text-primary text-xs mb-4">{ageError}</p>}

                        {/* Sex */}
                        <div>
                            <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant/60 mb-3">Sex</p>
                            <div className="grid grid-cols-3 gap-3">
                                {['Male', 'Female', 'Other'].map((option) => (
                                    <button
                                        key={option}
                                        type="button"
                                        onClick={() => { setSex(option); setSexError(''); }}
                                        className={`py-3 rounded-[10px] text-xs font-headline font-semibold uppercase tracking-wider transition-all border ${
                                            sex === option
                                                ? 'bg-primary/10 border-primary/40 text-primary'
                                                : 'bg-transparent border-outline-variant/30 text-on-surface-variant hover:border-primary/30 hover:text-on-surface'
                                        }`}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                            {sexError && <p className="text-primary text-xs mt-2">{sexError}</p>}
                        </div>

                        <p className="text-on-surface-variant/40 font-label text-xs mt-4">
                            This helps our AI deliver more accurate color analysis for your skin tone.
                        </p>
                    </motion.div>

                    {/* CTA footer */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        className="flex flex-col sm:flex-row items-start sm:items-center gap-8"
                    >
                        <button
                            onClick={validateAndProceed}
                            disabled={saving}
                            className="group relative px-10 py-5 rounded-[10px] overflow-hidden transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                            style={{ background: 'linear-gradient(to right, #c4973e, #f0bf62)' }}
                        >
                            <span className="relative font-headline font-extrabold uppercase tracking-widest text-xs text-on-primary flex items-center gap-3">
                                {saving && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
                                {saving ? 'Saving...' : 'Initiate Analysis'}
                                {!saving && <span className="material-symbols-outlined text-sm">arrow_forward</span>}
                            </span>
                        </button>

                        <div className="flex items-center gap-4">
                            <div className="flex -space-x-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="w-10 h-10 rounded-full border-2 border-surface bg-surface-container-high" />
                                ))}
                            </div>
                            <span className="font-label text-xs text-on-surface-variant/40 tracking-wide uppercase">Join 12k+ Elite Curators</span>
                        </div>
                    </motion.div>

                    <div className="text-center sm:text-left">
                        <Link
                            href="/dashboard"
                            className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant/40 hover:text-on-surface-variant transition-colors"
                        >
                            Skip for now
                        </Link>
                    </div>
                </div>
            </div>

            {/* Mobile progress bar */}
            <div className="fixed bottom-0 left-0 w-full p-8 lg:hidden flex justify-center items-center gap-3 z-20">
                <div className="w-12 h-1 bg-primary rounded-full" />
                <div className="w-3 h-1 bg-white/10 rounded-full" />
                <div className="w-3 h-1 bg-white/10 rounded-full" />
            </div>

            {/* System footnote */}
            <footer className="absolute bottom-12 right-12 z-10 hidden xl:block">
                <div className="flex items-center gap-4 text-on-surface/20">
                    <div className="text-right">
                        <p className="font-mono text-[10px] uppercase tracking-widest">Protocol Version</p>
                        <p className="font-mono text-[10px] text-primary/40 tracking-widest">LX-8800.V2</p>
                    </div>
                    <div className="w-[1px] h-8 bg-outline-variant" />
                    <div className="text-right">
                        <p className="font-mono text-[10px] uppercase tracking-widest">Latency Status</p>
                        <p className="font-mono text-[10px] text-secondary/40 tracking-widest">OPTIMIZED_12MS</p>
                    </div>
                </div>
            </footer>
        </main>
    );
}
