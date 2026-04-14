'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { Sparkles, Menu, X, Crown, User, LogOut, Shield } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import SignInModal from './SignInModal';
import NotificationBell from './NotificationBell';
import { useTranslation } from '@/lib/hooks/useTranslation';

export default function Navbar() {
    const { t } = useTranslation();
    const { data: session, status } = useSession();
    const { scrollY } = useScroll();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalDefaultSignUp, setModalDefaultSignUp] = useState(false);

    const openLogin = () => { setModalDefaultSignUp(false); setIsModalOpen(true); };
    const openSignUp = () => { setModalDefaultSignUp(true); setIsModalOpen(true); };

    const isPremium = !!session?.isPremium;

    useMotionValueEvent(scrollY, 'change', (latest) => {
        setIsScrolled(latest > 50);
    });

    const navLinks = [
        { name: t('navHowItWorks'), href: '#how-it-works' },
        { name: t('navFeatures'), href: '#features' },
        { name: t('navDashboard'), href: '/dashboard' },
        { name: t('navScanner'), href: '/scan' },
        { name: t('navPricing'), href: '#pricing' },
    ];

    return (
        <>
            <motion.nav
                role="navigation"
                aria-label="Main navigation"
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
                    ? 'bg-background/80 backdrop-blur-lg border-b border-primary/10 py-3'
                    : 'bg-transparent py-5'
                    }`}
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <span className="font-display text-2xl font-bold tracking-tighter text-primary-container group-hover:text-primary transition-colors">LUMIQE</span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors"
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    {/* Desktop Auth */}
                    <div className="hidden md:flex items-center gap-4">
                        {status === 'authenticated' ? (
                            <>
                                <NotificationBell />
                                <Link
                                    href="/account"
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all border ${isPremium
                                        ? 'bg-primary/10 hover:bg-primary/20 text-primary border-primary/30'
                                        : 'bg-surface-container/50 hover:bg-surface-container text-on-surface border-outline-variant/20'
                                        }`}
                                >
                                    {isPremium ? <Crown className="w-4 h-4 text-primary" /> : <User className="w-4 h-4" />}
                                    <span className="text-sm font-label font-bold">{t('navAccount')}</span>
                                </Link>
                                {session?.isAdmin && (
                                    <Link
                                        href="/admin"
                                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/30 transition-all"
                                    >
                                        <Shield className="w-4 h-4" />
                                        <span className="text-sm font-label font-bold">Admin</span>
                                    </Link>
                                )}
                                <button
                                    onClick={() => signOut({ callbackUrl: '/' })}
                                    className="text-on-surface-variant/50 hover:text-tertiary p-2 transition-colors rounded-full hover:bg-surface-container/30"
                                    title={t('logOut')}
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </>
                        ) : (
                            <>
                                <button onClick={openLogin} className="text-sm font-label font-medium text-on-surface-variant hover:text-on-surface px-4 py-2 transition-colors">
                                    {t('navLogIn')}
                                </button>
                                <button onClick={openSignUp} className="text-sm font-label font-bold bg-primary-container hover:bg-primary text-on-primary-container px-5 py-2 rounded-full transition-colors">
                                    {t('navSignUp')}
                                </button>
                            </>
                        )}
                    </div>

                    {/* Mobile Toggle */}
                    <button
                        className="md:hidden text-on-surface-variant p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label={isMobileMenuOpen ? t('navCloseMenu') : t('navOpenMenu')}
                        aria-expanded={isMobileMenuOpen}
                    >
                        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="md:hidden bg-surface backdrop-blur-xl border-b border-primary/10 px-6 py-4 flex flex-col gap-4"
                    >
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="text-base font-medium text-on-surface-variant hover:text-on-surface py-3 min-h-[44px] flex items-center"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                {link.name}
                            </Link>
                        ))}
                        <div className="h-px bg-primary/10 my-2" />
                        <div className="flex flex-col gap-3">
                            {status === 'authenticated' ? (
                                <>
                                    <div className="flex justify-center">
                                        <NotificationBell />
                                    </div>
                                    <Link
                                        href="/account"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-full border ${isPremium
                                            ? 'bg-primary/10 text-primary border-primary/30'
                                            : 'bg-surface-container/50 text-on-surface border-outline-variant/30'
                                            }`}
                                    >
                                        {isPremium ? <Crown className="w-4 h-4 text-primary" /> : <User className="w-4 h-4" />}
                                        <span className="text-base font-bold">{t('navAccount')}</span>
                                    </Link>
                                    {session?.isAdmin && (
                                        <Link
                                            href="/admin"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-full bg-secondary/10 text-secondary border border-secondary/30"
                                        >
                                            <Shield className="w-4 h-4" />
                                            <span className="text-base font-bold">Admin</span>
                                        </Link>
                                    )}
                                    <button
                                        onClick={() => signOut({ callbackUrl: '/' })}
                                        className="flex items-center justify-center gap-2 text-base font-medium text-on-surface-variant hover:text-primary w-full py-2"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        {t('logOut')}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => { setIsMobileMenuOpen(false); openLogin(); }} className="text-base font-medium text-on-surface-variant w-full py-2 text-left">
                                        {t('navLogIn')}
                                    </button>
                                    <button onClick={() => { setIsMobileMenuOpen(false); openSignUp(); }} className="text-base font-medium bg-primary-container text-on-primary-container w-full py-2 rounded-full text-center">
                                        {t('navSignUp')}
                                    </button>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </motion.nav>

            {/* Sign In / Sign Up Modal */}
            <SignInModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} defaultSignUp={modalDefaultSignUp} />
        </>
    );
}
