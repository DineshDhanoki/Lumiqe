'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';

const QUESTIONS = [
    {
        id: 'weekend',
        question: 'On a free weekend, you\'re most likely wearing:',
        options: [
            { label: 'Well-fitted jeans and a crisp white shirt', value: 'classic' },
            { label: 'A flowy midi dress with delicate details', value: 'romantic' },
            { label: 'A leather jacket, ripped jeans, and boots', value: 'edgy' },
            { label: 'Linen trousers, an oversized linen top, sandals', value: 'boho' },
            { label: 'Tailored joggers and a quality minimal tee', value: 'minimalist' },
        ],
    },
    {
        id: 'closet',
        question: 'Your wardrobe is mostly:',
        options: [
            { label: 'Timeless pieces in neutrals — navy, white, camel', value: 'classic' },
            { label: 'Soft colors, florals, and feminine silhouettes', value: 'romantic' },
            { label: 'Black, dark tones, and statement pieces', value: 'edgy' },
            { label: 'Earthy tones, prints, and vintage finds', value: 'boho' },
            { label: 'Clean lines, muted palette, no clutter', value: 'minimalist' },
        ],
    },
    {
        id: 'dream_outfit',
        question: 'Your dream outfit for a dinner out is:',
        options: [
            { label: 'A sharp blazer with straight-leg trousers', value: 'classic' },
            { label: 'A silk wrap dress with strappy heels', value: 'romantic' },
            { label: 'A sleek all-black look with a bold accessory', value: 'edgy' },
            { label: 'Flowy wide-leg pants and embroidered blouse', value: 'boho' },
            { label: 'One beautiful oversized piece in a clean cut', value: 'minimalist' },
        ],
    },
    {
        id: 'accessories',
        question: 'Your accessories are typically:',
        options: [
            { label: 'A quality watch, simple gold pieces', value: 'classic' },
            { label: 'Delicate layered necklaces, pearl earrings', value: 'romantic' },
            { label: 'Chunky rings, studs, bold hardware', value: 'edgy' },
            { label: 'Natural stones, layered beads, woven pieces', value: 'boho' },
            { label: 'One minimal piece — nothing more', value: 'minimalist' },
        ],
    },
    {
        id: 'icon',
        question: 'Which style icon resonates most with you?',
        options: [
            { label: 'Audrey Hepburn or Grace Kelly', value: 'classic' },
            { label: 'Zoe Kravitz or Florence Welch', value: 'romantic' },
            { label: 'Rihanna or Billie Eilish', value: 'edgy' },
            { label: 'Sienna Miller or Vanessa Hudgens', value: 'boho' },
            { label: 'Rosé or Jennie from BLACKPINK', value: 'minimalist' },
        ],
    },
    {
        id: 'shopping',
        question: 'When shopping, you look for:',
        options: [
            { label: 'Investment pieces that last 10 years', value: 'classic' },
            { label: 'Soft textures, lace, floral prints', value: 'romantic' },
            { label: 'Unexpected cuts, unusual details, attitude', value: 'edgy' },
            { label: 'Artisan fabrics, unique vintage, handmade', value: 'boho' },
            { label: 'Perfect fit, quality fabric, nothing unnecessary', value: 'minimalist' },
        ],
    },
    {
        id: 'pattern',
        question: 'Your go-to pattern is:',
        options: [
            { label: 'Subtle stripe or check', value: 'classic' },
            { label: 'Floral or ditsy prints', value: 'romantic' },
            { label: 'Graphic, abstract, or geometric', value: 'edgy' },
            { label: 'Paisley, tribal, or ikat', value: 'boho' },
            { label: 'Solid — pattern is rarely needed', value: 'minimalist' },
        ],
    },
    {
        id: 'shoes',
        question: 'Your most-worn shoes are:',
        options: [
            { label: 'Classic loafers or pointed-toe heels', value: 'classic' },
            { label: 'Strappy sandals or kitten heels', value: 'romantic' },
            { label: 'Chunky boots or platform sneakers', value: 'edgy' },
            { label: 'Suede ankle boots or leather sandals', value: 'boho' },
            { label: 'Clean white trainers or simple mules', value: 'minimalist' },
        ],
    },
    {
        id: 'compliment',
        question: 'The compliment you most want to receive is:',
        options: [
            { label: '"You always look so put-together"', value: 'classic' },
            { label: '"You look so beautiful and feminine"', value: 'romantic' },
            { label: '"You\'re so bold — I love your style"', value: 'edgy' },
            { label: '"You have such an effortless cool vibe"', value: 'boho' },
            { label: '"Your style is so clean and refined"', value: 'minimalist' },
        ],
    },
    {
        id: 'color',
        question: 'If you had to wear one color family every day:',
        options: [
            { label: 'Navy, white, and camel', value: 'classic' },
            { label: 'Blush, lavender, and dusty rose', value: 'romantic' },
            { label: 'Black, charcoal, and deep red', value: 'edgy' },
            { label: 'Rust, terracotta, and olive', value: 'boho' },
            { label: 'Stone, cream, and soft grey', value: 'minimalist' },
        ],
    },
];

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

