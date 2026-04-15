'use client';

import { motion } from 'framer-motion';

const OCCASION_ICONS: Record<string, string> = {
    work: 'business_center',
    formal: 'wine_bar',
    casual: 'local_cafe',
    date_night: 'favorite',
    beach: 'beach_access',
    wedding_guest: 'local_florist',
    athletic: 'fitness_center',
};

const OCCASION_LABELS: Record<string, string> = {
    work: 'Work & Office',
    formal: 'Formal & Black Tie',
    casual: 'Casual & Weekend',
    date_night: 'Date Night',
    beach: 'Beach & Vacation',
    wedding_guest: 'Wedding Guest',
    athletic: 'Athletic & Active',
};

/** Cycle through accent colors for variety across cards */
const ACCENT_COLORS = [
    'text-primary',
    'text-secondary',
    'text-tertiary',
    'text-primary',
    'text-secondary',
    'text-tertiary',
    'text-primary',
];

interface OccasionData {
    formula: string;
    colors: string[];
    key_pieces: string[];
}

interface OccasionGuideProps {
    occasions: Record<string, OccasionData>;
    season: string;
}

export default function OccasionGuide({ occasions, season }: OccasionGuideProps) {
    const occasionKeys = Object.keys(occasions);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Editorial header */}
            <div className="mb-2">
                <span className="font-label text-[10px] tracking-[0.3em] uppercase text-on-surface-variant/60 block mb-1">The Occasion Edit</span>
                <h2 className="font-display italic text-4xl text-on-surface">Dress the Moment</h2>
                <p className="text-on-surface-variant text-sm mt-1">What to wear for every occasion as a {season}</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {occasionKeys.map((key, i) => {
                    const occasion = occasions[key];
                    const accentClass = ACCENT_COLORS[i % ACCENT_COLORS.length];
                    const iconName = OCCASION_ICONS[key] ?? 'event';
                    const label = OCCASION_LABELS[key] ?? key;

                    return (
                        <motion.div
                            key={key}
                            initial={{ opacity: 0, x: -16 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.06 }}
                            className="bg-surface-container/50 border border-primary/10 rounded-3xl p-6 hover:border-primary/20 transition-colors group"
                        >
                            {/* Header row */}
                            <div className="flex items-start gap-4 mb-5">
                                <div className={`flex-shrink-0 w-10 h-10 rounded-2xl bg-surface-container flex items-center justify-center border border-outline-variant/20 ${accentClass}`}>
                                    <span
                                        className="material-symbols-outlined text-xl"
                                        style={{ fontVariationSettings: "'FILL' 1" }}
                                    >
                                        {iconName}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`font-label text-[10px] font-bold tracking-[0.25em] uppercase mb-0.5 ${accentClass}`}>
                                        {label}
                                    </p>
                                    <p className="text-on-surface font-headline font-semibold text-base leading-snug">
                                        &ldquo;{occasion.formula}&rdquo;
                                    </p>
                                </div>
                            </div>

                            {/* Color palette */}
                            {occasion.colors.length > 0 && (
                                <div className="flex flex-wrap gap-3 mb-4">
                                    {occasion.colors.map((color, ci) => (
                                        <div key={ci} className="group/swatch relative flex flex-col items-center gap-1">
                                            <div
                                                className="w-10 h-10 rounded-full border border-outline-variant/30 shadow-md group-hover/swatch:scale-110 transition-transform duration-200 cursor-crosshair"
                                                style={{ backgroundColor: color }}
                                            />
                                            <span className="text-[9px] text-on-surface-variant/50 font-mono">{color}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Key pieces */}
                            {occasion.key_pieces.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-3 border-t border-outline-variant/10">
                                    {occasion.key_pieces.map((piece, pi) => (
                                        <span
                                            key={pi}
                                            className="flex items-center gap-1 text-xs bg-surface-container/30 text-on-surface-variant border border-outline-variant/15 px-3 py-1.5 rounded-full font-label"
                                        >
                                            <span className="material-symbols-outlined text-[11px] text-primary/60" style={{ fontVariationSettings: "'FILL' 1" }}>
                                                check_circle
                                            </span>
                                            {piece}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
}
