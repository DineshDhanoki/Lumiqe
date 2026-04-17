'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { apiFetch } from '@/lib/api';
import AppLayout from '@/components/layout/AppLayout';

// Visual archetype cards — mapped to underlying personality types
const ARCHETYPES = [
    {
        id: 'minimalist',
        number: '01',
        label: 'The Minimalist',
        personality: 'minimalist' as const,
        gradient: 'linear-gradient(135deg, #1C1C1E 0%, #2A2A2C 80%, #1A1A1C 100%)',
        iconGradient: 'rgba(240,191,98,0.08)',
        icon: 'crop_square',
        iconColor: 'text-primary/40',
    },
    {
        id: 'avant-garde',
        number: '02',
        label: 'Avant-Garde',
        personality: 'edgy' as const,
        gradient: 'linear-gradient(135deg, #0A0A0E 0%, #1A0A14 70%, #0F0810 100%)',
        iconGradient: 'rgba(139,127,232,0.12)',
        icon: 'auto_awesome',
        iconColor: 'text-secondary/40',
    },
    {
        id: 'bohemian',
        number: '03',
        label: 'Neo-Bohemian',
        personality: 'boho' as const,
        gradient: 'linear-gradient(135deg, #2A1A0A 0%, #3D2315 70%, #2A1A0A 100%)',
        iconGradient: 'rgba(196,151,62,0.1)',
        icon: 'eco',
        iconColor: 'text-primary/30',
    },
    {
        id: 'street-luxe',
        number: '04',
        label: 'Street Luxe',
        personality: 'edgy' as const,
        gradient: 'linear-gradient(135deg, #0E0E12 0%, #1A1A20 60%, #111118 100%)',
        iconGradient: 'rgba(255,255,255,0.04)',
        icon: 'style',
        iconColor: 'text-on-surface/20',
    },
    {
        id: 'classic',
        number: '05',
        label: 'Classic Heritage',
        personality: 'classic' as const,
        gradient: 'linear-gradient(135deg, #0A0A18 0%, #181828 60%, #10101E 100%)',
        iconGradient: 'rgba(196,151,62,0.07)',
        icon: 'workspace_premium',
        iconColor: 'text-primary/35',
    },
    {
        id: 'nocturnal',
        number: '06',
        label: 'Nocturnal Scholar',
        personality: 'classic' as const,
        gradient: 'linear-gradient(135deg, #0A1410 0%, #0F2018 70%, #0A1810 100%)',
        iconGradient: 'rgba(100,200,120,0.07)',
        icon: 'school',
        iconColor: 'text-tertiary/30',
    },
    {
        id: 'ethereal',
        number: '07',
        label: 'Ethereal',
        personality: 'romantic' as const,
        gradient: 'linear-gradient(135deg, #1A1228 0%, #201632 70%, #1A1228 100%)',
        iconGradient: 'rgba(199,191,255,0.1)',
        icon: 'cloud',
        iconColor: 'text-secondary/40',
    },
    {
        id: 'ai-synthetic',
        number: '08',
        label: 'AI Synthetic',
        personality: 'minimalist' as const,
        gradient: 'linear-gradient(135deg, #080810 0%, #0F0F18 70%, #080812 100%)',
        iconGradient: 'rgba(139,127,232,0.1)',
        icon: 'memory',
        iconColor: 'text-secondary/35',
    },
    {
        id: 'maximalist',
        number: '09',
        label: 'Maximalist',
        personality: 'boho' as const,
        gradient: 'linear-gradient(135deg, #1A0A12 0%, #2A1020 70%, #1A0A15 100%)',
        iconGradient: 'rgba(232,127,139,0.1)',
        icon: 'diamond',
        iconColor: 'text-tertiary/40',
    },
] as const;

const MAX_SELECTIONS = 3;

