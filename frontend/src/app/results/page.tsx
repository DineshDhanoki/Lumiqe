'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, ArrowRight, ArrowLeft, Layers, LayoutGrid,
    CalendarDays, ShoppingBag, Scissors, MessageCircle
} from 'lucide-react';
import SkinProfileCard from '../../components/SkinProfileCard';
import BestAvoidColors from '../../components/BestAvoidColors';
import CelebrityMatch from '../../components/CelebrityMatch';
import PaletteDownload from '../../components/PaletteDownload';
import StylingTips from '../../components/StylingTips';
import OccasionGuide from '../../components/OccasionGuide';
import CapsuleWardrobe from '../../components/CapsuleWardrobe';
import ColorProfileDeep from '../../components/ColorProfileDeep';
import HairAndBeautyGuide from '../../components/HairAndBeautyGuide';
import AIStylistChat from '../../components/AIStylistChat';
import { apiFetch } from '@/lib/api';

const TABS = [
    { id: 'overview',  label: 'Overview',     icon: <LayoutGrid   className="w-4 h-4" /> },
    { id: 'profile',   label: 'Color Profile', icon: <Sparkles     className="w-4 h-4" /> },
    { id: 'occasions', label: 'Occasions',     icon: <CalendarDays className="w-4 h-4" /> },
    { id: 'wardrobe',  label: 'Wardrobe',      icon: <ShoppingBag  className="w-4 h-4" /> },
    { id: 'beauty',    label: 'Hair & Beauty', icon: <Scissors     className="w-4 h-4" /> },
    { id: 'chat',      label: 'AI Stylist',    icon: <MessageCircle className="w-4 h-4" /> },
];