function calculatePersonality(answers: Record<string, string>): string {
    const scores: Record<string, number> = {
        classic: 0, romantic: 0, edgy: 0, boho: 0, minimalist: 0,
    };
    Object.values(answers).forEach(v => { if (scores[v] !== undefined) scores[v]++; });
    return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
}

export default function StyleQuiz() {
    const [current, setCurrent] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [result, setResult] = useState<string | null>(null);

    const question = QUESTIONS[current];
    const progress = (current / QUESTIONS.length) * 100;

    const handleAnswer = (value: string) => {
        const newAnswers = { ...answers, [question.id]: value };
        setAnswers(newAnswers);
        if (current + 1 < QUESTIONS.length) {
            setCurrent(current + 1);
        } else {
            const personality = calculatePersonality(newAnswers);
            setResult(personality);
            try {
                localStorage.setItem('lumiqe-style-personality', JSON.stringify({ personality, timestamp: Date.now() }));
            } catch { /* ignore */ }
        }
    };

    const data = result ? PERSONALITIES[result] : null;

    return (
        <main className="min-h-screen bg-transparent text-white font-sans pb-24">
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
                            <div className="text-center mb-8">
                                <p className="text-red-400 text-xs font-bold tracking-widest uppercase mb-2">Style Personality Quiz</p>
                                <h1 className="text-3xl font-bold text-white">Question {current + 1} of {QUESTIONS.length}</h1>
                            </div>

                            <div className="w-full bg-white/10 rounded-full h-1.5 mb-8">
                                <motion.div
                                    className="bg-red-500 h-1.5 rounded-full"
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.4 }}
                                />
                            </div>

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
                    ) : data ? (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            <div className="text-center">
                                <p className="text-red-400 text-xs font-bold tracking-widest uppercase mb-3">Your Style Personality</p>
                                <div className="text-6xl mb-3">{data.emoji}</div>
                                <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-200 via-rose-300 to-white mb-2">{data.name}</h1>
                                <p className="text-red-300 italic mb-4">{data.tagline}</p>
                                <p className="text-white/70 leading-relaxed max-w-md mx-auto">{data.description}</p>
                            </div>

                            <div className="bg-zinc-900/60 border border-white/10 rounded-3xl p-6">
                                <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-3">Style Icons</p>
                                <div className="flex flex-wrap gap-2">
                                    {data.icons.map((icon, i) => (
                                        <span key={i} className="text-sm bg-white/10 text-white/70 border border-white/15 px-3 py-1.5 rounded-full">
                                            ✦ {icon}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-zinc-900/60 border border-white/10 rounded-3xl p-6">
                                <p className="text-green-400 text-xs font-bold uppercase tracking-wider mb-3">Your Key Pieces</p>
                                <ul className="space-y-2">
                                    {data.keyPieces.map((piece, i) => (
                                        <li key={i} className="flex items-center gap-2 text-sm text-white/80">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                                            {piece}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="bg-gradient-to-r from-red-950/40 to-zinc-900/40 border border-red-500/20 rounded-3xl p-6">
                                <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-2">Color Advice for Your Personality</p>
                                <p className="text-white/80 leading-relaxed">{data.colorAdvice}</p>
                            </div>

                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-3xl p-6">
                                <p className="text-yellow-400 text-xs font-bold uppercase tracking-wider mb-2">Style Trap to Avoid</p>
                                <p className="text-white/80 leading-relaxed">{data.avoidTrap}</p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <Link href="/dashboard" className="flex-1 text-center py-3 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold transition-all hover:scale-105">
                                    View Dashboard
                                </Link>
                                <Link href="/analyze" className="flex-1 text-center py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold transition-all">
                                    Scan Your Colors
                                </Link>
                            </div>
                        </motion.div>
                    ) : null}
                </AnimatePresence>
            </div>
        </main>
    );
}
