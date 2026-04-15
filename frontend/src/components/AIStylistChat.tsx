'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { apiFetch } from '@/lib/api';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface AIStylistChatProps {
    season: string;
    undertone: string;
    contrastLevel: string;
    styleArchetype: string;
    signatureColorName: string;
    metal: string;
}

const STARTER_QUESTIONS = [
    'What should I wear to a job interview?',
    'Can I wear black?',
    'What colours suit me for a wedding?',
    'How do I build a capsule wardrobe?',
    'What makeup look suits my season?',
];

export default function AIStylistChat({
    season,
    undertone,
    contrastLevel,
    styleArchetype,
    signatureColorName,
    metal,
}: AIStylistChatProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: `Hi! I'm your personal Lumiqe color stylist. You're a ${season} — ${styleArchetype} energy with ${undertone} undertones. Ask me anything about what colors to wear, outfit formulas, shopping choices, or beauty tips. I'm here to help you dress like you hired a private stylist!`,
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (text?: string) => {
        const userText = text ?? input.trim();
        if (!userText || isLoading) return;

        const userMsg: Message = { role: 'user', content: userText };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);
        setError(null);

        try {
            const history = messages.map(m => ({ role: m.role, content: m.content }));

            const res = await apiFetch('/api/color-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userText,
                    season,
                    undertone,
                    contrast_level: contrastLevel,
                    style_archetype: styleArchetype,
                    signature_color: signatureColorName,
                    metal,
                    history,
                }),
            }, {});

            if (!res.ok) {
                throw new Error('Stylist unavailable right now. Please try again.');
            }

            const data = await res.json();
            setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Something went wrong.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col h-[680px]"
        >
            {/* Editorial header */}
            <div className="mb-5">
                <span className="font-label text-[10px] tracking-[0.3em] uppercase text-on-surface-variant/60 block mb-1">Lumiqe Intelligence</span>
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-secondary text-2xl">auto_awesome</span>
                    <div>
                        <h2 className="font-display italic text-3xl text-on-surface leading-tight">AI Stylist</h2>
                        <p className="text-on-surface-variant text-xs font-label mt-0.5">Your personal color consultant, available 24/7</p>
                    </div>
                </div>
            </div>

            {/* Chat window */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4 scrollbar-thin scrollbar-thumb-primary/10">
                <AnimatePresence initial={false}>
                    {messages.map((msg, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            {msg.role === 'assistant' && (
                                <div className="w-7 h-7 rounded-full bg-secondary-container/40 border border-secondary/20 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                                    <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                                        auto_awesome
                                    </span>
                                </div>
                            )}
                            <div
                                className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                                    msg.role === 'user'
                                        ? 'bg-primary-container/80 text-on-primary-container rounded-tr-sm'
                                        : 'bg-surface-container/80 border border-primary/10 text-on-surface-variant rounded-tl-sm'
                                }`}
                            >
                                {msg.content}
                            </div>
                        </motion.div>
                    ))}

                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex justify-start"
                        >
                            <div className="w-7 h-7 rounded-full bg-secondary-container/40 border border-secondary/20 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                                <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                                    auto_awesome
                                </span>
                            </div>
                            <div className="bg-surface-container/80 border border-primary/10 px-4 py-3 rounded-2xl rounded-tl-sm">
                                <span className="material-symbols-outlined text-on-surface-variant text-base animate-spin">progress_activity</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <div ref={bottomRef} />
            </div>

            {/* Starter questions */}
            {messages.length <= 1 && (
                <div className="flex flex-wrap gap-2 mb-3">
                    {STARTER_QUESTIONS.map((q, i) => (
                        <button
                            key={i}
                            onClick={() => sendMessage(q)}
                            className="text-xs text-on-surface-variant bg-surface-container/50 hover:bg-surface-container border border-outline-variant/20 px-3 py-1.5 rounded-full transition-colors font-label"
                        >
                            {q}
                        </button>
                    ))}
                </div>
            )}

            {/* Error */}
            {error && (
                <p className="text-primary text-xs text-center mb-2">{error}</p>
            )}

            {/* Input row */}
            <div className="flex gap-2 items-center border-t border-outline-variant/10 pt-4">
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    placeholder="Ask your stylist anything..."
                    className="flex-1 bg-transparent border-b border-outline-variant/30 focus:border-primary/60 px-1 py-2.5 text-on-surface text-sm placeholder-on-surface-variant/40 focus:outline-none transition-colors"
                />
                <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || isLoading}
                    aria-label="Send message"
                    className="w-10 h-10 bg-gradient-to-br from-primary-container to-primary disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-opacity flex-shrink-0 hover:opacity-90 active:scale-95"
                >
                    <span className="material-symbols-outlined text-on-primary text-base">send</span>
                </button>
            </div>
        </motion.div>
    );
}
