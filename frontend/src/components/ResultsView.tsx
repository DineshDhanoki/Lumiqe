'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import ColorProfileDeep from './ColorProfileDeep';
import OccasionGuide from './OccasionGuide';
import CapsuleWardrobe from './CapsuleWardrobe';
import HairAndBeautyGuide from './HairAndBeautyGuide';
import AIStylistChat from './AIStylistChat';
import OverviewTab from './results/OverviewTab';
import AppLayout from './layout/AppLayout';
import { apiFetch } from '@/lib/api';

interface CompleteProfile {
    style_archetype: string;
    signature_color: { hex: string; name: string };
    value: string;
    chroma: string;
    foundation_undertone: string;
    jewelry_guide: string;
    color_harmonies: { monochromatic: string; complementary: string; analogous: string; neutral_base: string };
    patterns: { best: string[]; scale: string; avoid: string[] };
    occasions: Record<string, { formula: string; colors: string[]; key_pieces: string[] }>;
    capsule_wardrobe: { piece: string; hex: string; why: string }[];
    wardrobe_formula: string;
    hair_colors: { best_natural: string[]; highlights: string[]; avoid: string[] };
    makeup_extended: { foundation: string; concealer: string; lips_shades: string[]; eyeliner: string; mascara: string; brow_color: string };
}

const TABS = [
    { id: 'overview',  label: 'Overview',      icon: <span className="material-symbols-outlined text-base">grid_view</span> },
    { id: 'profile',   label: 'Color Profile',  icon: <span className="material-symbols-outlined text-base">auto_awesome</span> },
    { id: 'occasions', label: 'Occasions',      icon: <span className="material-symbols-outlined text-base">event</span> },
    { id: 'wardrobe',  label: 'Wardrobe',       icon: <span className="material-symbols-outlined text-base">shopping_bag</span> },
    { id: 'beauty',    label: 'Hair & Beauty',  icon: <span className="material-symbols-outlined text-base">content_cut</span> },
    { id: 'chat',      label: 'AI Stylist',     icon: <span className="material-symbols-outlined text-base">chat</span> },
];

export interface ResultsData {
    season: string;
    description: string;
    hexColor: string;
    undertone: string;
    confidence: number;
    contrastLevel: string;
    palette: string[];
    avoidColors: string[];
    metal: string;
    tips: string;
    celebrities: { name: string; image: string }[];
    makeup: { lips: string; blush: string; eyeshadow: string };
}

interface ResultsViewProps extends ResultsData {
    backHref: string;
    backLabel: string;
    analysisId?: string;
    showAccountNudge?: boolean;
}

function getStatBar(key: string, value: string): number {
    const v = value.toLowerCase();
    if (key === 'undertone') {
        if (v.includes('warm')) return 80;
        if (v.includes('cool')) return 25;
        if (v.includes('olive')) return 60;
        return 50;
    }
    if (key === 'contrast') {
        if (v.includes('high') || v.includes('rich') || v.includes('deep') || v.includes('strong')) return 88;
        if (v.includes('low') || v.includes('soft') || v.includes('light') || v.includes('gentle')) return 22;
        return 55;
    }
    if (key === 'metal') {
        if (v.includes('gold')) return 85;
        if (v.includes('silver')) return 30;
        if (v.includes('rose')) return 60;
        return 50;
    }
    return 50;
}

