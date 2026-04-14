'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Menu, X, LayoutDashboard, ScanLine, ShoppingBag, User, LogOut, Shield, Bell } from 'lucide-react';
import { useTranslation } from '@/lib/hooks/useTranslation';

export default function AppMenu() {
    const { t } = useTranslation();
    const { data: session, status } = useSession();
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const menuLinks = [
        { name: t('menuDashboard'), href: '/dashboard', icon: LayoutDashboard },
        { name: t('menuScanner'), href: '/scan', icon: ScanLine },
        { name: t('menuShopColors'), href: '/feed', icon: ShoppingBag },
        { name: 'Price Alerts', href: '/price-alerts', icon: Bell },
        { name: t('menuAccount'), href: '/account', icon: User },
        ...(session?.isAdmin ? [{ name: t('menuAdminPanel'), href: '/admin', icon: Shield }] : []),
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
                {open ? <X className="w-5 h-5 text-on-surface" /> : <Menu className="w-5 h-5 text-on-surface" />}
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
                            <link.icon className="w-4 h-4 text-on-surface-variant" />
                            {link.name}
                        </Link>
                    ))}
                    <div className="h-px bg-primary/10 my-1" />
                    <button
                        onClick={() => { setOpen(false); signOut({ callbackUrl: '/' }); }}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-on-surface-variant hover:text-primary hover:bg-surface-container/30 transition-colors w-full"
                    >
                        <LogOut className="w-4 h-4" />
                        {t('menuLogOut')}
                    </button>
                </div>
            )}
        </div>
    );
}
