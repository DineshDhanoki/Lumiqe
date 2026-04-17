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
        { label: 'Scan New', icon: 'photo_camera', href: '/analyze' },
        { label: 'AI Remix', icon: 'auto_fix_high', href: aiStylistHref },
        { label: 'Planner', icon: 'calendar_today', href: '/wardrobe' },
        { label: 'Wishlist', icon: 'shopping_bag', href: '/wishlist' },
    ];

    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-on-surface-variant/40 mb-4 px-2">{t('quickActions')}</p>
            <div className="grid grid-cols-2 gap-4">
                {actions.map((action) => (
                    <Link
                        key={action.label}
                        href={action.href}
                        className="flex flex-col items-center justify-center aspect-square bg-surface-container-low rounded-3xl hover:bg-surface-container transition-all border border-white/5 group"
                    >
                        <span className="material-symbols-outlined text-primary text-3xl mb-3 transition-transform group-hover:scale-110">{action.icon}</span>
                        <span className="text-[10px] font-headline uppercase tracking-widest text-on-surface">{action.label}</span>
                    </Link>
                ))}
            </div>
        </motion.div>
    );
}
