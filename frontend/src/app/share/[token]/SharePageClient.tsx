'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import CelebrityMatch from '@/components/CelebrityMatch';
import { API_BASE } from '@/lib/api';

interface ShareData {
    season: string;
    hex_color: string;
    undertone: string;
    confidence: number;
    contrast_level: string;
    palette: string[];
    metal: string;
}

// Season → card gradient
function getSeasonGradient(season: string): string {
    const s = season.toLowerCase();
    if (s.includes('autumn') || s.includes('fall')) {
        return 'linear-gradient(135deg, #2D1B0D 0%, #4A3219 50%, #1A120B 100%)';
    }
    if (s.includes('spring')) {
        return 'linear-gradient(135deg, #1E1509 0%, #3A2A0E 50%, #12100A 100%)';
    }
    if (s.includes('summer')) {
        return 'linear-gradient(135deg, #0D0F1E 0%, #1A1830 50%, #0A0C1A 100%)';
    }
    if (s.includes('winter')) {
        return 'linear-gradient(135deg, #0A0A12 0%, #131320 50%, #080810 100%)';
    }
    return 'linear-gradient(135deg, #1A1310 0%, #2C1F14 50%, #100D0A 100%)';
}

// Season → editorial copy
function getSeasonCopy(season: string): { definition: string; style: string; editorial: string } {
    const s = season.toLowerCase();
    if (s.includes('true autumn')) {
        return {
            definition: 'True Autumns carry warm, golden undertones with medium-to-high contrast. Your palette is rich, earthy, and deeply saturated.',
            style: 'Embrace heavy textures like suede, wool, and silk in toasted shades. Avoid cool greys and stark electric blues.',
            editorial: 'This profile was generated using Lumiqe AI\'s spectral skin analysis and high-fidelity tonal mapping.',
        };
    }
    if (s.includes('soft autumn')) {
        return {
            definition: 'Soft Autumns have warm undertones with low contrast. Your palette is muted, earthy, and gentle — think aged terracotta and dusty olive.',
            style: 'Layer textures in soft, dusty shades. Avoid high contrast combinations and bright saturated hues.',
            editorial: 'This profile was generated using Lumiqe AI\'s spectral skin analysis and high-fidelity tonal mapping.',
        };
    }
    if (s.includes('deep autumn')) {
        return {
            definition: 'Deep Autumns have rich warm undertones with high contrast. Your palette is dark, earthy, and intense — espresso, mahogany, and forest.',
            style: 'Go deep and rich. Dark wools, leather, and jewel-toned velvets are your signature. Avoid pastel and icy tones.',
            editorial: 'This profile was generated using Lumiqe AI\'s spectral skin analysis and high-fidelity tonal mapping.',
        };
    }
    if (s.includes('spring')) {
        return {
            definition: 'Springs carry warm, clear undertones with a light-to-medium value range. Your palette is bright, fresh, and luminous.',
            style: 'Reach for warm corals, peachy nudes, and clear yellows. Light fabrics with sheen catch the light beautifully.',
            editorial: 'This profile was generated using Lumiqe AI\'s spectral skin analysis and high-fidelity tonal mapping.',
        };
    }
    if (s.includes('summer')) {
        return {
            definition: 'Summers carry cool, muted undertones with a soft contrast range. Your palette is delicate, blended, and effortlessly elegant.',
            style: 'Soft rose, lavender, and powder blue are your allies. Avoid warm earth tones and harsh black-white contrast.',
            editorial: 'This profile was generated using Lumiqe AI\'s spectral skin analysis and high-fidelity tonal mapping.',
        };
    }
    if (s.includes('winter')) {
        return {
            definition: 'Winters have cool or neutral-cool undertones with striking high contrast. Your palette is icy, vivid, and dramatically clear.',
            style: 'Embrace pure white, jet black, and vivid jewel tones. Stark contrast is your superpower — own it.',
            editorial: 'This profile was generated using Lumiqe AI\'s spectral skin analysis and high-fidelity tonal mapping.',
        };
    }
    return {
        definition: 'Your unique color archetype was determined through AI-powered spectral analysis of your skin\'s undertone and contrast level.',
        style: 'Wear the colors in your palette close to your face for maximum harmony and luminosity.',
        editorial: 'This profile was generated using Lumiqe AI\'s spectral skin analysis and high-fidelity tonal mapping.',
    };
}

