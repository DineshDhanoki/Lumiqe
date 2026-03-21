'use client';

import { motion } from 'framer-motion';
import { Briefcase, Wine, Coffee, Heart, Waves, Flower2, Dumbbell } from 'lucide-react';

const OCCASION_ICONS: Record<string, React.ReactNode> = {
    work: <Briefcase className="w-5 h-5" />,
    formal: <Wine className="w-5 h-5" />,
    casual: <Coffee className="w-5 h-5" />,
    date_night: <Heart className="w-5 h-5" />,
    beach: <Waves className="w-5 h-5" />,
    wedding_guest: <Flower2 className="w-5 h-5" />,
    athletic: <Dumbbell className="w-5 h-5" />,
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
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">Your Occasion Guide</h2>
                <p className="text-white/50">What to wear for every moment in your life as a {season}</p>
            </div>

            <div className="grid grid-cols-1 gap-5">
                {occasionKeys.map((key, i) => {
                    const occasion = occasions[key];
                    return (
                        <motion.div
                            key={key}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.07 }}
                            className="bg-zinc-900/60 border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-colors"
                        >
                            {/* Header */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-xl bg-white/10 text-white">
                                    {OCCASION_ICONS[key] ?? <Briefcase className="w-5 h-5" />}
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-lg">{OCCASION_LABELS[key] ?? key}</h3>
                                    <p className="text-white/50 text-sm italic">&ldquo;{occasion.formula}&rdquo;</p>
                                </div>
                            </div>

                            {/* Color swatches */}
                            <div className="flex gap-2 mb-4">
                                {occasion.colors.map((color, ci) => (
                                    <div key={ci} className="flex flex-col items-center gap-1">
                                        <div
                                            className="w-10 h-10 rounded-xl border border-white/20 shadow-md"
                                            style={{ backgroundColor: color }}
                                        />
                                        <span className="text-xs text-white/30 font-mono">{color}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Key pieces */}
                            <div className="flex flex-wrap gap-2">
                                {occasion.key_pieces.map((piece, pi) => (
                                    <span
                                        key={pi}
                                        className="text-xs bg-white/10 text-white/70 px-3 py-1.5 rounded-full border border-white/10"
                                    >
                                        {piece}
                                    </span>
                                ))}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
}
