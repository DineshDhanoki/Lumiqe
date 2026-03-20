'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

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

export default function BodyShapeQuiz() {
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
                localStorage.setItem('lumiqe-body-shape', JSON.stringify({ shape, timestamp: Date.now() }));
            } catch { /* ignore */ }
        }
    };

    const shapeData = result ? SHAPES[result] : null;

    return (
        <main className="min-h-screen bg-transparent text-white font-sans pb-24">
            {/* Nav */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
                <Link href="/dashboard" className="text-white/60 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium">
                    <ArrowLeft className="w-4 h-4" />
                    Dashboard
                </Link>
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-red-400" />
                    <span className="text-xl font-bold tracking-widest text-white">LUMIQE</span>
                </div>
                <div className="w-24" />
            </nav>

            <div className="max-w-xl mx-auto px-4 pt-28">
                <AnimatePresence mode="wait">
                    {!result ? (
                        <motion.div
                            key={current}
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -40 }}
                            transition={{ duration: 0.2 }}
                        >
                            {/* Header */}
                            <div className="text-center mb-8">
                                <p className="text-red-400 text-xs font-bold tracking-widest uppercase mb-2">
                                    Body Shape Analysis
                                </p>
                                <h1 className="text-3xl font-bold text-white">Question {current + 1} of {QUESTIONS.length}</h1>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full bg-white/10 rounded-full h-1.5 mb-8">
                                <motion.div
                                    className="bg-red-500 h-1.5 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.4 }}
                                />
                            </div>

                            {/* Question */}
                            <div className="bg-zinc-900/60 border border-white/10 rounded-3xl p-8 mb-6">
                                <h2 className="text-xl font-bold text-white mb-6">{question.question}</h2>
                                <div className="space-y-3">
                                    {question.options.map((opt) => (
                                        <button
                                            key={opt.value}
                                            onClick={() => handleAnswer(opt.value)}
                                            className="w-full text-left px-5 py-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-red-600/20 hover:border-red-500/40 text-white/80 hover:text-white transition-all font-medium"
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {current > 0 && (
                                <button
                                    onClick={() => setCurrent(current - 1)}
                                    className="text-white/40 hover:text-white text-sm flex items-center gap-1 transition-colors"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5" /> Previous question
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
                                <p className="text-red-400 text-xs font-bold tracking-widest uppercase mb-3">Your Body Shape</p>
                                <div className="text-6xl mb-3">{shapeData.emoji}</div>
                                <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-200 via-rose-300 to-white mb-4">
                                    {shapeData.shape}
                                </h1>
                                <p className="text-white/70 leading-relaxed max-w-md mx-auto">{shapeData.description}</p>
                            </div>

                            {/* Best styles */}
                            <div className="bg-zinc-900/60 border border-white/10 rounded-3xl p-6">
                                <p className="text-green-400 text-xs font-bold uppercase tracking-wider mb-3">Best Styles For You</p>
                                <div className="flex flex-wrap gap-2">
                                    {shapeData.bestStyles.map((s, i) => (
                                        <span key={i} className="flex items-center gap-1.5 text-sm bg-green-500/15 text-green-300 border border-green-500/25 px-3 py-1.5 rounded-full">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            {s}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Avoid */}
                            <div className="bg-zinc-900/60 border border-white/10 rounded-3xl p-6">
                                <p className="text-red-400 text-xs font-bold uppercase tracking-wider mb-3">Styles to Avoid</p>
                                <div className="flex flex-wrap gap-2">
                                    {shapeData.avoidStyles.map((s, i) => (
                                        <span key={i} className="text-sm bg-red-500/15 text-red-300 border border-red-500/25 px-3 py-1.5 rounded-full">✕ {s}</span>
                                    ))}
                                </div>
                            </div>

                            {/* Color advice */}
                            <div className="bg-gradient-to-r from-red-950/40 to-zinc-900/40 border border-red-500/20 rounded-3xl p-6">
                                <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-2">Color Strategy</p>
                                <p className="text-white/80 leading-relaxed">{shapeData.colors}</p>
                            </div>

                            {/* CTAs */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Link
                                    href="/dashboard"
                                    className="flex-1 text-center py-3 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold transition-all hover:scale-105"
                                >
                                    View Dashboard
                                </Link>
                                <Link
                                    href="/quiz/style"
                                    className="flex-1 text-center py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold transition-all"
                                >
                                    Take Style Quiz <ArrowRight className="inline w-4 h-4" />
                                </Link>
                            </div>
                        </motion.div>
                    ) : null}
                </AnimatePresence>
            </div>
        </main>
    );
}
