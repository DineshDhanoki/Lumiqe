'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';


export default function DiscoveryQuizzes() {
    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-4">Analysis &amp; Discovery</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link href="/quiz/body-shape"
                    className="flex items-center gap-4 bg-surface-container/50 border border-primary/10 rounded-2xl p-5 hover:border-primary/20 transition-all group">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center flex-shrink-0 text-2xl">⌛</div>
                    <div className="flex-1">
                        <p className="text-on-surface font-semibold text-sm">Body Shape Analysis</p>
                        <p className="text-on-surface-variant text-xs mt-0.5">6 questions · Find your silhouette</p>
                    </div>
                    <span className="material-symbols-outlined text-lg text-on-surface-variant/30 group-hover:text-on-surface-variant transition-colors">chevron_right</span>
                </Link>

                <Link href="/quiz/style"
                    className="flex items-center gap-4 bg-surface-container/50 border border-primary/10 rounded-2xl p-5 hover:border-primary/20 transition-all group">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/20 flex items-center justify-center flex-shrink-0 text-2xl">✨</div>
                    <div className="flex-1">
                        <p className="text-on-surface font-semibold text-sm">Style Personality Quiz</p>
                        <p className="text-on-surface-variant text-xs mt-0.5">10 questions · Discover your aesthetic</p>
                    </div>
                    <span className="material-symbols-outlined text-lg text-on-surface-variant/30 group-hover:text-on-surface-variant transition-colors">chevron_right</span>
                </Link>
            </div>
        </motion.div>
    );
}
