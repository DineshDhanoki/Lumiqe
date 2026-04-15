'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

import { useTranslation } from '@/lib/hooks/useTranslation';

interface Props {
    aiStylistHref: string;
}

export default function QuickActions({ aiStylistHref }: Props) {
    const { t } = useTranslation();

    const actions = [
        { label: t('newScan'), icon: <span className="material-symbols-outlined text-xl">photo_camera</span>, href: '/analyze', color: 'bg-primary/10 border-primary/20 hover:bg-primary/20' },
        { label: t('shopColors'), icon: <span className="material-symbols-outlined text-xl">shopping_bag</span>, href: '/shopping-agent', color: 'bg-surface-container/30 border-outline-variant/20 hover:bg-surface-container/50' },
        { label: t('aiStylist'), icon: <span className="material-symbols-outlined text-xl">chat</span>, href: aiStylistHref, color: 'bg-surface-container/30 border-outline-variant/20 hover:bg-surface-container/50' },
        { label: t('buyOrPass'), icon: <span className="material-symbols-outlined text-xl">checkroom</span>, href: '/scan', color: 'bg-surface-container/30 border-outline-variant/20 hover:bg-surface-container/50' },
    ];

    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <p className="text-on-surface-variant text-xs font-label font-bold uppercase tracking-wider mb-4">{t('quickActions')}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {actions.map((action) => (
                    <Link key={action.label} href={action.href}
                        className={`flex flex-col items-center gap-2 p-5 rounded-2xl border text-on-surface-variant hover:text-on-surface transition-all ${action.color}`}>
                        {action.icon}
                        <span className="text-xs font-label font-semibold">{action.label}</span>
                    </Link>
                ))}
            </div>
        </motion.div>
    );
}
