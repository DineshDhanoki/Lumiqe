'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useTranslation } from '@/lib/hooks/useTranslation';

export default function AppMenu() {
    const { t } = useTranslation();
    const { data: session, status } = useSession();
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const menuLinks = [
        { name: t('menuDashboard'), href: '/dashboard', icon: 'dashboard' },
        { name: t('menuScanner'), href: '/scan', icon: 'photo_camera' },
        { name: t('menuShopColors'), href: '/feed', icon: 'shopping_bag' },
        { name: 'Price Alerts', href: '/price-alerts', icon: 'notifications' },
        { name: t('menuAccount'), href: '/account', icon: 'person' },
        ...(session?.isAdmin ? [{ name: t('menuAdminPanel'), href: '/admin', icon: 'admin_panel_settings' }] : []),
    ];

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        if (open) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    if (status !== 'authenticated') return null;

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setOpen(!open)}
                className="p-2 rounded-full bg-surface-container/50 hover:bg-surface-container transition border border-outline-variant/20 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label={open ? t('navCloseMenu') : t('navOpenMenu')}
                aria-expanded={open}
            >
                        {open ? <span className="material-symbols-outlined text-xl text-on-surface">close</span> : <span className="material-symbols-outlined text-xl text-on-surface">menu</span>}
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-surface backdrop-blur-xl border border-primary/10 rounded-2xl shadow-2xl py-2 z-[100]">
                    {menuLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-on-surface hover:text-on-surface hover:bg-surface-container/50 transition-colors"
                        >
                            <span className="material-symbols-outlined text-base text-on-surface-variant">{link.icon}</span>
                            {link.name}
                        </Link>
                    ))}
                    <div className="h-px bg-primary/10 my-1" />
                    <button
                        onClick={() => { setOpen(false); signOut({ callbackUrl: '/' }); }}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-on-surface-variant hover:text-primary hover:bg-surface-container/30 transition-colors w-full"
                    >
                        <span className="material-symbols-outlined text-base">logout</span>
                        {t('menuLogOut')}
                    </button>
                </div>
            )}
        </div>
    );
}
