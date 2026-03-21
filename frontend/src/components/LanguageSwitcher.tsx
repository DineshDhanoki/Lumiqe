'use client';

import { useState, useRef, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { LANGUAGES } from '@/lib/i18n';

interface LanguageSwitcherProps {
    currentLang: string;
    onChange: (lang: string) => void;
}

export default function LanguageSwitcher({ currentLang, onChange }: LanguageSwitcherProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const current = LANGUAGES.find(l => l.code === currentLang) ?? LANGUAGES[0];

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(prev => !prev)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white/70 hover:text-white transition-all text-sm"
            >
                <Globe className="w-3.5 h-3.5" />
                <span>{current.flag}</span>
                <span className="hidden sm:inline">{current.label}</span>
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-zinc-900 border border-white/15 rounded-2xl shadow-2xl z-50 overflow-hidden">
                    {LANGUAGES.map(lang => (
                        <button
                            key={lang.code}
                            onClick={() => { onChange(lang.code); setOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left ${
                                lang.code === currentLang
                                    ? 'bg-red-600/20 text-white'
                                    : 'text-white/60 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            <span className="text-base">{lang.flag}</span>
                            <span>{lang.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
