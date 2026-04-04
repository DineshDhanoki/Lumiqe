'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, ArrowLeft, Layers,
    CalendarDays, ShoppingBag, Scissors, MessageCircle, LayoutGrid,
} from 'lucide-react';
import ColorProfileDeep from './ColorProfileDeep';
import OccasionGuide from './OccasionGuide';
import CapsuleWardrobe from './CapsuleWardrobe';
import HairAndBeautyGuide from './HairAndBeautyGuide';
import AIStylistChat from './AIStylistChat';
import OverviewTab from './results/OverviewTab';
import AppMenu from './AppMenu';
import { apiFetch } from '@/lib/api';
import { useTranslation } from '@/lib/hooks/useTranslation';

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
    { id: 'overview',  label: 'Overview',      icon: <LayoutGrid    className="w-4 h-4" /> },
    { id: 'profile',   label: 'Color Profile',  icon: <Sparkles      className="w-4 h-4" /> },
    { id: 'occasions', label: 'Occasions',      icon: <CalendarDays  className="w-4 h-4" /> },
    { id: 'wardrobe',  label: 'Wardrobe',       icon: <ShoppingBag   className="w-4 h-4" /> },
    { id: 'beauty',    label: 'Hair & Beauty',  icon: <Scissors      className="w-4 h-4" /> },
    { id: 'chat',      label: 'AI Stylist',     icon: <MessageCircle className="w-4 h-4" /> },
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

export default function ResultsView({
    season, description, hexColor, undertone, confidence, contrastLevel,
    palette, avoidColors, metal, tips, celebrities, makeup,
    backHref, backLabel, analysisId, showAccountNudge,
}: ResultsViewProps) {
    const { t } = useTranslation();
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

    return (
        <main className="min-h-screen bg-transparent text-white font-sans pb-24">
            <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
                <Link href={backHref} className="text-white/60 hover:text-white transition-colors flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm font-medium">{backLabel}</span>
                </Link>
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-red-400" />
                    <span className="text-xl font-bold tracking-widest text-white">LUMIQE</span>
                </div>
                <AppMenu />
            </nav>

            <div className="max-w-4xl mx-auto px-4 pt-28">
                {showAccountNudge && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 bg-gradient-to-r from-red-950/60 to-zinc-900/60 border border-red-500/30 rounded-2xl px-5 py-3 flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left"
                    >
                        <Sparkles className="w-5 h-5 text-red-400 shrink-0" />
                        <p className="flex-1 text-sm text-white/80">
                            Create a free account to save your results and get personalized recommendations
                        </p>
                        <Link
                            href="/"
                            className="shrink-0 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-full transition-all text-sm whitespace-nowrap"
                        >
                            Sign Up Free
                        </Link>
                    </motion.div>
                )}

                {/* Season Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
                    {photoUrl && (
                        <div className="flex justify-center mb-6">
                            <div className="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-4 shadow-lg" style={{ borderColor: hexColor }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={photoUrl} alt="Your photo" className="w-full h-full object-cover" />
                            </div>
                        </div>
                    )}
                    <p className="text-red-400 text-sm font-bold tracking-widest uppercase mb-3">{t('yourAnalysisComplete')}</p>
                    <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-200 via-rose-300 to-white mb-4">
                        {season}
                    </h1>
                    {description && (
                        <p className="text-lg text-white/70 max-w-2xl mx-auto leading-relaxed border-l-2 border-red-500 pl-5 text-left">
                            &ldquo;{description}&rdquo;
                        </p>
                    )}
                </motion.div>

                {/* Tab Bar */}
                <div className="flex overflow-x-auto gap-1 bg-zinc-900/50 border border-white/10 rounded-2xl p-1.5 mb-8 scrollbar-none">
                    {TABS.map((tab) => (
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
                                <Sparkles className="w-10 h-10 text-red-500 animate-pulse" />
                                <p className="text-white/50">Loading your professional profile...</p>
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
            </div>
        </main>
    );
}
