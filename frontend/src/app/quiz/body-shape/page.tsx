'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { apiFetch } from '@/lib/api';
import AppLayout from '@/components/layout/AppLayout';

const QUESTIONS = [
    {
        id: 'shoulders',
        question: 'How would you describe your shoulders?',
        options: [
            { label: 'Broad — wider than my hips', value: 'broad' },
            { label: 'Narrow — slimmer than my hips', value: 'narrow' },
            { label: 'About the same as my hips', value: 'equal' },
            { label: 'Slightly wider than my hips', value: 'slightly_broad' },
        ],
    },
    {
        id: 'waist',
        question: 'How defined is your waist compared to your hips and shoulders?',
        options: [
            { label: 'Very defined — clearly smaller', value: 'very_defined' },
            { label: 'Somewhat defined', value: 'somewhat_defined' },
            { label: 'Not very defined — similar width', value: 'undefined' },
            { label: 'Fuller at the waist', value: 'full' },
        ],
    },
    {
        id: 'hips',
        question: 'How would you describe your hips?',
        options: [
            { label: 'Wider than my shoulders', value: 'wide' },
            { label: 'Narrower than my shoulders', value: 'narrow' },
            { label: 'About the same as my shoulders', value: 'equal' },
            { label: 'Full and rounded', value: 'full' },
        ],
    },
    {
        id: 'bust',
        question: 'How would you describe your bust relative to your hips?',
        options: [
            { label: 'Fuller bust than hips', value: 'fuller' },
            { label: 'Smaller bust than hips', value: 'smaller' },
            { label: 'About the same', value: 'equal' },
            { label: 'Proportionate with a defined waist', value: 'balanced' },
        ],
    },
    {
        id: 'weight',
        question: 'When you gain weight, where do you tend to carry it first?',
        options: [
            { label: 'Hips, thighs, and bottom', value: 'lower' },
            { label: 'Stomach and middle', value: 'middle' },
            { label: 'Fairly evenly all over', value: 'even' },
            { label: 'Upper body and bust', value: 'upper' },
        ],
    },
    {
        id: 'legs',
        question: 'How would you describe your legs?',
        options: [
            { label: 'Long and slim', value: 'long_slim' },
            { label: 'Curvier with fuller thighs', value: 'curvy' },
            { label: 'Proportionate and balanced', value: 'balanced' },
            { label: 'Athletic and toned', value: 'athletic' },
        ],
    },
];

const SHAPES: Record<string, {
    shape: string;
    emoji: string;
    description: string;
    bestStyles: string[];
    avoidStyles: string[];
    colors: string;
}> = {
    hourglass: {
        shape: 'Hourglass',
        emoji: '⌛',
        description: 'Your shoulders and hips are balanced with a clearly defined waist. This is considered the most universally flattering shape as it naturally creates symmetry.',
        bestStyles: ['Wrap dresses', 'Fitted blazers', 'High-waisted trousers', 'Bodycon styles', 'Belt-cinched silhouettes'],
        avoidStyles: ['Boxy oversized tops', 'Drop-waist styles', 'Shapeless sacks'],
        colors: 'Your balanced proportions suit bold colors, patterns, and color-blocking equally well.',
    },
    pear: {
        shape: 'Pear',
        emoji: '🍐',
        description: 'Your hips are wider than your shoulders with a defined waist. Your lower half is fuller and your upper body is slimmer.',
        bestStyles: ['A-line skirts', 'Wide-leg trousers', 'Statement tops', 'Off-shoulder styles', 'Structured jackets'],
        avoidStyles: ['Tight pencil skirts', 'Clingy trousers', 'Busy patterns on hips'],
        colors: 'Draw the eye upward with bold, bright colors on top. Keep darker neutrals for the lower half.',
    },
    apple: {
        shape: 'Apple',
        emoji: '🍎',
        description: 'You carry weight around your middle with slimmer hips and legs. Your bust and shoulders may be fuller.',
        bestStyles: ['Empire waist tops', 'V-necks', 'Flowy tunics', 'Wrap styles', 'Straight-leg trousers'],
        avoidStyles: ['Tight waistbands', 'Cropped tops', 'Heavy fabric around the middle'],
        colors: 'Vertical color panels create a lengthening effect. Monochromatic looks from your season are especially powerful.',
    },
    rectangle: {
        shape: 'Rectangle',
        emoji: '▭',
        description: 'Your shoulders, waist, and hips are all similar in width creating a straight, athletic silhouette with minimal curves.',
        bestStyles: ['Peplum tops', 'Ruffled layers', 'Belted dresses', 'Textured fabrics', 'Flared skirts'],
        avoidStyles: ['Very straight-cut column dresses', 'Shapeless oversized pieces'],
        colors: 'Use contrasting colors to create curves — a lighter top with a darker bottom, or vice versa.',
    },
    inverted_triangle: {
        shape: 'Inverted Triangle',
        emoji: '▽',
        description: 'Your shoulders are broader than your hips with a strong upper body. You may have an athletic or powerful frame.',
        bestStyles: ['A-line and full skirts', 'Wide-leg trousers', 'V-necks', 'Scoop necks', 'Flared bottoms'],
        avoidStyles: ['Shoulder pads', 'Boat necks', 'Halter tops', 'Heavy embellishment on shoulders'],
        colors: 'Use bold, bright colors and patterns on your lower half to balance proportions. Keep the top in softer tones.',
    },
};