function ResultsContent() {
    const searchParams = useSearchParams();
    const { data: session } = useSession();
    const [activeTab, setActiveTab] = useState('overview');
    const [completeProfile, setCompleteProfile] = useState<any>(null);
    const [profileLoading, setProfileLoading] = useState(false);

    if (!searchParams.has('season')) {
        return (
            <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-6 text-center">
                <Sparkles className="w-12 h-12 text-red-500 mb-6" />
                <h1 className="text-3xl font-bold text-white mb-4">No Analysis Found</h1>
                <p className="text-white/60 mb-8">Please start from the home page and upload a photo.</p>
                <Link href="/" className="px-6 py-3 bg-red-600 rounded-full text-white font-medium hover:bg-red-500 transition-colors inline-block">
                    Go Back Home
                </Link>
            </div>
        );
    }

    const season       = searchParams.get('season')       || 'Unknown Season';
    const description  = searchParams.get('description')  || '';
    const hexColor     = searchParams.get('hexColor')      || '#000000';
    const undertone    = searchParams.get('undertone')     || 'neutral';
    const confidence   = parseFloat(searchParams.get('confidence') || '0.0');
    const palette      = searchParams.get('palette')?.split(',')      || [];
    const avoidColors  = searchParams.get('avoidColors')?.split(',')  || [];
    const metal        = searchParams.get('metal')        || 'Gold';
    const tips         = searchParams.get('tips')         || '';
    const contrastLevel = searchParams.get('contrastLevel') || 'Medium';

    let celebrities: any[] = [];
    try {
        const s = searchParams.get('celebrities');
        if (s) celebrities = JSON.parse(decodeURIComponent(s));
    } catch { /* ignore */ }

    let makeup = { lips: '', blush: '', eyeshadow: '' };
    try {
        const s = searchParams.get('makeup');
        if (s) makeup = JSON.parse(decodeURIComponent(s));
    } catch { /* ignore */ }

    // Fetch the complete professional profile on first non-overview tab click
    useEffect(() => {
        if (activeTab !== 'overview' && !completeProfile && !profileLoading) {
            setProfileLoading(true);
            const baseSeason = season.replace(' (Neutral Flow)', '');
            apiFetch(`/api/complete-profile?season=${encodeURIComponent(baseSeason)}`, {}, session)
                .then(r => r.json())
                .then(data => setCompleteProfile(data))
                .catch(() => setCompleteProfile(null))
                .finally(() => setProfileLoading(false));
        }
    }, [activeTab]);

    return (
        <main className="min-h-screen bg-transparent text-white font-sans pb-24">
            {/* Nav */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
                <Link href="/" className="text-white/60 hover:text-white transition-colors flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm font-medium">Back to Home</span>
                </Link>
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-red-400" />
                    <span className="text-xl font-bold tracking-widest text-white">LUMIQE</span>
                </div>
            </nav>

            <div className="max-w-4xl mx-auto px-4 pt-28">
                {/* Season Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
                    <p className="text-red-400 text-sm font-bold tracking-widest uppercase mb-3">Your Analysis Complete</p>
                    <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-200 via-rose-300 to-white mb-4">
                        {season}
                    </h1>
                    <p className="text-lg text-white/70 max-w-2xl mx-auto leading-relaxed border-l-2 border-red-500 pl-5 text-left">
                        &ldquo;{description}&rdquo;
                    </p>
                </motion.div>

                {/* Tab Bar */}
                <div className="flex overflow-x-auto gap-1 bg-zinc-900/50 border border-white/10 rounded-2xl p-1.5 mb-8 scrollbar-none">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-1.5 whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex-shrink-0 ${
                                activeTab === tab.id
                                    ? 'bg-red-600 text-white shadow-lg'
                                    : 'text-white/50 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                    >

                        {/* ── OVERVIEW ── */}
                        {activeTab === 'overview' && (
                            <div className="space-y-8">
                                <SkinProfileCard hexColor={hexColor} undertone={undertone} confidence={confidence} />

                                {contrastLevel && (
                                    <div className="flex items-center gap-3 bg-zinc-900/50 border border-white/10 px-5 py-3 rounded-2xl w-fit">
                                        <Layers className="w-5 h-5 text-red-400" />
                                        <span className="text-white/50 text-sm font-semibold uppercase tracking-wider">Contrast Level</span>
                                        <span className="text-white font-bold text-lg">{contrastLevel}</span>
                                    </div>
                                )}

                                {/* Core Palette */}
                                <div className="bg-zinc-900/50 border border-white/10 p-6 md:p-8 rounded-3xl">
                                    <h3 className="text-2xl font-bold text-white mb-6">Your Core Palette</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                                        {palette.map((color, i) => (
                                            <div
                                                key={i}
                                                className="aspect-square rounded-2xl shadow-inner border border-white/10 flex items-end p-2 hover:scale-105 transition-transform"
                                                style={{ backgroundColor: color }}
                                            >
                                                <span className="text-xs font-mono font-bold bg-black/50 text-white px-1.5 py-0.5 rounded backdrop-blur-md w-full text-center truncate">
                                                    {color}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {palette.length > 0 && avoidColors.length > 0 && (
                                    <BestAvoidColors bestColors={palette} avoidColors={avoidColors} />
                                )}

                                {/* Metal + Makeup */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 p-8 rounded-3xl flex flex-col items-center justify-center text-center">
                                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-2xl ${
                                            metal.toLowerCase() === 'gold'
                                                ? 'bg-gradient-to-tr from-yellow-600 via-yellow-400 to-yellow-200 border border-yellow-300'
                                                : 'bg-gradient-to-tr from-stone-400 via-stone-300 to-white border border-stone-200'
                                        }`}>
                                            <Sparkles className={metal.toLowerCase() === 'gold' ? 'text-yellow-800' : 'text-stone-800'} />
                                        </div>
                                        <p className="text-white/50 tracking-wider text-sm font-semibold uppercase mb-2">Best Metal</p>
                                        <h4 className="text-3xl font-bold text-white">{metal}</h4>
                                    </div>

                                    {(makeup.lips || makeup.blush || makeup.eyeshadow) && (
                                        <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 p-8 rounded-3xl">
                                            <p className="text-white/50 tracking-wider text-sm font-semibold uppercase mb-6 text-center">Ideal Makeup Shades</p>
                                            <div className="flex items-center justify-around">
                                                {[{ label: 'Lips', hex: makeup.lips }, { label: 'Blush', hex: makeup.blush }, { label: 'Eyes', hex: makeup.eyeshadow }].map((item, i) =>
                                                    item.hex ? (
                                                        <div key={i} className="flex flex-col items-center gap-2">
                                                            <div className="w-12 h-12 rounded-full border border-white/20 shadow-lg hover:scale-110 transition-transform" style={{ backgroundColor: item.hex }} />
                                                            <span className="text-xs text-white/50">{item.label}</span>
                                                        </div>
                                                    ) : null
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <StylingTips season={season} contrastLevel={contrastLevel} hexCode={hexColor} staticTip={tips} backendToken={session?.backendToken} />
                                {celebrities.length > 0 && <CelebrityMatch celebrities={celebrities} />}
                                <PaletteDownload season={season} backendToken={session?.backendToken} />

                                {/* CTA */}
                                <div className="bg-red-950/30 border border-red-500/30 rounded-3xl p-8 md:p-12 text-center">
                                    <Sparkles className="w-10 h-10 text-red-500 mx-auto mb-4" />
                                    <h3 className="text-2xl font-bold text-white mb-3">Explore your full professional analysis</h3>
                                    <p className="text-white/60 max-w-lg mx-auto mb-6">
                                        Tap the tabs above to unlock your complete color profile, occasion guide, capsule wardrobe, hair & beauty recommendations, and your personal AI stylist.
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                        <Link
                                            href={`/feed?season=${encodeURIComponent(season)}&palette=${encodeURIComponent(palette.join(','))}`}
                                            className="inline-flex items-center justify-center gap-2 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 px-8 transition-all hover:scale-105"
                                        >
                                            Shop My Colors <ArrowRight className="w-5 h-5" />
                                        </Link>
                                        <button
                                            onClick={() => setActiveTab('chat')}
                                            className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold py-4 px-8 transition-all hover:scale-105"
                                        >
                                            <MessageCircle className="w-5 h-5" /> Chat with AI Stylist
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Loading state for profile-data tabs */}
                        {activeTab !== 'overview' && profileLoading && (
                            <div className="flex flex-col items-center justify-center py-32 gap-4">
                                <Sparkles className="w-10 h-10 text-red-500 animate-pulse" />
                                <p className="text-white/50">Loading your professional profile...</p>
                            </div>
                        )}

                        {/* ── COLOR PROFILE ── */}
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

                        {/* ── OCCASIONS ── */}
                        {activeTab === 'occasions' && !profileLoading && completeProfile && (
                            <OccasionGuide occasions={completeProfile.occasions} season={season} />
                        )}

                        {/* ── WARDROBE ── */}
                        {activeTab === 'wardrobe' && !profileLoading && completeProfile && (
                            <CapsuleWardrobe
                                items={completeProfile.capsule_wardrobe}
                                season={season}
                                wardrobeFormula={completeProfile.wardrobe_formula}
                            />
                        )}

                        {/* ── HAIR & BEAUTY ── */}
                        {activeTab === 'beauty' && !profileLoading && completeProfile && (
                            <HairAndBeautyGuide
                                season={season}
                                hairColors={completeProfile.hair_colors}
                                makeupExtended={completeProfile.makeup_extended}
                                makeupBase={makeup}
                            />
                        )}

                        {/* ── AI STYLIST CHAT ── */}
                        {activeTab === 'chat' && (
                            <AIStylistChat
                                season={season}
                                undertone={undertone}
                                contrastLevel={contrastLevel}
                                styleArchetype={completeProfile?.style_archetype ?? ''}
                                signatureColorName={completeProfile?.signature_color?.name ?? ''}
                                metal={metal}
                                backendToken={session?.backendToken}
                            />
                        )}

                    </motion.div>
                </AnimatePresence>
            </div>
        </main>
    );
}

export default function Results() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-transparent flex flex-col items-center justify-center gap-4 text-white/50">
                <Sparkles className="w-8 h-8 text-red-500 animate-pulse" />
                <p>Loading your results...</p>
            </div>
        }>
            <ResultsContent />
        </Suspense>
    );
}