const PERSONALITIES: Record<string, {
    name: string;
    emoji: string;
    tagline: string;
    description: string;
    icons: string[];
    keyPieces: string[];
    colorAdvice: string;
    avoidTrap: string;
}> = {
    classic: {
        name: 'The Classic',
        emoji: '👔',
        tagline: 'Timeless. Polished. Effortlessly elegant.',
        description: 'You invest in quality over quantity. Your style stands the test of time because you avoid trends in favour of enduring silhouettes and perfect fit. You understand that true style is never about the price tag.',
        icons: ['Audrey Hepburn', 'Grace Kelly', 'Cate Blanchett'],
        keyPieces: ['Tailored blazer', 'Crisp white shirt', 'Dark straight-leg trousers', 'Quality leather loafers', 'Simple gold jewellery'],
        colorAdvice: 'Your season\'s neutrals are your power palette. Build a capsule in navy, camel, ivory, and one bold accent from your season.',
        avoidTrap: 'Avoid playing it too safe — add one unexpected piece per outfit to keep it fresh.',
    },
    romantic: {
        name: 'The Romantic',
        emoji: '🌸',
        tagline: 'Soft. Feminine. Beautifully detailed.',
        description: 'You are drawn to softness — in fabric, silhouette, and colour. Florals, delicate jewellery, and flowing shapes speak to your aesthetic. You dress to feel beautiful, not just put-together.',
        icons: ['Florence Welch', 'Zoe Kravitz', 'Taylor Swift'],
        keyPieces: ['Silk wrap dress', 'Delicate layered necklaces', 'Feminine midi skirt', 'Strappy sandals', 'Soft cashmere'],
        colorAdvice: 'Your best colours are the softer end of your season palette — dusty rose, blush, lavender, and warm ivory.',
        avoidTrap: 'Avoid overly sweet combinations — balance feminine pieces with one structured element to avoid looking too one-note.',
    },
    edgy: {
        name: 'The Edgy',
        emoji: '⚡',
        tagline: 'Bold. Unapologetic. Ahead of the curve.',
        description: 'Your style makes a statement before you even speak. You seek out unexpected combinations, strong silhouettes, and pieces that have attitude. You are a trendsetter, not a trend follower.',
        icons: ['Rihanna', 'Billie Eilish', 'Dua Lipa'],
        keyPieces: ['Leather jacket', 'Statement boots', 'Sharp-shoulder blazer', 'Bold hardware jewellery', 'Architectural pieces'],
        colorAdvice: 'Use your season\'s deepest, most saturated tones. High contrast colour combinations amplify your statement energy.',
        avoidTrap: 'Avoid letting bold pieces compete — let one statement item lead per look.',
    },
    boho: {
        name: 'The Bohemian',
        emoji: '🌿',
        tagline: 'Free-spirited. Artisanal. Soulfully unique.',
        description: 'You gravitate toward the handcrafted, the vintage, and the beautifully imperfect. Your style tells a story — of travels, of art, of a life lived with creative curiosity. No two outfits ever look the same.',
        icons: ['Sienna Miller', 'Vanessa Hudgens', 'Nicole Richie'],
        keyPieces: ['Embroidered blouse', 'Wide-leg linen trousers', 'Layered stone necklaces', 'Suede ankle boots', 'Woven bag'],
        colorAdvice: 'Your season\'s earthy, muted tones are perfect for your aesthetic. Rust, terracotta, olive, and warm neutrals are your signature.',
        avoidTrap: 'Avoid over-layering — a few intentional pieces look more luxe than a pile of accessories.',
    },
    minimalist: {
        name: 'The Minimalist',
        emoji: '◼',
        tagline: 'Refined. Intentional. Quietly confident.',
        description: 'You believe that less is infinitely more. Every piece you own earns its place. Your power lies in the perfect cut, the finest fabric, and the confidence to let simplicity speak. You are immune to trends.',
        icons: ['Jennie Kim', 'Rosé', 'Sofia Richie'],
        keyPieces: ['The perfect white tee', 'Impeccably tailored trousers', 'Clean-cut coat', 'Simple leather bag', 'One quality watch'],
        colorAdvice: 'Build your wardrobe in your season\'s neutral base — stone, ivory, soft grey — with one or two deliberate accent colours.',
        avoidTrap: 'Avoid letting minimalism become boring — invest in extraordinary fabric and fit to let quality be the statement.',
    },
};

function calculatePersonality(selectedIds: string[]): string {
    const scores: Record<string, number> = {
        classic: 0, romantic: 0, edgy: 0, boho: 0, minimalist: 0,
    };
    selectedIds.forEach((id) => {
        const archetype = ARCHETYPES.find((a) => a.id === id);
        if (archetype) scores[archetype.personality]++;
    });
    return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
}

