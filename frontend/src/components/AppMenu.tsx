'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Menu, X, LayoutDashboard, ScanLine, ShoppingBag, User, LogOut, Shield } from 'lucide-react';
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
        { name: t('menuAccount'), href: '/account', icon: User },
        ...(session?.isAdmin ? [{ name: 'Admin Panel', href: '/admin', icon: Shield }] : []),
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
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition border border-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label={open ? t('navCloseMenu') : t('navOpenMenu')}
                aria-expanded={open}
            >
                {open ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-black/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl py-2 z-[100]">
                    {menuLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            <link.icon className="w-4 h-4 text-white/50" />
                            {link.name}
                        </Link>
                    ))}
                    <div className="h-px bg-white/10 my-1" />
                    <button
                        onClick={() => { setOpen(false); signOut({ callbackUrl: '/' }); }}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-white/50 hover:text-red-400 hover:bg-white/5 transition-colors w-full"
                    >
                        <LogOut className="w-4 h-4" />
                        {t('menuLogOut')}
                    </button>
                </div>
            )}
        </div>
    );
}
