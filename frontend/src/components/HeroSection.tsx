'use client';

import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, PlayCircle } from 'lucide-react';
import { AuroraBackground } from '@/components/ui/aurora-background';

interface HeroSectionProps {
    onOpenAuth: () => void;
}

export default function HeroSection({ onOpenAuth }: HeroSectionProps) {
    return (
        <AuroraBackground className="p-6 text-center relative overflow-hidden">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="flex flex-col items-center gap-6 max-w-4xl w-full z-10"
            >

                <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white drop-shadow-2xl">
                    Discover Your <br className="hidden md:block" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-300 to-white">
                        True Colors
                    </span>
                </h1>

                <p className="max-w-2xl text-lg md:text-xl text-white/70 leading-relaxed drop-shadow-md">
                    Stop guessing. Let Lumiqe's AI analyze your skin tone and find the exact colors, metals, and makeup that make you shine.
                </p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="flex flex-col sm:flex-row items-center gap-4 mt-8 w-full sm:w-auto"
                >
                    <button
                        onClick={onOpenAuth}
                        className="group relative flex items-center justify-center gap-2 w-full sm:w-auto rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-lg py-4 px-8 shadow-[0_0_40px_-10px_rgba(220,38,38,0.5)] hover:shadow-[0_0_60px_-15px_rgba(220,38,38,0.7)] transition-all transform hover:scale-[1.02]"
                    >
                        Start Free Trial
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <a
                        href="#demo"
                        className="flex items-center justify-center gap-2 w-full sm:w-auto rounded-full bg-white/10 hover:bg-white/20 text-white font-medium text-lg py-4 px-8 border border-white/10 hover:border-white/30 backdrop-blur-md transition-all"
                    >
                        <PlayCircle className="w-5 h-5 opacity-70" />
                        See Live Demo
                    </a>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mt-4 text-white/40 text-sm"
                >
                    No credit card required • 100% Private
                </motion.p>
            </motion.div>
        </AuroraBackground>
    );
}