export default function StyleQuiz() {
    const { data: session } = useSession();
    const [selected, setSelected] = useState<string[]>([]);
    const [result, setResult] = useState<string | null>(null);

    const toggleArchetype = (id: string) => {
        setSelected((prev) => {
            if (prev.includes(id)) return prev.filter((s) => s !== id);
            if (prev.length >= MAX_SELECTIONS) return prev;
            return [...prev, id];
        });
    };

    const handleConfirm = () => {
        if (selected.length === 0) return;
        const personality = calculatePersonality(selected);
        setResult(personality);
        try {
            localStorage.setItem('lumiqe-style-personality', JSON.stringify({ personality, timestamp: Date.now() }));
        } catch { /* ignore */ }
        if (session) {
            apiFetch('/api/profile/quiz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ style_personality: personality }),
            }, session).catch(() => { /* ignore — localStorage already saved */ });
        }
    };

    const data = result ? PERSONALITIES[result] : null;

    return (
        <AppLayout>
            <div className="max-w-6xl mx-auto pb-32">
                <AnimatePresence mode="wait">
                    {!result ? (
                        <motion.div
                            key="quiz"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            {/* Progress */}
                            <div className="mb-12">
                                <div className="flex justify-between items-end mb-3">
                                    <span className="font-mono text-[10px] tracking-tighter text-primary uppercase">
                                        Analysis Stage 01: Aesthetic Foundations
                                    </span>
                                    <span className="font-mono text-[10px] tracking-tighter text-on-surface-variant/40">
                                        Step 1 of 1
                                    </span>
                                </div>
                                <div className="h-[2px] w-full bg-surface-container-high rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{
                                            width: selected.length === 0 ? '5%' : `${(selected.length / MAX_SELECTIONS) * 100}%`,
                                            background: '#c4973e',
                                            boxShadow: '0 0 10px rgba(196,151,62,0.5)',
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Editorial Header */}
                            <section className="mb-12 text-center max-w-4xl mx-auto">
                                <span className="font-label text-[9px] uppercase tracking-[0.3em] text-primary mb-4 block">Personal Curation</span>
                                <h1 className="font-display text-5xl md:text-7xl font-light mb-6 tracking-tight text-on-surface">
                                    Define your <span className="italic text-primary-container">Visual Language</span>
                                </h1>
                                <p className="text-on-surface-variant max-w-xl mx-auto leading-relaxed text-sm">
                                    Select up to <span className="text-on-surface font-medium">three archetypes</span> that resonate with your current silhouette preference. Our AI will synthesize these selections to build your signature profile.
                                </p>
                            </section>

                            {/* Bento Mood Board Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {ARCHETYPES.map((archetype, idx) => {
                                    const isSelected = selected.includes(archetype.id);
                                    const isDisabled = !isSelected && selected.length >= MAX_SELECTIONS;
                                    return (
                                        <motion.button
                                            key={archetype.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05, duration: 0.4 }}
                                            onClick={() => !isDisabled && toggleArchetype(archetype.id)}
                                            className={`relative group overflow-hidden rounded-xl h-[400px] text-left transition-all duration-500 ${
                                                isSelected
                                                    ? 'shadow-[0_0_30px_rgba(196,151,62,0.15)]'
                                                    : isDisabled
                                                    ? 'opacity-40 cursor-not-allowed'
                                                    : 'hover:-translate-y-1'
                                            }`}
                                            style={{
                                                background: archetype.gradient,
                                                border: isSelected
                                                    ? '1px solid #C4973E'
                                                    : '0.5px solid rgba(196, 151, 62, 0.2)',
                                            }}
                                        >
                                            {/* Background accent glow */}
                                            <div
                                                className="absolute inset-0 opacity-60"
                                                style={{ background: `radial-gradient(ellipse at 30% 30%, ${archetype.iconGradient}, transparent 70%)` }}
                                            />

                                            {/* Center icon */}
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span
                                                    className={`material-symbols-outlined text-[80px] transition-all duration-700 ${archetype.iconColor} ${
                                                        isSelected ? 'opacity-60' : 'opacity-30 group-hover:opacity-50'
                                                    }`}
                                                >
                                                    {archetype.icon}
                                                </span>
                                            </div>

                                            {/* Bottom gradient overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-80" />

                                            {/* Selection check badge */}
                                            {isSelected && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="absolute top-4 right-4 h-8 w-8 bg-primary rounded-full flex items-center justify-center shadow-lg z-10"
                                                >
                                                    <span
                                                        className="material-symbols-outlined text-on-primary text-base"
                                                        style={{ fontVariationSettings: "'FILL' 1" }}
                                                    >
                                                        check_circle
                                                    </span>
                                                </motion.div>
                                            )}

                                            {/* Label */}
                                            <div className="absolute bottom-0 left-0 p-6 z-10">
                                                <p className="font-mono text-[10px] text-primary mb-1 uppercase tracking-tighter">
                                                    Option {archetype.number}
                                                </p>
                                                <h3 className="font-display text-2xl text-on-surface">{archetype.label}</h3>
                                            </div>
                                        </motion.button>
                                    );
                                })}
                            </div>

                            {/* Sticky Action Bar */}
                            <div className="fixed bottom-0 left-0 w-full p-6 flex justify-center z-50 pointer-events-none">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: selected.length > 0 ? 1 : 0, y: selected.length > 0 ? 0 : 20 }}
                                    className="pointer-events-auto flex items-center gap-10 px-8 py-4 rounded-full shadow-2xl"
                                    style={{
                                        background: 'rgba(19, 19, 21, 0.8)',
                                        backdropFilter: 'blur(16px)',
                                        border: '0.5px solid rgba(196, 151, 62, 0.2)',
                                    }}
                                >
                                    {/* Selection dots */}
                                    <div className="flex flex-col">
                                        <span className="font-mono text-[9px] uppercase text-on-surface-variant/50 mb-1">Selections</span>
                                        <div className="flex gap-1.5">
                                            {[0, 1, 2].map((i) => (
                                                <div
                                                    key={i}
                                                    className="h-1 w-6 rounded-full transition-all duration-300"
                                                    style={{ background: i < selected.length ? '#c4973e' : 'rgba(255,255,255,0.1)' }}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleConfirm}
                                        disabled={selected.length === 0}
                                        className="bg-primary-container text-on-primary px-10 py-3 rounded-full font-headline font-bold uppercase tracking-widest text-[11px] transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_20px_rgba(196,151,62,0.3)]"
                                    >
                                        Continue Analysis
                                    </button>
                                </motion.div>
                            </div>
                        </motion.div>
                    ) : data ? (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6 max-w-3xl mx-auto"
                        >
                            <div className="text-center">
                                <p className="text-primary text-xs font-bold tracking-widest uppercase mb-3">Your Style Personality</p>
                                <div className="text-6xl mb-3">{data.emoji}</div>
                                <h1 className="font-display italic text-5xl text-primary mb-2">{data.name}</h1>
                                <p className="text-on-surface-variant italic mb-4">{data.tagline}</p>
                                <p className="text-on-surface-variant leading-relaxed max-w-md mx-auto">{data.description}</p>
                            </div>

                            <div className="bg-surface-container/50 rounded-3xl p-6" style={{ border: '0.5px solid rgba(196, 151, 62, 0.2)' }}>
                                <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-3">Style Icons</p>
                                <div className="flex flex-wrap gap-2">
                                    {data.icons.map((icon) => (
                                        <span key={icon} className="text-sm bg-surface-container/30 text-on-surface-variant border border-primary/15 px-3 py-1.5 rounded-full">
                                            ✦ {icon}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-surface-container/50 rounded-3xl p-6" style={{ border: '0.5px solid rgba(196, 151, 62, 0.2)' }}>
                                <p className="text-primary text-xs font-bold uppercase tracking-wider mb-3">Your Key Pieces</p>
                                <ul className="space-y-2">
                                    {data.keyPieces.map((piece) => (
                                        <li key={piece} className="flex items-center gap-2 text-sm text-on-surface-variant">
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                                            {piece}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="rounded-3xl p-6" style={{ background: 'rgba(196,151,62,0.05)', border: '0.5px solid rgba(196,151,62,0.2)' }}>
                                <p className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-2">Color Advice for Your Personality</p>
                                <p className="text-on-surface-variant leading-relaxed">{data.colorAdvice}</p>
                            </div>

                            <div className="rounded-3xl p-6" style={{ background: 'rgba(240,191,98,0.05)', border: '0.5px solid rgba(240,191,98,0.15)' }}>
                                <p className="text-primary text-xs font-bold uppercase tracking-wider mb-2">Style Trap to Avoid</p>
                                <p className="text-on-surface-variant leading-relaxed">{data.avoidTrap}</p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <Link href="/dashboard" className="flex-1 text-center py-3 rounded-[10px] bg-primary-container hover:opacity-90 text-on-primary font-headline font-bold text-xs uppercase tracking-widest transition-all">
                                    View Dashboard
                                </Link>
                                <Link href="/analyze" className="flex-1 text-center py-3 rounded-[10px] bg-surface-container/30 hover:bg-surface-container/50 text-on-surface font-headline font-bold text-xs uppercase tracking-widest transition-all" style={{ border: '0.5px solid rgba(196,151,62,0.2)' }}>
                                    Scan Your Colors
                                </Link>
                            </div>
                        </motion.div>
                    ) : null}
                </AnimatePresence>
            </div>
        </AppLayout>
    );
}
