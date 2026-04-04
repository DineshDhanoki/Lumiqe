'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, Layers, ArrowRight, MessageCircle, Share2, Copy, Check } from 'lucide-react';
import { type Session } from 'next-auth';
import SkinProfileCard from '@/components/SkinProfileCard';
import BestAvoidColors from '@/components/BestAvoidColors';
import CelebrityMatch from '@/components/CelebrityMatch';
import PaletteDownload from '@/components/PaletteDownload';
import StylingTips from '@/components/StylingTips';
import ShareButtons from '@/components/ShareButtons';
import ShopYourColors from '@/components/ShopYourColors';
import { useTranslation } from '@/lib/hooks/useTranslation';

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
    if (s < 0.12) {
        if (l < 0.25) return ['Black blazer', 'Charcoal trousers', 'Dark knit'];
        if (l < 0.5) return ['Grey sweater', 'Slate chinos', 'Flannel shirt'];
        if (l < 0.75) return ['Beige cardigan', 'Khaki pants', 'Linen shirt'];
        return ['White tee', 'Cream blouse', 'Ivory jacket'];
    }
    if (h < 30) return ['Rust blazer', 'Terracotta shirt', 'Burgundy knit'];
    if (h < 60) return ['Mustard sweater', 'Camel coat', 'Amber scarf'];
    if (h < 90) return ['Olive jacket', 'Chartreuse tee', 'Lime accent'];
    if (h < 150) return ['Forest green shirt', 'Sage trousers', 'Emerald knit'];
    if (h < 210) return ['Teal blouse', 'Cyan polo', 'Aqua dress'];
    if (h < 270) return ['Navy blazer', 'Cobalt shirt', 'Denim jacket'];
    if (h < 330) return ['Plum sweater', 'Lavender shirt', 'Violet scarf'];
    return ['Rose blouse', 'Magenta top', 'Berry cardigan'];
}

interface Props {
    season: string;
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
    analysisId?: string;
    session: Session | null;
    onChatClick: () => void;
}

export default function OverviewTab({
    season, hexColor, undertone, confidence, contrastLevel,
    palette, avoidColors, metal, tips, celebrities, makeup,
    analysisId, session, onChatClick,
}: Props) {
    const { t } = useTranslation();
    const [copied, setCopied] = useState(false);

    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
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
                            onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`I just discovered I'm a ${season}! 🎨 Find your color season at ${window.location.href}`)}`, '_blank')}
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
                <p className="text-white/60 max-w-lg mx-auto mb-6">{t('exploreFullAnalysisDesc')}</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/shopping-agent"
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 px-8 transition-all hover:scale-105"
                    >
                        {t('shopMyColors')} <ArrowRight className="w-5 h-5" />
                    </Link>
                    <button
                        onClick={onChatClick}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold py-4 px-8 transition-all hover:scale-105"
                    >
                        <MessageCircle className="w-5 h-5" /> {t('chatWithAIStylist')}
                    </button>
                </div>
            </div>
        </div>
    );
}
