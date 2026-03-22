'use client';

import { motion } from 'framer-motion';
import { Palette, Sparkles, Contrast, Zap } from 'lucide-react';

interface SignatureColor {
    hex: string;
    name: string;
}

interface ColorHarmonies {
    monochromatic: string;
    complementary: string;
    analogous: string;
    neutral_base: string;
}

interface Patterns {
    best: string[];
    scale: string;
    avoid: string[];
}

interface ColorProfileDeepProps {
    season: string;
    styleArchetype: string;
    signatureColor: SignatureColor;
    value: string;
    chroma: string;
    contrastLevel: string;
    undertone: string;
    foundationUndertone: string;
    jewelryGuide: string;
    colorHarmonies: ColorHarmonies;
    patterns: Patterns;
}

export default function ColorProfileDeep({
    season: _season, // eslint-disable-line @typescript-eslint/no-unused-vars
    styleArchetype,
    signatureColor,
    value,
    chroma,
    contrastLevel,
    undertone,
    foundationUndertone,
    jewelryGuide,
    colorHarmonies,
    patterns,
}: ColorProfileDeepProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-white mb-2">Your Color Profile</h2>
                <p className="text-white/50">A professional breakdown of your personal coloring</p>
            </div>

            {/* Top 2 cards: Archetype + Signature Color */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Style Archetype */}
                <div className="bg-zinc-900/60 border border-white/10 rounded-3xl p-6">
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-5 h-5 text-red-400" />
                        <p className="text-white/50 text-xs font-bold uppercase tracking-widest">Style Archetype</p>
                    </div>
                    <p className="text-3xl font-bold text-white">{styleArchetype}</p>
                    <p className="text-white/40 text-sm mt-2">The essence of your natural coloring</p>
                </div>

                {/* Signature Color */}
                <div className="bg-zinc-900/60 border border-white/10 rounded-3xl p-6 flex items-center gap-5">
                    <div
                        className="w-20 h-20 rounded-2xl flex-shrink-0 border border-white/20 shadow-2xl"
                        style={{ backgroundColor: signatureColor.hex }}
                    />
                    <div>
                        <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-1">Signature Color</p>
                        <p className="text-2xl font-bold text-white">{signatureColor.name}</p>
                        <p className="text-white/40 text-sm font-mono mt-1">{signatureColor.hex}</p>
                        <p className="text-white/40 text-xs mt-1">Your single most flattering tone</p>
                    </div>
                </div>
            </div>

            {/* Color Characteristics */}
            <div className="bg-zinc-900/60 border border-white/10 rounded-3xl p-6">
                <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-4">Color Characteristics</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Value', value: value, icon: <Contrast className="w-4 h-4" /> },
                        { label: 'Chroma', value: chroma, icon: <Zap className="w-4 h-4" /> },
                        { label: 'Contrast', value: contrastLevel, icon: <Palette className="w-4 h-4" /> },
                        { label: 'Undertone', value: undertone.charAt(0).toUpperCase() + undertone.slice(1), icon: <Sparkles className="w-4 h-4" /> },
                    ].map((item, i) => (
                        <div key={i} className="bg-white/5 rounded-2xl p-4 text-center">
                            <div className="flex justify-center mb-2 text-red-400">{item.icon}</div>
                            <p className="text-white/40 text-xs uppercase tracking-wider mb-1">{item.label}</p>
                            <p className="text-white font-bold text-lg">{item.value}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Color Harmonies */}
            <div className="bg-zinc-900/60 border border-white/10 rounded-3xl p-6">
                <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-4">How to Combine Your Colors</p>
                <div className="space-y-4">
                    {[
                        { label: 'Monochromatic', desc: colorHarmonies.monochromatic, color: '#8B5E3C' },
                        { label: 'Complementary', desc: colorHarmonies.complementary, color: '#4169E1' },
                        { label: 'Analogous', desc: colorHarmonies.analogous, color: '#228B22' },
                    ].map((harmony, i) => (
                        <div key={i} className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl">
                            <div
                                className="w-3 h-12 rounded-full flex-shrink-0 mt-0.5"
                                style={{ backgroundColor: harmony.color }}
                            />
                            <div>
                                <p className="text-white font-semibold text-sm">{harmony.label}</p>
                                <p className="text-white/60 text-sm mt-0.5 leading-relaxed">{harmony.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Patterns */}
            <div className="bg-zinc-900/60 border border-white/10 rounded-3xl p-6">
                <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-4">Pattern Guide</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p className="text-green-400 text-xs font-bold uppercase tracking-wider mb-2">Best Patterns</p>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {patterns.best?.map((p, i) => (
                                <span key={i} className="text-xs bg-green-500/20 text-green-300 border border-green-500/30 px-3 py-1 rounded-full">
                                    {p}
                                </span>
                            ))}
                        </div>
                        <p className="text-white/40 text-xs">Scale: <span className="text-white/70">{patterns.scale}</span></p>
                    </div>
                    <div>
                        <p className="text-red-400 text-xs font-bold uppercase tracking-wider mb-2">Avoid</p>
                        <div className="flex flex-wrap gap-2">
                            {patterns.avoid?.map((p, i) => (
                                <span key={i} className="text-xs bg-red-500/20 text-red-300 border border-red-500/30 px-3 py-1 rounded-full">
                                    {p}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Foundation + Jewelry */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-zinc-900/60 border border-white/10 rounded-3xl p-6">
                    <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-2">Foundation Undertone</p>
                    <p className="text-white text-base leading-relaxed">{foundationUndertone}</p>
                </div>
                <div className="bg-zinc-900/60 border border-white/10 rounded-3xl p-6">
                    <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-2">Jewelry Guide</p>
                    <p className="text-white text-base leading-relaxed">{jewelryGuide}</p>
                </div>
            </div>
        </motion.div>
    );
}
