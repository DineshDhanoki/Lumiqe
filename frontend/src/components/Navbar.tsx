'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { Sparkles, Menu, X, Crown, User, LogOut } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import SignInModal from './SignInModal';

export default function Navbar() {
    const { data: session, status } = useSession();
    const { scrollY } = useScroll();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const isPremium = !!session?.isPremium;

    useMotionValueEvent(scrollY, 'change', (latest) => {
        setIsScrolled(latest > 50);
    });

    const navLinks = [
        { name: 'How It Works', href: '#how-it-works' },
        { name: 'Features', href: '#features' },
        { name: 'Dashboard', href: '/dashboard' },
        { name: 'Scanner', href: '/scan' },
        { name: 'Pricing', href: '#pricing' },
    ];

    return (
        <>
            <motion.nav
                role="navigation"
                aria-label="Main navigation"
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
                    ? 'bg-black/80 backdrop-blur-lg border-b border-white/10 py-3'
                    : 'bg-transparent py-5'
                    }`}
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <Sparkles className="w-6 h-6 text-red-400 group-hover:text-red-300 transition-colors" />
                        <span className="text-xl font-bold tracking-wider text-white">LUMIQE</span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className="text-sm font-medium text-white/70 hover:text-white transition-colors"
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    {/* Desktop Auth */}
                    <div className="hidden md:flex items-center gap-4">
                        {status === 'authenticated' ? (
                            <>
                                <Link
                                    href="/account"
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all border ${isPremium
                                        ? 'bg-red-500/10 hover:bg-red-500/20 text-red-100 border-red-500/30'
                                        : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                                        }`}
                                >
                                    {isPremium ? <Crown className="w-4 h-4 text-red-400" /> : <User className="w-4 h-4" />}
                                    <span className="text-sm font-bold">Account</span>
                                </Link>
                                <button
                                    onClick={() => signOut({ callbackUrl: '/' })}
                                    className="text-white/50 hover:text-red-400 p-2 transition-colors rounded-full hover:bg-white/5"
                                    title="Log Out"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => setIsModalOpen(true)} className="text-sm font-medium text-white/90 hover:text-white px-4 py-2 transition-colors">
                                    Log In
                                </button>
                                <button onClick={() => setIsModalOpen(true)} className="text-sm font-medium bg-red-600 hover:bg-red-500 text-white px-5 py-2 rounded-full transition-colors shadow-[0_0_15px_-3px_rgba(220,38,38,0.4)]">
                                    Sign Up
                                </button>
                            </>
                        )}
                    </div>

                    {/* Mobile Toggle */}
                    <button
                        className="md:hidden text-white/80 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
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
                        className="md:hidden bg-black/95 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex flex-col gap-4"
                    >
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className="text-base font-medium text-white/80 hover:text-white py-3 min-h-[44px] flex items-center"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                {link.name}
                            </Link>
                        ))}
                        <div className="h-px bg-white/10 my-2" />
                        <div className="flex flex-col gap-3">
                            {status === 'authenticated' ? (
                                <>
                                    <Link
                                        href="/account"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-full border ${isPremium
                                            ? 'bg-red-500/10 text-red-100 border-red-500/30'
                                            : 'bg-white/10 text-white border-white/20'
                                            }`}
                                    >
                                        {isPremium ? <Crown className="w-4 h-4 text-red-400" /> : <User className="w-4 h-4" />}
                                        <span className="text-base font-bold">Account</span>
                                    </Link>
                                    <button
                                        onClick={() => signOut({ callbackUrl: '/' })}
                                        className="flex items-center justify-center gap-2 text-base font-medium text-white/50 hover:text-red-400 w-full py-2"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Log Out
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => { setIsMobileMenuOpen(false); setIsModalOpen(true); }} className="text-base font-medium text-white w-full py-2 text-left">
                                        Log In
                                    </button>
                                    <button onClick={() => { setIsMobileMenuOpen(false); setIsModalOpen(true); }} className="text-base font-medium bg-red-600 text-white w-full py-2 rounded-full text-center">
                                        Sign Up
                                    </button>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </motion.nav>

            {/* Sign In / Sign Up Modal */}
            <SignInModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </>
    );
}