function calculateShape(answers: Record<string, string>): string {
    const scores: Record<string, number> = {
        hourglass: 0, pear: 0, apple: 0, rectangle: 0, inverted_triangle: 0,
    };

    if (answers.shoulders === 'equal' && answers.waist === 'very_defined') scores.hourglass += 3;
    if (answers.shoulders === 'slightly_broad' && answers.waist === 'very_defined') scores.hourglass += 2;
    if (answers.bust === 'balanced') scores.hourglass += 2;

    if (answers.hips === 'wide' || answers.hips === 'full') scores.pear += 3;
    if (answers.shoulders === 'narrow') scores.pear += 2;
    if (answers.weight === 'lower') scores.pear += 2;

    if (answers.waist === 'full' || answers.waist === 'undefined') scores.apple += 2;
    if (answers.weight === 'middle') scores.apple += 3;

    if (answers.shoulders === 'equal' && answers.hips === 'equal') scores.rectangle += 3;
    if (answers.waist === 'undefined' && answers.weight === 'even') scores.rectangle += 2;

    if (answers.shoulders === 'broad') scores.inverted_triangle += 3;
    if (answers.hips === 'narrow') scores.inverted_triangle += 2;
    if (answers.weight === 'upper') scores.inverted_triangle += 2;
    if (answers.bust === 'fuller') scores.inverted_triangle += 1;

    return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
}

const STAGE_LABELS = [
    'Stage 01 — Foundation',
    'Stage 02 — Geometry',
    'Stage 03 — Proportion',
    'Stage 04 — Structure',
    'Stage 05 — Distribution',
    'Stage 06 — Silhouette',
];

