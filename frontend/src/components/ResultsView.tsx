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
        <AppLayout>
            <div className="max-w-4xl mx-auto">
                {/* Back breadcrumb */}
                <Link href={backHref} className="inline-flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors mb-6 group">
                    <span className="material-symbols-outlined text-base text-on-surface-variant group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
                    <span className="text-sm font-label font-medium">{backLabel}</span>
                </Link>
                {showAccountNudge && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 bg-gradient-to-r from-primary/10 to-surface-container/60 border border-primary/30 rounded-2xl px-5 py-3 flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left"
                    >
                        <span className="material-symbols-outlined text-xl text-primary shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                        <p className="flex-1 text-sm text-on-surface-variant">
                            Create a free account to save your results and get personalized recommendations
                        </p>
                        <Link
                            href="/"
                            className="shrink-0 px-4 py-2 bg-primary-container hover:bg-primary text-on-primary-container font-label font-semibold rounded-full transition-all text-sm whitespace-nowrap"
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
                    <p className="text-primary font-label text-sm font-bold tracking-widest uppercase mb-3">{t('yourAnalysisComplete')}</p>
                    <h1 className="font-display italic text-5xl md:text-6xl tracking-tight text-on-surface mb-4">
                        {season}
                    </h1>
                    {description && (
                        <p className="text-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed border-l-2 border-primary pl-5 text-left">
                            &ldquo;{description}&rdquo;
                        </p>
                    )}
                </motion.div>

                {/* Tab Bar */}
                <div className="flex overflow-x-auto gap-1 bg-surface-container/50 border border-primary/10 rounded-2xl p-1.5 mb-8 scrollbar-none">
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
                                <span className="material-symbols-outlined text-5xl text-primary animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
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
            </div>
        </AppLayout>
    );
}
