'use client';

import { motion } from 'framer-motion';

interface SkinProfileCardProps {
    hexColor: string;
    undertone: string;
    confidence: number;
}

export default function SkinProfileCard({ hexColor, undertone, confidence }: SkinProfileCardProps) {
    const percentage = Math.round(confidence * 100);
    // Circle math for SVG strokedasharray
    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 border border-white/10 p-6 rounded-3xl flex items-center justify-between"
        >
            <div className="flex items-center gap-5">
                <div
                    className="w-16 h-16 rounded-2xl shadow-inner border-2 border-white/20"
                    style={{ backgroundColor: hexColor }}
                />
                <div className="flex flex-col">
                    <span className="text-white/50 text-xs font-semibold tracking-wider uppercase mb-1">Detected Tone</span>
                    <span className="text-2xl font-mono text-white mb-1">{hexColor.toUpperCase()}</span>
                    <span className="text-sm text-red-300 capitalize bg-red-950/30 px-2 py-0.5 rounded-full w-fit border border-red-500/20">
                        {undertone} undertone
                    </span>
                </div>
            </div>

            <div className="flex flex-col items-center gap-2">
                <span className="text-white/50 text-xs font-semibold tracking-wider uppercase">Confidence</span>
                <div className="relative flex items-center justify-center w-16 h-16">
                    <svg className="w-16 h-16 transform -rotate-90">
                        <circle
                            cx="32"
                            cy="32"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="transparent"
                            className="text-white/10"
                        />
                        <motion.circle
                            cx="32"
                            cy="32"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="transparent"
                            strokeDasharray={circumference}
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="text-green-400"
                        />
                    </svg>
                    <span className="absolute text-white font-bold text-sm">{percentage}%</span>
                </div>
            </div>
        </motion.div>
    );
}