export default function ResultsView({
    season, description, hexColor, undertone, confidence, contrastLevel,
    palette, avoidColors, metal, tips, celebrities, makeup,
    backHref, backLabel, analysisId, showAccountNudge,
}: ResultsViewProps) {
    const { data: session } = useSession();
    const [activeTab, setActiveTab] = useState('overview');
    const [completeProfile, setCompleteProfile] = useState<CompleteProfile | null>(null);
    const [profileLoading, setProfileLoading] = useState(false);
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);

    useEffect(() => {
        try {
            const stored = sessionStorage.getItem('lumiqe-analysis-photo');
            if (stored) {
                setPhotoUrl(stored);
                sessionStorage.removeItem('lumiqe-analysis-photo');
            }
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        if (activeTab !== 'overview' && !completeProfile && !profileLoading) {
            setProfileLoading(true);
            const baseSeason = season.replace(' (Neutral Flow)', '');
            apiFetch(`/api/complete-profile?season=${encodeURIComponent(baseSeason)}`, {}, session)
                .then((r) => r.json())
                .then((data) => setCompleteProfile(data as CompleteProfile))
                .catch(() => setCompleteProfile(null))
                .finally(() => setProfileLoading(false));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    const stats = [
        { label: 'Undertone',  value: undertone,                          bar: getStatBar('undertone', undertone) },
        { label: 'Confidence', value: `${Math.round(confidence * 100)}%`, bar: Math.round(confidence * 100) },
        { label: 'Contrast',   value: contrastLevel,                      bar: getStatBar('contrast', contrastLevel) },
        { label: 'Metal',      value: metal,                              bar: getStatBar('metal', metal) },
    ];

    return (
        <AppLayout>
            {/* ── Full-bleed hero ── negative margins to escape AppLayout padding */}
            <div className="-mx-4 sm:-mx-6 lg:-mx-10 -mt-8 relative h-[650px] md:h-[870px] overflow-hidden">
                {/* Background */}
                {photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoUrl} alt="Your photo" className="absolute inset-0 w-full h-full object-cover grayscale-[0.2]" />
                ) : (
                    <div
                        className="absolute inset-0"
                        style={{
                            background: `radial-gradient(ellipse at 70% 50%, ${hexColor}28 0%, transparent 65%),
                                         linear-gradient(135deg, #09090B 55%, ${hexColor}18 100%)`,
                        }}
                    />
                )}
                {/* Gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

                {/* Hero content */}
                <div className="relative z-10 h-full flex flex-col justify-center px-6 sm:px-10 lg:px-16 max-w-3xl">
                    <Link
                        href={backHref}
                        className="inline-flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors mb-10 group w-fit"
                    >
                        <span className="material-symbols-outlined text-base group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
                        <span className="text-xs font-label font-medium">{backLabel}</span>
                    </Link>

                    <div className="flex items-center gap-3 mb-5">
                        <div className="h-[1px] w-10 bg-primary" />
                        <span className="font-label text-[10px] tracking-[0.4em] uppercase text-primary">Your Seasonal DNA</span>
                    </div>

                    <h1 className="font-display italic text-7xl md:text-9xl text-on-surface leading-[0.9] tracking-tighter mb-6">
                        {season}
                    </h1>

                    {description && (
                        <p className="text-on-surface-variant text-base md:text-lg leading-relaxed max-w-lg mb-10">
                            {description}
                        </p>
                    )}

                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => setActiveTab('wardrobe')}
                            className="bg-primary-container text-on-primary px-7 py-3.5 font-headline font-bold text-xs uppercase tracking-widest rounded-[10px] hover:opacity-90 transition-opacity"
                        >
                            View Wardrobe Guide
                        </button>
                        <button
                            onClick={() => setActiveTab('overview')}
                            className="font-headline font-bold text-xs uppercase tracking-widest rounded-[10px] px-7 py-3.5 hover:bg-white/10 transition-all text-on-surface"
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '0.5px solid rgba(196,151,62,0.2)',
                                backdropFilter: 'blur(16px)',
                            }}
                        >
                            Full Analysis
                        </button>
                    </div>
                </div>

                {/* Signature swatch — bottom right */}
                <div className="absolute bottom-10 right-6 sm:right-12 flex flex-col items-end gap-2 z-20">
                    <div
                        className="w-28 h-40 md:w-32 md:h-48 rounded-2xl shadow-2xl relative overflow-hidden"
                        style={{ backgroundColor: hexColor }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        <div className="absolute bottom-4 left-4">
                            <span className="font-mono text-[9px] text-white/70 block">SIG COLOR</span>
                            <span className="font-headline font-bold text-white text-xs uppercase">{hexColor}</span>
                        </div>
                    </div>
                    <span className="font-label text-[8px] tracking-widest text-on-surface-variant/50 uppercase">
                        Primary Seasonal Anchor
                    </span>
                </div>
            </div>

            {/* ── Stats Grid — overlaps hero bottom ── */}
            <div className="-mx-4 sm:-mx-6 lg:-mx-10 -mt-16 relative z-30 px-4 sm:px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-12 gap-4 mb-16">
                {/* 4 stat cards */}
                <div className="lg:col-span-7 grid grid-cols-2 gap-4">
                    {stats.map((stat) => (
                        <div
                            key={stat.label}
                            className="bg-surface-container/80 p-6 md:p-8 rounded-3xl"
                            style={{ backdropFilter: 'blur(16px)', border: '0.5px solid rgba(196,151,62,0.2)' }}
                        >
                            <span className="font-mono text-[10px] text-primary block mb-2 uppercase">{stat.label}</span>
                            <div className="text-2xl md:text-4xl font-headline font-light text-on-surface mb-3 capitalize truncate">
                                {stat.value}
                            </div>
                            <div className="w-full bg-surface-container-high h-1 rounded-full overflow-hidden">
                                <div
                                    className="bg-primary h-full rounded-full transition-all duration-700"
                                    style={{ width: `${stat.bar}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* AI Editorial Insight */}
                <div
                    className="lg:col-span-5 p-8 md:p-10 rounded-3xl flex flex-col justify-between"
                    style={{
                        background: 'rgba(53,52,55,0.4)',
                        backdropFilter: 'blur(16px)',
                        border: '0.5px solid rgba(196,151,62,0.2)',
                    }}
                >
                    <div>
                        <div className="flex items-center gap-2 mb-5">
                            <span className="material-symbols-outlined text-secondary text-xl">auto_awesome</span>
                            <span className="font-headline font-bold text-[10px] tracking-widest uppercase text-secondary">
                                AI Editorial Insight
                            </span>
                        </div>
                        <h3 className="font-display text-2xl md:text-3xl text-on-surface italic mb-4 leading-snug">
                            &ldquo;{tips}&rdquo;
                        </h3>
                        <p className="text-on-surface-variant text-sm leading-relaxed">
                            Your palette is uniquely yours. Use these tones to highlight your natural coloring and enhance your presence.
                        </p>
                    </div>
                    <div className="mt-8 flex items-center gap-4">
                        <div
                            className="h-10 w-10 rounded-full flex items-center justify-center bg-surface-container-high shrink-0"
                            style={{ border: '0.5px solid rgba(196,151,62,0.2)' }}
                        >
                            <span
                                className="material-symbols-outlined text-primary text-sm"
                                style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                                smart_toy
                            </span>
                        </div>
                        <div>
                            <span className="block font-headline font-bold text-[10px] text-on-surface uppercase">LUMIQE AGENT</span>
                            <span className="block font-mono text-[9px] text-on-surface-variant/50 uppercase">Analysis Engine v.4.2</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Account nudge ── */}
            {showAccountNudge && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 bg-gradient-to-r from-primary/10 to-surface-container/60 rounded-2xl px-5 py-3 flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left"
                    style={{ border: '0.5px solid rgba(196,151,62,0.3)' }}
                >
                    <span
                        className="material-symbols-outlined text-xl text-primary shrink-0"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                        auto_awesome
                    </span>
                    <p className="flex-1 text-sm text-on-surface-variant">
                        Create a free account to save your results and get personalized recommendations
                    </p>
                    <Link
                        href="/"
                        className="shrink-0 px-4 py-2 bg-primary-container hover:opacity-90 text-on-primary font-label font-semibold rounded-[10px] transition-all text-sm whitespace-nowrap"
                    >
                        Sign Up Free
                    </Link>
                </motion.div>
            )}

            {/* ── Signature Palette ── */}
            <div className="mb-16">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <span className="font-label text-[10px] tracking-[0.3em] uppercase text-on-surface-variant/50 block mb-2">
                            The Spectrum
                        </span>
                        <h2 className="font-headline font-light text-4xl text-on-surface">Signature Palette</h2>
                    </div>
                    {analysisId && (
                        <span className="font-mono text-xs text-primary cursor-pointer hover:underline">Download Pro PDF</span>
                    )}
                </div>
                <div className="flex flex-nowrap overflow-x-auto gap-4 pb-8" style={{ scrollbarWidth: 'none' }}>
                    {palette.map((hex, i) => (
                        <div key={`${hex}-${i}`} className="flex-none w-40">
                            <div
                                className="h-64 w-full rounded-2xl mb-4"
                                style={{ backgroundColor: hex, border: '0.5px solid rgba(196,151,62,0.15)' }}
                            />
                            <span className="block font-headline font-bold text-xs text-on-surface uppercase tracking-tighter">
                                Color {i + 1}
                            </span>
                            <span className="block font-mono text-[9px] text-on-surface-variant/50">{hex.toUpperCase()}</span>
                        </div>
                    ))}
                    {avoidColors.slice(0, 2).map((hex, i) => (
                        <div key={`avoid-${hex}-${i}`} className="flex-none w-40 opacity-40">
                            <div
                                className="h-64 w-full rounded-2xl mb-4 relative overflow-hidden"
                                style={{ backgroundColor: hex, border: '0.5px solid rgba(196,151,62,0.15)' }}
                            >
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-white/80 text-2xl">block</span>
                                </div>
                            </div>
                            <span className="block font-headline font-bold text-xs text-on-surface-variant uppercase tracking-tighter">
                                Avoid
                            </span>
                            <span className="block font-mono text-[9px] text-on-surface-variant/40">{hex.toUpperCase()}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Tab Bar ── */}
            <div
                className="flex overflow-x-auto gap-1 rounded-2xl p-1.5 mb-8 scrollbar-none"
                style={{ background: 'rgba(32,31,34,0.5)', border: '0.5px solid rgba(196,151,62,0.1)' }}
            >
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-label font-semibold transition-all flex-shrink-0 ${
                            activeTab === tab.id
                                ? 'bg-primary-container text-on-surface shadow-lg'
                                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/50'
                        }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── Tab Content ── */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === 'overview' && (
                        <OverviewTab
                            season={season} hexColor={hexColor} undertone={undertone}
                            confidence={confidence} contrastLevel={contrastLevel}
                            palette={palette} avoidColors={avoidColors} metal={metal}
                            tips={tips} celebrities={celebrities} makeup={makeup}
                            analysisId={analysisId} session={session}
                            onChatClick={() => setActiveTab('chat')}
                        />
                    )}

                    {activeTab !== 'overview' && profileLoading && (
                        <div className="flex flex-col items-center justify-center py-32 gap-4">
                            <span
                                className="material-symbols-outlined text-5xl text-primary animate-pulse"
                                style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                                auto_awesome
                            </span>
                            <p className="text-on-surface-variant font-label">Loading your professional profile...</p>
                        </div>
                    )}

                    {activeTab === 'profile' && !profileLoading && completeProfile && (
                        <ColorProfileDeep
                            season={season}
                            styleArchetype={completeProfile.style_archetype}
                            signatureColor={completeProfile.signature_color}
                            value={completeProfile.value}
                            chroma={completeProfile.chroma}
                            contrastLevel={contrastLevel}
                            undertone={undertone}
                            foundationUndertone={completeProfile.foundation_undertone}
                            jewelryGuide={completeProfile.jewelry_guide}
                            colorHarmonies={completeProfile.color_harmonies}
                            patterns={completeProfile.patterns}
                        />
                    )}

                    {activeTab === 'occasions' && !profileLoading && completeProfile && (
                        <OccasionGuide occasions={completeProfile.occasions} season={season} />
                    )}

                    {activeTab === 'wardrobe' && !profileLoading && completeProfile && (
                        <CapsuleWardrobe
                            items={completeProfile.capsule_wardrobe}
                            season={season}
                            wardrobeFormula={completeProfile.wardrobe_formula}
                        />
                    )}

                    {activeTab === 'beauty' && !profileLoading && completeProfile && (
                        <HairAndBeautyGuide
                            season={season}
                            hairColors={completeProfile.hair_colors}
                            makeupExtended={completeProfile.makeup_extended}
                            makeupBase={makeup}
                        />
                    )}

                    {activeTab === 'chat' && (
                        <AIStylistChat
                            season={season}
                            undertone={undertone}
                            contrastLevel={contrastLevel}
                            styleArchetype={completeProfile?.style_archetype ?? ''}
                            signatureColorName={completeProfile?.signature_color?.name ?? ''}
                            metal={metal}
                        />
                    )}
                </motion.div>
            </AnimatePresence>
        </AppLayout>
    );
}
