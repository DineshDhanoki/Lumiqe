'use client';

import { motion } from 'framer-motion';

interface HairColorData {
    best_natural: string[];
    highlights: string[];
    avoid: string[];
}

interface MakeupExtended {
    foundation: string;
    concealer: string;
    lips_shades: string[];
    eyeliner: string;
    mascara: string;
    brow_color: string;
}

interface HairAndBeautyGuideProps {
    season: string;
    hairColors: HairColorData;
    makeupExtended: MakeupExtended;
    makeupBase: { lips: string; blush: string; eyeshadow: string };
}

export default function HairAndBeautyGuide({
    season,
    hairColors,
    makeupExtended,
    makeupBase,
}: HairAndBeautyGuideProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Editorial header */}
            <div className="mb-2">
                <span className="font-label text-[10px] tracking-[0.3em] uppercase text-on-surface-variant/60 block mb-1">The Beauty Edit</span>
                <h2 className="font-display italic text-4xl text-on-surface">Hair &amp; Beauty</h2>
                <p className="text-on-surface-variant text-sm mt-1">Your complete beauty guide for {season}</p>
            </div>

            {/* Hair Color Guide */}
            <div className="bg-surface-container/50 border border-primary/10 rounded-3xl p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                    <span className="material-symbols-outlined text-secondary text-xl">content_cut</span>
                    <div>
                        <span className="font-label text-[10px] tracking-[0.25em] uppercase text-on-surface-variant/60 block">Atelier Recommendation</span>
                        <p className="text-on-surface font-headline font-bold text-lg leading-tight">Hair Color Guide</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Best Natural */}
                    {hairColors.best_natural?.length > 0 && (
                        <div>
                            <p className="font-label text-[10px] font-bold tracking-[0.25em] uppercase text-on-surface-variant/60 mb-3">Best Natural Shades</p>
                            <div className="flex flex-wrap gap-2">
                                {hairColors.best_natural.map((shade, i) => (
                                    <span key={i} className="flex items-center gap-1.5 text-sm bg-surface-container border border-primary/20 text-on-surface px-3.5 py-1.5 rounded-full font-label">
                                        <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                        {shade}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Highlights */}
                    {hairColors.highlights?.length > 0 && (
                        <div>
                            <p className="font-label text-[10px] font-bold tracking-[0.25em] uppercase text-on-surface-variant/60 mb-3">Highlights &amp; Treatments</p>
                            <div className="flex flex-wrap gap-2">
                                {hairColors.highlights.map((h, i) => (
                                    <span key={i} className="flex items-center gap-1.5 text-sm bg-primary/10 text-primary border border-primary/25 px-3.5 py-1.5 rounded-full font-label">
                                        ✦ {h}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Avoid */}
                    {hairColors.avoid?.length > 0 && (
                        <div>
                            <p className="font-label text-[10px] font-bold tracking-[0.25em] uppercase text-on-surface-variant/40 mb-3">Avoid These</p>
                            <div className="flex flex-wrap gap-2">
                                {hairColors.avoid.map((h, i) => (
                                    <span key={i} className="flex items-center gap-1.5 text-sm bg-surface-container/30 text-on-surface-variant/50 border border-outline-variant/20 px-3.5 py-1.5 rounded-full font-label line-through decoration-on-surface-variant/30">
                                        {h}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Makeup Guide */}
            <div className="bg-surface-container/50 border border-primary/10 rounded-3xl p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                    <span className="material-symbols-outlined text-tertiary text-xl">artist</span>
                    <div>
                        <span className="font-label text-[10px] tracking-[0.25em] uppercase text-on-surface-variant/60 block">Colour Story</span>
                        <p className="text-on-surface font-headline font-bold text-lg leading-tight">Complete Makeup Guide</p>
                    </div>
                </div>

                {/* Hero swatches — editorial horizontal scroll */}
                <div className="flex flex-nowrap overflow-x-auto gap-4 pb-4 scrollbar-hide -mx-1 px-1 mb-8">
                    {[
                        { label: 'Lips', hex: makeupBase.lips },
                        { label: 'Blush', hex: makeupBase.blush },
                        { label: 'Eyes', hex: makeupBase.eyeshadow },
                    ].filter(item => item.hex).map((item, i) => (
                        <div key={i} className="flex-none group cursor-crosshair">
                            <div
                                className="w-24 h-32 rounded-2xl border border-outline-variant/20 shadow-lg group-hover:scale-[1.04] transition-transform duration-300"
                                style={{ backgroundColor: item.hex }}
                            />
                            <span className="block font-headline font-bold text-xs text-on-surface uppercase tracking-tighter mt-2">{item.label}</span>
                            <span className="block font-mono text-[9px] text-on-surface-variant/60 mt-0.5">{item.hex}</span>
                        </div>
                    ))}
                </div>

                {/* Detailed breakdown */}
                <div className="space-y-px rounded-2xl overflow-hidden border border-outline-variant/10">
                    {[
                        { label: 'Foundation', value: makeupExtended.foundation },
                        { label: 'Concealer', value: makeupExtended.concealer },
                        { label: 'Eyeliner', value: makeupExtended.eyeliner },
                        { label: 'Mascara', value: makeupExtended.mascara },
                        { label: 'Brow Color', value: makeupExtended.brow_color },
                    ].filter(item => item.value).map((item, i) => (
                        <div key={i} className="flex items-start gap-4 bg-surface-container/30 px-4 py-3 border-b border-outline-variant/10 last:border-0">
                            <p className="text-on-surface-variant font-label text-[10px] font-bold uppercase tracking-widest w-24 flex-shrink-0 pt-0.5">{item.label}</p>
                            <p className="text-on-surface text-sm leading-relaxed">{item.value}</p>
                        </div>
                    ))}
                </div>

                {/* Lip shades */}
                {makeupExtended.lips_shades?.length > 0 && (
                    <div className="mt-5 pt-5 border-t border-primary/10">
                        <p className="font-label text-[10px] font-bold tracking-[0.25em] uppercase text-on-surface-variant/60 mb-3">Lip Shade Spectrum</p>
                        <div className="flex flex-wrap gap-2">
                            {makeupExtended.lips_shades.map((shade, i) => (
                                <span key={i} className="text-xs bg-surface-container/50 text-on-surface-variant border border-outline-variant/20 px-3 py-1.5 rounded-full font-label">
                                    {shade}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
