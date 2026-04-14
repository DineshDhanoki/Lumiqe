'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Cpu, Sparkles, X } from 'lucide-react';

const GUIDE_KEY = 'lumiqe-scan-guide-seen';

const steps = [
    {
        icon: Camera,
        title: 'Take a selfie or upload a photo',
        description: 'Use your camera or choose an existing photo from your device.',
    },
    {
        icon: Cpu,
        title: 'Our AI analyzes your skin tone in seconds',
        description: 'Advanced color analysis determines your unique undertone and season.',
    },
    {
        icon: Sparkles,
        title: 'Get your season, palette, and personalized recommendations',
        description: 'Discover the colors that make you look your best.',
    },
];

export default function ScanGuide() {
    const [visible, setVisible] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const seen = localStorage.getItem(GUIDE_KEY);
        if (!seen) {
            setVisible(true);
        }
    }, []);

    const dismiss = () => {
        setVisible(false);
        localStorage.setItem(GUIDE_KEY, 'true');
    };

    if (!mounted || !visible) {
        return null;
    }

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                >
                <div className="w-full max-w-md">
                    <div className="relative rounded-2xl border border-primary/10 bg-surface p-5">
                        {/* Close button */}
                        <button
                            onClick={dismiss}
                            aria-label="Dismiss guide"
                            className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        {/* Header */}
                        <div className="flex items-center justify-between mb-5 pr-8">
                            <h3 className="text-sm font-bold text-on-surface">How it works</h3>
                            <span className="text-xs text-on-surface-variant/50 font-medium">
                                Step 1 of 3
                            </span>
                        </div>

                        {/* Steps */}
                        <div className="space-y-4">
                            {steps.map((step, index) => (
                                <div key={step.title} className="flex items-start gap-3">
                                    {/* Numbered circle */}
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                                        <span className="text-xs font-bold text-primary">
                                            {index + 1}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <step.icon className="w-3.5 h-3.5 text-on-surface-variant flex-shrink-0" />
                                            <p className="text-sm font-medium text-on-surface leading-snug">
                                                {step.title}
                                            </p>
                                        </div>
                                        <p className="text-xs text-on-surface-variant leading-relaxed">
                                            {step.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Dismiss link */}
                        <button
                            onClick={dismiss}
                            className="mt-4 w-full text-center text-xs text-on-surface-variant/50 hover:text-on-surface-variant transition-colors"
                        >
                            Got it, let&apos;s go
                        </button>
                    </div>
                </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
