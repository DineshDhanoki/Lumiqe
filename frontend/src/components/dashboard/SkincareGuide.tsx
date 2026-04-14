'use client';

import { motion } from 'framer-motion';
import { Droplets } from 'lucide-react';
import { useTranslation } from '@/lib/hooks/useTranslation';

const SKINCARE: Record<string, { routine: string[]; ingredients: string[]; avoid: string[] }> = {
    warm: {
        routine: [
            'Oil cleanser to remove daily grime',
            'Vitamin C serum for glow',
            'SPF 30+ — warm-toned faces show sun damage easily',
            'Hydrating moisturiser with ceramides',
        ],
        ingredients: ['Vitamin C', 'Retinol', 'Niacinamide', 'Ceramides', 'Rosehip oil'],
        avoid: ['Heavy silicone-based formulas that dull your natural warmth', 'Purple-toned primers'],
    },
    cool: {
        routine: [
            'Gentle foam cleanser',
            'Hyaluronic acid serum for hydration',
            'Broad-spectrum SPF 50',
            'Lightweight gel moisturiser',
        ],
        ingredients: ['Hyaluronic acid', 'Peptides', 'Centella Asiatica', 'Niacinamide', 'Alpha Arbutin'],
        avoid: ['Orange or bronzing products that fight your cool undertone', 'Heavy oils that cause redness'],
    },
    neutral: {
        routine: [
            'Micellar water or balancing cleanser',
            'Antioxidant serum morning',
            'SPF 30+ daily',
            'Barrier repair moisturiser',
        ],
        ingredients: ['Vitamin E', 'Green tea extract', 'Zinc', 'Squalane', 'Peptides'],
        avoid: ['Extremes — overly cooling or warming formulas can throw your balance off'],
    },
};

interface Props {
    undertone: string;
}

export default function SkincareGuide({ undertone }: Props) {
    const { t } = useTranslation();
    const skincare = SKINCARE[undertone] ?? SKINCARE.neutral;

    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <p className="text-on-surface-variant text-xs font-label font-bold uppercase tracking-wider mb-4">{t('skincareGuide')}</p>
            <div className="bg-surface-container/50 border border-primary/10 rounded-3xl p-6 space-y-5">
                <div className="flex items-center gap-2">
                    <Droplets className="w-5 h-5 text-secondary" />
                    <p className="text-on-surface font-label font-bold">Routine for {undertone} undertones</p>
                </div>

                <div>
                    <p className="text-on-surface-variant text-xs font-label font-bold uppercase tracking-wider mb-3">{t('dailyRoutine')}</p>
                    <ol className="space-y-2">
                        {skincare.routine.map((step, i) => (
                            <li key={step} className="flex items-start gap-3 text-sm text-on-surface-variant">
                                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center flex-shrink-0 font-bold mt-0.5">{i + 1}</span>
                                {step}
                            </li>
                        ))}
                    </ol>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <p className="text-tertiary text-xs font-label font-bold uppercase tracking-wider mb-2">{t('keyIngredients')}</p>
                        <div className="flex flex-wrap gap-1.5">
                            {skincare.ingredients.map((ing) => (
                                <span key={ing} className="text-xs bg-tertiary/10 text-tertiary border border-tertiary/20 px-2.5 py-1 rounded-full">
                                    {ing}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div>
                        <p className="text-primary text-xs font-label font-bold uppercase tracking-wider mb-2">{t('avoid')}</p>
                        <ul className="space-y-1">
                            {skincare.avoid.map((item) => (
                                <li key={item} className="text-xs text-on-surface-variant flex items-start gap-1.5">
                                    <span className="text-primary mt-0.5">✕</span>{item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
