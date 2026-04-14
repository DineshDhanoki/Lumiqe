'use client';

import { motion } from 'framer-motion';
import { t } from '@/lib/i18n';

interface Props {
    lang: string;
    previewUrl: string | null;
}

export default function AnalyzingSpinner({ lang, previewUrl }: Props) {
    return (
        <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="status"
            aria-live="polite"
            className="flex flex-col items-center gap-6 py-16"
        >
            <div className="relative">
                <div className="absolute inset-0 rounded-full border-t-4 border-primary animate-spin" />
                {previewUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={previewUrl}
                        alt="Scanning"
                        className="w-32 h-32 rounded-full object-cover opacity-50 blur-sm"
                    />
                )}
            </div>
            <div className="text-center">
                <h3 className="text-xl font-semibold text-on-surface animate-pulse">{t(lang, 'analyzing')}</h3>
                <p className="text-sm text-on-surface-variant mt-1">{t(lang, 'analyzingSubtitle')}</p>
            </div>
        </motion.div>
    );
}
