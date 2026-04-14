'use client';

import { motion } from 'framer-motion';
import { Scissors, CheckCircle2, XCircle } from 'lucide-react';

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
            <div className="text-center mb-6">
                <h2 className="font-headline text-3xl font-bold text-on-surface mb-2">Hair & Beauty</h2>
                <p className="text-on-surface-variant">Your complete beauty guide for {season}</p>
            </div>

            {/* Hair Colors */}
            <div className="bg-surface-container/50 border border-primary/10 rounded-3xl p-6">
                <div className="flex items-center gap-2 mb-5">
                    <Scissors className="w-5 h-5 text-secondary" />
                    <p className="text-on-surface font-bold text-lg">Hair Color Guide</p>
                </div>

                <div className="space-y-5">
                    {/* Best Natural */}
                    <div>
                        <p className="text-green-400 text-xs font-bold uppercase tracking-wider mb-2">Best Natural Shades</p>
                        <div className="flex flex-wrap gap-2">
                            {hairColors.best_natural?.map((shade, i) => (
                                <span key={i} className="flex items-center gap-1.5 text-sm bg-green-500/15 text-green-300 border border-green-500/25 px-3 py-1.5 rounded-full">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    {shade}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Highlights */}
                    <div>
                        <p className="text-yellow-400 text-xs font-bold uppercase tracking-wider mb-2">Highlights & Colour Treatments</p>
                        <div className="flex flex-wrap gap-2">
                            {hairColors.highlights?.map((h, i) => (
                                <span key={i} className="flex items-center gap-1.5 text-sm bg-yellow-500/15 text-yellow-200 border border-yellow-500/25 px-3 py-1.5 rounded-full">
                                    ✦ {h}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Avoid */}
                    <div>
                        <p className="text-primary text-xs font-bold uppercase tracking-wider mb-2">Avoid These</p>
                        <div className="flex flex-wrap gap-2">
                            {hairColors.avoid?.map((h, i) => (
                                <span key={i} className="flex items-center gap-1.5 text-sm bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-full">
                                    <XCircle className="w-3.5 h-3.5" />
                                    {h}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Makeup Guide */}
            <div className="bg-surface-container/50 border border-primary/10 rounded-3xl p-6">
                <p className="text-on-surface font-bold text-lg mb-5">Complete Makeup Guide</p>

                {/* Colour swatches */}
                <div className="flex gap-6 justify-center mb-6">
                    {[
                        { label: 'Lips', hex: makeupBase.lips },
                        { label: 'Blush', hex: makeupBase.blush },
                        { label: 'Eyes', hex: makeupBase.eyeshadow },
                    ].map((item, i) => (
                        <div key={i} className="flex flex-col items-center gap-2">
                            <div
                                className="w-14 h-14 rounded-2xl border border-outline-variant/30 shadow-lg hover:scale-110 transition-transform"
                                style={{ backgroundColor: item.hex }}
                            />
                            <span className="text-on-surface-variant text-xs">{item.label}</span>
                            <span className="text-on-surface-variant/50 text-xs font-mono">{item.hex}</span>
                        </div>
                    ))}
                </div>

                {/* Detailed guide */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                        { label: 'Foundation', value: makeupExtended.foundation },
                        { label: 'Concealer', value: makeupExtended.concealer },
                        { label: 'Eyeliner', value: makeupExtended.eyeliner },
                        { label: 'Mascara', value: makeupExtended.mascara },
                        { label: 'Brow Color', value: makeupExtended.brow_color },
                    ].map((item, i) => (
                        <div key={i} className="bg-surface-container/30 rounded-xl p-3 flex items-start gap-3">
                            <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider w-24 flex-shrink-0 pt-0.5">{item.label}</p>
                            <p className="text-on-surface text-sm">{item.value}</p>
                        </div>
                    ))}

                    {/* Lip shades */}
                    <div className="bg-surface-container/30 rounded-xl p-3">
                        <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-2">Lip Shades</p>
                        <div className="flex flex-wrap gap-1.5">
                            {makeupExtended.lips_shades?.map((shade, i) => (
                                <span key={i} className="text-xs bg-surface-container text-on-surface-variant px-2 py-1 rounded-full">
                                    {shade}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
