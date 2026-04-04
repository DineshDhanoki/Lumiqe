'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, Camera } from 'lucide-react';
import { useTranslation } from '@/lib/hooks/useTranslation';

export default function EmptyCTA() {
    const { t } = useTranslation();

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-red-950/30 border border-red-500/30 rounded-3xl p-8 text-center"
        >
            <Sparkles className="w-10 h-10 text-red-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-3">{t('startColorJourney')}</h3>
            <p className="text-white/60 max-w-sm mx-auto mb-6">{t('startColorJourneyDesc')}</p>
            <Link
                href="/analyze"
                className="inline-flex items-center gap-2 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-8 transition-all hover:scale-105"
            >
                <Camera className="w-5 h-5" /> {t('scanMyColors')}
            </Link>
        </motion.div>
    );
}