export default function BodyShapeQuiz() {
    const { data: session } = useSession();
    const [current, setCurrent] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [result, setResult] = useState<string | null>(null);

    const question = QUESTIONS[current];
    const progress = ((current) / QUESTIONS.length) * 100;

    const handleAnswer = (value: string) => {
        const newAnswers = { ...answers, [question.id]: value };
        setAnswers(newAnswers);
        if (current + 1 < QUESTIONS.length) {
            setCurrent(current + 1);
        } else {
            const shape = calculateShape(newAnswers);
            setResult(shape);
            try {
                // eslint-disable-next-line react-hooks/purity
                localStorage.setItem('lumiqe-body-shape', JSON.stringify({ shape, timestamp: Date.now() }));
            } catch { /* ignore */ }
            if (session) {
                apiFetch('/api/profile/quiz', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ body_shape: shape }),
                }, session).catch(() => { /* ignore — localStorage already saved */ });
            }
        }
    };

    const shapeData = result ? SHAPES[result] : null;

    return (
        <AppLayout>
            <div className="max-w-3xl mx-auto">
                <AnimatePresence mode="wait">
                    {!result ? (
                        <motion.div
                            key={current}
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -40 }}
                            transition={{ duration: 0.2 }}
                        >
                            {/* Progress */}
                            <div className="mb-16">
                                <div className="flex justify-between items-end mb-3">
                                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                                        {STAGE_LABELS[current] || `Stage ${current + 1}`}
                                    </span>
                                    <span className="font-mono text-[10px] text-on-surface-variant/40 tracking-widest">
                                        {Math.round(progress)}% Complete
                                    </span>
                                </div>
                                <div className="h-[2px] w-full bg-surface-container-high rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-primary-container rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        transition={{ duration: 0.4 }}
                                        style={{ boxShadow: '0 0 10px rgba(196,151,62,0.4)' }}
                                    />
                                </div>
                            </div>

                            {/* Heading */}
                            <div className="text-center mb-12">
                                <span className="font-label text-[9px] uppercase tracking-[0.3em] text-primary mb-4 block">
                                    Body Shape Analysis
                                </span>
                                <h1 className="font-display text-5xl md:text-6xl text-on-surface mb-6 leading-tight">
                                    Define your <span className="italic text-primary">silhouette.</span>
                                </h1>
                                <p className="text-on-surface-variant text-sm max-w-xl mx-auto leading-relaxed">
                                    {question.question}
                                </p>
                            </div>

                            {/* Options */}
                            <div className="space-y-3">
                                {question.options.map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => handleAnswer(opt.value)}
                                        className="w-full text-left px-6 py-5 rounded-[10px] bg-surface-container/30 hover:bg-surface-container/60 hover:border-primary/30 text-on-surface-variant hover:text-on-surface transition-all font-headline font-medium text-sm"
                                        style={{ border: '0.5px solid rgba(196, 151, 62, 0.2)' }}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>

                            {current > 0 && (
                                <button
                                    onClick={() => setCurrent(current - 1)}
                                    className="mt-8 text-on-surface-variant hover:text-on-surface text-sm flex items-center gap-1 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-sm">arrow_back</span> Previous question
                                </button>
                            )}
                        </motion.div>
                    ) : shapeData ? (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            {/* Result header */}
                            <div className="text-center">
                                <p className="text-primary text-xs font-bold tracking-widest uppercase mb-3">Your Body Shape</p>
                                <div className="text-6xl mb-3">{shapeData.emoji}</div>
                                <h1 className="font-display italic text-5xl text-primary mb-4">
                                    {shapeData.shape}
                                </h1>
                                <p className="text-on-surface-variant leading-relaxed max-w-md mx-auto">{shapeData.description}</p>
                            </div>

                            {/* Best styles */}
                            <div className="bg-surface-container/50 rounded-3xl p-6" style={{ border: '0.5px solid rgba(196, 151, 62, 0.2)' }}>
                                <p className="text-primary text-xs font-bold uppercase tracking-wider mb-3">Best Styles For You</p>
                                <div className="flex flex-wrap gap-2">
                                    {shapeData.bestStyles.map((s) => (
                                        <span key={s} className="flex items-center gap-1.5 text-sm bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-full">
                                            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                            {s}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Avoid */}
                            <div className="bg-surface-container/50 rounded-3xl p-6" style={{ border: '0.5px solid rgba(196, 151, 62, 0.2)' }}>
                                <p className="text-primary text-xs font-bold uppercase tracking-wider mb-3">Styles to Avoid</p>
                                <div className="flex flex-wrap gap-2">
                                    {shapeData.avoidStyles.map((s) => (
                                        <span key={s} className="text-sm bg-surface-container/50 text-on-surface-variant border border-primary/20 px-3 py-1.5 rounded-full">✕ {s}</span>
                                    ))}
                                </div>
                            </div>

                            {/* Color advice */}
                            <div className="rounded-3xl p-6" style={{ background: 'rgba(196,151,62,0.05)', border: '0.5px solid rgba(196,151,62,0.2)' }}>
                                <p className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-2">Color Strategy</p>
                                <p className="text-on-surface-variant leading-relaxed">{shapeData.colors}</p>
                            </div>

                            {/* CTAs */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Link
                                    href="/dashboard"
                                    className="flex-1 text-center py-3 rounded-[10px] bg-primary-container hover:opacity-90 text-on-primary font-headline font-bold text-xs uppercase tracking-widest transition-all"
                                >
                                    View Dashboard
                                </Link>
                                <Link
                                    href="/quiz/style"
                                    className="flex-1 text-center py-3 rounded-[10px] bg-surface-container/30 hover:bg-surface-container/50 text-on-surface font-headline font-bold text-xs uppercase tracking-widest transition-all"
                                    style={{ border: '0.5px solid rgba(196,151,62,0.2)' }}
                                >
                                    Take Style Quiz <span className="material-symbols-outlined text-base align-middle">arrow_forward</span>
                                </Link>
                            </div>
                        </motion.div>
                    ) : null}
                </AnimatePresence>
            </div>
        </AppLayout>
    );
}
