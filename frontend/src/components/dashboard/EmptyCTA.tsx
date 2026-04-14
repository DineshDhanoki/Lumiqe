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
            className="bg-primary/5 border border-primary/20 rounded-3xl p-8 text-center"
        >
            <Sparkles className="w-10 h-10 text-primary mx-auto mb-4" />
            <h3 className="font-headline text-2xl font-bold text-on-surface mb-3">{t('startColorJourney')}</h3>
            <p className="text-on-surface-variant max-w-sm mx-auto mb-6">{t('startColorJourneyDesc')}</p>
            <Link
                href="/analyze"
                className="inline-flex items-center gap-2 rounded-full bg-primary-container hover:bg-primary text-on-primary-container font-label font-bold py-3 px-8 transition-all hover:scale-105"
            >
                <Camera className="w-5 h-5" /> {t('scanMyColors')}
            </Link>
        </motion.div>
    );
}
