'use client';

import Link from 'next/link';
import { Sparkles, Twitter, Instagram, Github } from 'lucide-react';
import { useTranslation } from '@/lib/hooks/useTranslation';

export default function Footer() {
    const { t } = useTranslation();

    return (
        <footer className="bg-background border-t border-primary/10 pt-16 md:pt-20 pb-10 px-4 sm:px-6 relative overflow-hidden safe-bottom">
            {/* Background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-primary/5 blur-[100px] pointer-events-none" />

            <div className="max-w-7xl mx-auto flex flex-col items-center">
                {/* Call to Action Banner */}
                <div className="w-full rounded-3xl bg-gradient-to-br from-primary/10 to-surface-container/60 border border-primary/20 p-8 sm:p-10 md:p-16 text-center mb-16 md:mb-20 relative overflow-hidden flex flex-col items-center">
                    <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 text-primary mb-4 sm:mb-6" />
                    <h2 className="font-display text-2xl sm:text-3xl md:text-5xl font-bold text-on-surface mb-4 sm:mb-6 tracking-tight">
                        {t('footerCTA')}
                    </h2>
                    <p className="text-on-surface-variant max-w-xl mx-auto mb-10 text-lg">
                        {t('footerCTADesc')}
                    </p>
                    <button className="rounded-full bg-primary-container hover:bg-primary text-on-primary-container font-label font-bold text-lg py-4 px-10 shadow-[0_0_30px_-5px_rgba(240,191,98,0.3)] transition-all">
                        {t('footerGetPalette')}
                    </button>
                </div>

                {/* Footer Links Grid */}
                <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-6 border-b border-primary/10 pb-16">
                    <div className="md:col-span-2">
                        <Link href="/" className="flex items-center gap-2 mb-6">
                            <span className="font-display text-xl font-bold tracking-wider text-primary-container">LUMIQE</span>
                        </Link>
                        <p className="text-on-surface-variant max-w-sm leading-relaxed mb-6">
                            {t('footerBrandDesc')}
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="w-11 h-11 rounded-full bg-surface-container/50 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="#" className="w-11 h-11 rounded-full bg-surface-container/50 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors">
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a href="#" className="w-11 h-11 rounded-full bg-surface-container/50 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors">
                                <Github className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-on-surface font-label font-bold mb-6 tracking-wide">{t('footerProduct')}</h4>
                        <ul className="space-y-1">
                            <li><Link href="#how-it-works" className="text-on-surface-variant hover:text-on-surface transition-colors block py-2 min-h-[44px] flex items-center">{t('footerHowItWorks')}</Link></li>
                            <li><Link href="#features" className="text-on-surface-variant hover:text-on-surface transition-colors block py-2 min-h-[44px] flex items-center">{t('footerFeatures')}</Link></li>
                            <li><Link href="#demo" className="text-on-surface-variant hover:text-on-surface transition-colors block py-2 min-h-[44px] flex items-center">{t('footerLiveDemo')}</Link></li>
                            <li><Link href="/pricing" className="text-on-surface-variant hover:text-on-surface transition-colors block py-2 min-h-[44px] flex items-center">{t('footerPricing')}</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-on-surface font-label font-bold mb-6 tracking-wide">{t('footerLegal')}</h4>
                        <ul className="space-y-1">
                            <li><Link href="/privacy" className="text-on-surface-variant hover:text-on-surface transition-colors block py-2 min-h-[44px] flex items-center">{t('footerPrivacy')}</Link></li>
                            <li><Link href="/terms" className="text-on-surface-variant hover:text-on-surface transition-colors block py-2 min-h-[44px] flex items-center">{t('footerTerms')}</Link></li>
                            <li><Link href="/contact" className="text-on-surface-variant hover:text-on-surface transition-colors block py-2 min-h-[44px] flex items-center">{t('footerContact')}</Link></li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="w-full flex flex-col md:flex-row items-center justify-between pt-8">
                    <p className="text-on-surface-variant text-sm mb-4 md:mb-0">
                        &copy; {new Date().getFullYear()} {t('footerCopyright')}
                    </p>
                    <div className="flex gap-2">
                        <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse mt-1" />
                        <p className="text-on-surface-variant text-sm">{t('footerStatus')}</p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
