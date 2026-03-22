'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Loader2 } from 'lucide-react';
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
            content: `Hi! I'm your personal Lumiqe color stylist. You're a ${season} — ${styleArchetype} energy with ${undertone} undertones. Ask me anything about what colors to wear, outfit formulas, shopping choices, or beauty tips. I'm here to help you dress like you hired a private stylist! ✨`,
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
            {/* Header */}
            <div className="text-center mb-4">
                <h2 className="text-3xl font-bold text-white mb-1">AI Stylist Chat</h2>
                <p className="text-white/50 text-sm">Your personal color consultant, available 24/7</p>
            </div>

            {/* Chat window */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4 scrollbar-thin scrollbar-thumb-white/10">
                <AnimatePresence initial={false}>
                    {messages.map((msg, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            {msg.role === 'assistant' && (
                                <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                                    <Sparkles className="w-3.5 h-3.5 text-white" />
                                </div>
                            )}
                            <div
                                className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                                    msg.role === 'user'
                                        ? 'bg-red-600/80 text-white rounded-tr-sm'
                                        : 'bg-zinc-800/80 border border-white/10 text-white/90 rounded-tl-sm'
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
                            <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                                <Sparkles className="w-3.5 h-3.5 text-white" />
                            </div>
                            <div className="bg-zinc-800/80 border border-white/10 px-4 py-3 rounded-2xl rounded-tl-sm">
                                <Loader2 className="w-4 h-4 text-white/50 animate-spin" />
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
                            className="text-xs text-white/60 bg-white/10 hover:bg-white/20 border border-white/15 px-3 py-1.5 rounded-full transition-colors"
                        >
                            {q}
                        </button>
                    ))}
                </div>
            )}

            {/* Error */}
            {error && (
                <p className="text-red-400 text-xs text-center mb-2">{error}</p>
            )}

            {/* Input */}
            <div className="flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    placeholder="Ask your stylist anything..."
                    className="flex-1 bg-zinc-800/80 border border-white/15 rounded-2xl px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
                />
                <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || isLoading}
                    className="w-12 h-12 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-2xl flex items-center justify-center transition-colors flex-shrink-0"
                >
                    <Send className="w-4 h-4 text-white" />
                </button>
            </div>
        </motion.div>
    );
}
