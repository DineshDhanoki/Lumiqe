'use client';

import Link from 'next/link';

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
                    <span className="material-symbols-outlined text-primary text-4xl sm:text-5xl mb-4 sm:mb-6" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
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
                        <a href="#" aria-label="Twitter/X" className="w-11 h-11 rounded-full bg-surface-container/50 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                            </a>
                            <a href="#" aria-label="Instagram" className="w-11 h-11 rounded-full bg-surface-container/50 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors">
                                <span className="material-symbols-outlined text-base">photo_camera</span>
                            </a>
                            <a href="#" aria-label="GitHub" className="w-11 h-11 rounded-full bg-surface-container/50 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
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
