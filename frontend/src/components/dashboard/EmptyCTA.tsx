'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

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
            <span className="material-symbols-outlined text-primary text-5xl mx-auto mb-4 block" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            <h3 className="font-headline text-2xl font-bold text-on-surface mb-3">{t('startColorJourney')}</h3>
            <p className="text-on-surface-variant max-w-sm mx-auto mb-6">{t('startColorJourneyDesc')}</p>
            <Link
                href="/analyze"
                className="inline-flex items-center gap-2 rounded-full bg-primary-container hover:bg-primary text-on-primary-container font-label font-bold py-3 px-8 transition-all hover:scale-105"
            >
                <span className="material-symbols-outlined text-xl">photo_camera</span> {t('scanMyColors')}
            </Link>
        </motion.div>
    );
}