export default function SharePageClient({ token }: { token: string }) {
    const [data, setData] = useState<ShareData | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    const baseShareUrl = typeof window !== 'undefined' ? window.location.href : '';

    const buildShareUrl = (source: string) => {
        const url = new URL(baseShareUrl || 'https://lumiqe.in');
        url.searchParams.set('utm_source', source);
        url.searchParams.set('utm_medium', 'social');
        url.searchParams.set('utm_campaign', 'share_result');
        return url.toString();
    };

    const copyLink = () => {
        navigator.clipboard.writeText(buildShareUrl('copy_link'));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    useEffect(() => {
        fetch(`${API_BASE}/api/share/${token}`)
            .then(res => res.ok ? res.json() : null)
            .then(d => setData(d))
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    }, [token]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl text-primary animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                <p className="font-label text-sm tracking-widest uppercase">Loading analysis...</p>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
                <span className="material-symbols-outlined text-6xl text-primary mb-6" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                <h1 className="font-display italic text-4xl text-on-surface mb-4">Analysis Not Found</h1>
                <p className="text-on-surface-variant text-sm mb-8 max-w-sm">This shared link may have expired or doesn&apos;t exist.</p>
                <Link href="/" className="px-8 py-3 bg-primary-container text-on-primary-container font-label font-bold text-xs uppercase tracking-widest rounded-lg hover:opacity-90 transition-all active:scale-95">
                    Discover Your Colors
                </Link>
            </div>
        );
    }

    const copy = getSeasonCopy(data.season);
    const swatches = data.palette.slice(0, 4);

    return (
        <div className="min-h-screen bg-background text-on-surface overflow-x-hidden flex flex-col">

            {/* Nav — logo only, transparent */}
            <nav className="fixed top-0 w-full z-50 flex justify-center items-center h-24 px-8"
                style={{ background: 'linear-gradient(to bottom, rgba(9,9,11,0.6), transparent)' }}>
                <span className="font-display italic text-3xl tracking-tighter text-primary-container">Lumiqe</span>
            </nav>

            {/* Main card area */}
            <main className="flex-grow flex flex-col items-center justify-center pt-24 pb-32 px-6">

                {/* Ambient glow */}
                <div className="relative group max-w-md w-full">
                    <div className="absolute -inset-10 bg-primary/5 blur-[80px] rounded-full opacity-50 pointer-events-none" />

                    {/* Share card */}
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="relative z-10 rounded-[24px] overflow-hidden shadow-2xl aspect-[3/4] flex flex-col"
                        style={{
                            background: getSeasonGradient(data.season),
                            border: '0.5px solid rgba(196, 151, 62, 0.2)',
                        }}
                    >
                        {/* Card content */}
                        <div className="p-10 flex flex-col flex-grow">
                            {/* Top row */}
                            <div className="flex justify-between items-start mb-12">
                                <span className="font-display italic text-2xl text-primary/80">Lumiqe</span>
                                <div className="flex flex-col items-end">
                                    <span className="font-mono text-[8px] tracking-[0.2em] text-primary/40 uppercase">A.I. Analysis</span>
                                    <span className="font-mono text-[10px] text-on-surface/40">
                                        #{Math.round(data.confidence * 10000).toString(16).toUpperCase().padStart(4, '0')}-TX
                                    </span>
                                </div>
                            </div>

                            {/* Season name */}
                            <div className="space-y-1">
                                <p className="font-headline text-[10px] uppercase tracking-[0.4em] text-primary/60 mb-2">Color Archetype</p>
                                <h1 className="font-display text-6xl leading-[0.9] text-on-surface/95">{data.season}</h1>
                            </div>

                            {/* Badges */}
                            <div className="flex flex-wrap gap-2 mt-6">
                                <span className="inline-flex items-center px-3 py-1 rounded-full font-mono text-[9px] uppercase tracking-widest text-primary/70"
                                    style={{ border: '0.5px solid rgba(196,151,62,0.2)' }}>
                                    {data.undertone} undertone
                                </span>
                                {data.contrast_level && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full font-mono text-[9px] uppercase tracking-widest text-primary/70"
                                        style={{ border: '0.5px solid rgba(196,151,62,0.2)' }}>
                                        {data.contrast_level} contrast
                                    </span>
                                )}
                                <span className="inline-flex items-center px-3 py-1 rounded-full font-mono text-[9px] uppercase tracking-widest text-primary/70"
                                    style={{ border: '0.5px solid rgba(196,151,62,0.2)' }}>
                                    {Math.round(data.confidence * 100)}% confidence
                                </span>
                            </div>

                            {/* Palette swatches */}
                            <div className="mt-auto grid grid-cols-4 gap-3">
                                {swatches.map((color, i) => (
                                    <div key={i} className="group/swatch relative">
                                        <div
                                            className="aspect-square rounded-full transition-transform group-hover/swatch:scale-105 duration-500"
                                            style={{
                                                backgroundColor: color,
                                                border: '0.5px solid rgba(196,151,62,0.2)',
                                            }}
                                        />
                                        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 font-mono text-[7px] opacity-0 group-hover/swatch:opacity-100 transition-opacity text-on-surface/50 whitespace-nowrap">
                                            {color}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Bottom image strip */}
                        <div
                            className="h-1/4 w-full flex-shrink-0 relative"
                            style={{ backgroundColor: data.hex_color, opacity: 0.4 }}
                        >
                            <div className="absolute inset-0"
                                style={{ background: 'linear-gradient(to top, rgba(10,8,6,0.9), transparent)' }} />
                        </div>
                    </motion.div>
                </div>

                {/* Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-16 flex flex-col items-center gap-6"
                >
                    <button
                        onClick={copyLink}
                        className="flex items-center gap-3 bg-primary-container text-on-primary font-headline font-bold text-xs uppercase tracking-widest px-12 py-5 rounded-lg shadow-lg shadow-primary/10 hover:opacity-90 transition-all active:scale-95"
                    >
                        {copied
                            ? <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                            : <span className="material-symbols-outlined text-sm">share</span>
                        }
                        {copied ? 'Link Copied!' : 'Share Link'}
                    </button>

                    <div className="flex gap-8 items-center">
                        <button
                            onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`I just discovered I'm a ${data.season}! 🎨 Find your color season at ${buildShareUrl('whatsapp')}`)}`, '_blank')}
                            className="text-on-surface/30 hover:text-primary transition-colors flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                            <span className="font-label text-[10px] uppercase tracking-widest">WhatsApp</span>
                        </button>
                        <div className="w-px h-3 bg-on-surface/10" />
                        <button
                            onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`I just discovered I'm a ${data.season}! Find your color season →`)}&url=${encodeURIComponent(buildShareUrl('twitter'))}`, '_blank')}
                            className="text-on-surface/30 hover:text-primary transition-colors flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                            <span className="font-label text-[10px] uppercase tracking-widest">Twitter/X</span>
                        </button>
                    </div>
                </motion.div>
            </main>

            {/* Editorial details */}
            <motion.section
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="max-w-4xl mx-auto w-full px-8 pb-20"
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 py-16"
                    style={{ borderTop: '0.5px solid rgba(229,225,228,0.05)' }}>
                    <div className="space-y-4">
                        <h3 className="font-headline text-[11px] uppercase tracking-[0.2em] text-primary/80">Season Definition</h3>
                        <p className="font-body text-xs text-on-surface/50 leading-relaxed">{copy.definition}</p>
                    </div>
                    <div className="space-y-4">
                        <h3 className="font-headline text-[11px] uppercase tracking-[0.2em] text-primary/80">Style Advice</h3>
                        <p className="font-body text-xs text-on-surface/50 leading-relaxed">{copy.style}</p>
                    </div>
                    <div className="space-y-4">
                        <h3 className="font-headline text-[11px] uppercase tracking-[0.2em] text-primary/80">Editorial Note</h3>
                        <p className="font-body text-xs text-on-surface/50 leading-relaxed">{copy.editorial}</p>
                    </div>
                </div>
            </motion.section>

            {/* Celebrity match */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="max-w-4xl mx-auto w-full px-8 pb-20"
            >
                <CelebrityMatch celebrities={[]} season={data.season} />
            </motion.div>

            {/* CTA */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="max-w-md mx-auto w-full px-8 pb-20 text-center"
            >
                <div className="rounded-[24px] p-10 md:p-12"
                    style={{ background: 'rgba(196,151,62,0.04)', border: '0.5px solid rgba(196,151,62,0.15)' }}>
                    <span className="material-symbols-outlined text-5xl text-primary block mx-auto mb-6" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                    <h3 className="font-display italic text-3xl text-on-surface mb-3">Discover Your Colors</h3>
                    <p className="font-body text-sm text-on-surface/50 max-w-sm mx-auto mb-8 leading-relaxed">
                        Find your exact color season in seconds. Get your personalized palette, styling tips, and curated shopping recommendations.
                    </p>
                    <Link
                        href="/analyze"
                        className="inline-flex items-center gap-2 bg-primary-container text-on-primary font-headline font-bold text-xs uppercase tracking-widest px-10 py-4 rounded-lg hover:opacity-90 transition-all active:scale-95"
                    >
                        Analyze My Colors
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                </div>
            </motion.div>

            {/* Footer */}
            <footer className="py-12 flex flex-col items-center gap-4">
                <p className="font-mono text-[9px] text-on-surface/20 uppercase tracking-[0.3em]">Lumiqe Atelier © 2026</p>
            </footer>
        </div>
    );
}
