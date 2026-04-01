'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

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

import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, ArrowRight, ArrowLeft, Layers, LayoutGrid,
    CalendarDays, ShoppingBag, Scissors, MessageCircle,
    Share2, Copy, Check,
} from 'lucide-react';
import SkinProfileCard from './SkinProfileCard';
import BestAvoidColors from './BestAvoidColors';
import CelebrityMatch from './CelebrityMatch';
import PaletteDownload from './PaletteDownload';
import StylingTips from './StylingTips';
import OccasionGuide from './OccasionGuide';
import CapsuleWardrobe from './CapsuleWardrobe';
import ColorProfileDeep from './ColorProfileDeep';
import HairAndBeautyGuide from './HairAndBeautyGuide';
import AIStylistChat from './AIStylistChat';
import ShareButtons from './ShareButtons';
import ShopYourColors from './ShopYourColors';
import { apiFetch } from '@/lib/api';
import { useTranslation } from '@/lib/hooks/useTranslation';
import AppMenu from './AppMenu';

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
    /** Present for persisted analyses — enables the ShareButtons component */
    analysisId?: string;
    /** Show the "create free account" nudge (anonymous users only) */
    showAccountNudge?: boolean;
}

/** Map a hex color to clothing suggestions based on hue. */
function _getClothingSuggestions(hex: string): string[] {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2 / 255;
    const d = max - min;
    const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1)) / 255;
    let h = 0;
    if (d !== 0) {
        if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
        else if (max === g) h = ((b - r) / d + 2) * 60;
        else h = ((r - g) / d + 4) * 60;
    }
    // Low saturation = neutrals
    if (s < 0.12) {
        if (l < 0.25) return ['Black blazer', 'Charcoal trousers', 'Dark knit'];
        if (l < 0.5) return ['Grey sweater', 'Slate chinos', 'Flannel shirt'];
        if (l < 0.75) return ['Beige cardigan', 'Khaki pants', 'Linen shirt'];
        return ['White tee', 'Cream blouse', 'Ivory jacket'];
    }
    // Warm reds / oranges
    if (h < 30) return ['Rust blazer', 'Terracotta shirt', 'Burgundy knit'];
    if (h < 60) return ['Mustard sweater', 'Camel coat', 'Amber scarf'];
    if (h < 90) return ['Olive jacket', 'Chartreuse tee', 'Lime accent'];
    if (h < 150) return ['Forest green shirt', 'Sage trousers', 'Emerald knit'];
    if (h < 210) return ['Teal blouse', 'Cyan polo', 'Aqua dress'];
    if (h < 270) return ['Navy blazer', 'Cobalt shirt', 'Denim jacket'];
    if (h < 330) return ['Plum sweater', 'Lavender shirt', 'Violet scarf'];
    return ['Rose blouse', 'Magenta top', 'Berry cardigan'];
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
    const [copied, setCopied] = useState(false);
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);

    // Read analysis photo from sessionStorage (set by the analyze page)
    useEffect(() => {
        try {
            const stored = sessionStorage.getItem('lumiqe-analysis-photo');
            if (stored) {
                setPhotoUrl(stored);
                sessionStorage.removeItem('lumiqe-analysis-photo');
            }
        } catch { /* ignore */ }
    }, []);

    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    useEffect(() => {
        if (activeTab !== 'overview' && !completeProfile && !profileLoading) {
            setProfileLoading(true);
            const baseSeason = season.replace(' (Neutral Flow)', '');
            apiFetch(`/api/complete-profile?season=${encodeURIComponent(baseSeason)}`, {}, session)
                .then(r => r.json())
                .then(data => setCompleteProfile(data as CompleteProfile))
                .catch(() => setCompleteProfile(null))
                .finally(() => setProfileLoading(false));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    return (
        <main className="min-h-screen bg-transparent text-white font-sans pb-24">
            {/* Nav */}
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
                {/* Account nudge banner for anonymous users */}
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
                            <div
                                className="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-4 shadow-lg"
                                style={{ borderColor: hexColor }}
                            >
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
                                        <span className="text-white/50 text-sm font-semibold uppercase tracking-wider">{t('contrastLevelLabel')}</span>
                                        <span className="text-white font-bold text-lg">{contrastLevel}</span>
                                    </div>
                                )}

                                {/* Core Palette */}
                                <div className="bg-zinc-900/50 border border-white/10 p-6 md:p-8 rounded-3xl">
                                    <h3 className="text-2xl font-bold text-white mb-6">{t('corePalette')}</h3>
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

                                    {/* Clothing suggestions per color */}
                                    <div className="mt-6 pt-5 border-t border-white/10">
                                        <h4 className="text-sm font-semibold text-white/70 uppercase tracking-widest mb-4">Wear These Colors As</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                            {palette.slice(0, 6).map((color, i) => {
                                                const suggestions = _getClothingSuggestions(color);
                                                return (
                                                    <div key={i} className="flex items-start gap-3 bg-white/[0.03] rounded-xl px-3 py-2.5 border border-white/5">
                                                        <div className="w-6 h-6 rounded-lg shrink-0 mt-0.5 border border-white/10" style={{ backgroundColor: color }} />
                                                        <div className="text-xs text-white/60 leading-relaxed">{suggestions.join(', ')}</div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {palette.length > 0 && avoidColors.length > 0 && (
                                    <BestAvoidColors bestColors={palette} avoidColors={avoidColors} />
                                )}

                                {/* ── Shop Your Colors ── */}
                                <ShopYourColors season={season} palette={palette} />

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
                                        <p className="text-white/50 tracking-wider text-sm font-semibold uppercase mb-2">{t('bestMetal')}</p>
                                        <h4 className="text-3xl font-bold text-white">{metal}</h4>
                                    </div>

                                    {(makeup.lips || makeup.blush || makeup.eyeshadow) && (
                                        <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 p-8 rounded-3xl">
                                            <p className="text-white/50 tracking-wider text-sm font-semibold uppercase mb-6 text-center">{t('idealMakeupShades')}</p>
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

                                <StylingTips season={season} contrastLevel={contrastLevel} hexCode={hexColor} staticTip={tips} />
                                <CelebrityMatch celebrities={celebrities} season={season} />
                                <PaletteDownload season={season} palette={palette} hexColor={hexColor} undertone={undertone} metal={metal} confidence={confidence} />

                                {/* Share */}
                                {analysisId ? (
                                    <ShareButtons analysisId={analysisId} season={season} session={session} />
                                ) : (
                                    <div className="bg-zinc-900/50 border border-white/10 p-6 rounded-3xl">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Share2 className="w-5 h-5 text-red-400" />
                                            <h3 className="text-lg font-bold text-white">{t('shareResults')}</h3>
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                            <button
                                                onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`I just discovered I'm a ${season}! \u{1F3A8} Find your color season at ${window.location.href}`)}`, '_blank')}
                                                className="flex items-center gap-2 px-5 py-3 bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/30 rounded-xl text-sm font-semibold text-[#25D366] transition-all"
                                            >
                                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                                Share on WhatsApp
                                            </button>
                                            <button
                                                onClick={copyLink}
                                                className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-sm font-medium text-white transition-all"
                                            >
                                                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                                {copied ? t('copied') : t('copyLink')}
                                            </button>
                                            <button
                                                onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`I just discovered I'm a ${season}! Find your colors too:`)}&url=${encodeURIComponent(window.location.href)}`, '_blank')}
                                                className="flex items-center gap-2 px-4 py-2.5 bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/20 rounded-xl text-sm font-medium text-sky-300 transition-all"
                                            >
                                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                                                Twitter/X
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* CTA */}
                                <div className="bg-red-950/30 border border-red-500/30 rounded-3xl p-8 md:p-12 text-center">
                                    <Sparkles className="w-10 h-10 text-red-500 mx-auto mb-4" />
                                    <h3 className="text-2xl font-bold text-white mb-3">{t('exploreFullAnalysis')}</h3>
                                    <p className="text-white/60 max-w-lg mx-auto mb-6">
                                        {t('exploreFullAnalysisDesc')}
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                        <Link
                                            href="/shopping-agent"
                                            className="inline-flex items-center justify-center gap-2 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 px-8 transition-all hover:scale-105"
                                        >
                                            {t('shopMyColors')} <ArrowRight className="w-5 h-5" />
                                        </Link>
                                        <button
                                            onClick={() => setActiveTab('chat')}
                                            className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold py-4 px-8 transition-all hover:scale-105"
                                        >
                                            <MessageCircle className="w-5 h-5" /> {t('chatWithAIStylist')}
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
                            />
                        )}

                    </motion.div>
                </AnimatePresence>
            </div>
        </main>
    );
}
