'use client';

import Link from 'next/link';
import { Sparkles, Twitter, Instagram, Github } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-black border-t border-white/10 pt-20 pb-10 px-6 relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-red-900/10 blur-[100px] pointer-events-none" />

            <div className="max-w-7xl mx-auto flex flex-col items-center">
                {/* Call to Action Banner */}
                <div className="w-full rounded-3xl bg-gradient-to-br from-red-600/20 to-red-950/40 border border-red-500/20 p-10 md:p-16 text-center mb-20 relative overflow-hidden flex flex-col items-center">
                    <Sparkles className="w-12 h-12 text-red-400 mb-6" />
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                        Stop Guessing Your Colors.
                    </h2>
                    <p className="text-white/70 max-w-xl mx-auto mb-10 text-lg">
                        Join thousands of users who discovered their true color season and transformed their wardrobe.
                    </p>
                    <button className="rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-lg py-4 px-10 shadow-[0_0_30px_-5px_rgba(220,38,38,0.5)] transition-all">
                        Get Your Palette Now
                    </button>
                </div>

                {/* Footer Links Grid */}
                <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-6 border-b border-white/10 pb-16">
                    <div className="md:col-span-2">
                        <Link href="/" className="flex items-center gap-2 mb-6">
                            <Sparkles className="w-6 h-6 text-red-500" />
                            <span className="text-xl font-bold tracking-wider text-white">LUMIQE</span>
                        </Link>
                        <p className="text-white/50 max-w-sm leading-relaxed mb-6">
                            The world's most precise AI skin tone analysis engine, running directly on your device. Privacy guaranteed.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="w-11 h-11 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="#" className="w-11 h-11 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors">
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a href="#" className="w-11 h-11 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors">
                                <Github className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-6 tracking-wide">Product</h4>
                        <ul className="space-y-1">
                            <li><Link href="#how-it-works" className="text-white/50 hover:text-white transition-colors block py-2 min-h-[44px] flex items-center">How It Works</Link></li>
                            <li><Link href="#features" className="text-white/50 hover:text-white transition-colors block py-2 min-h-[44px] flex items-center">Features</Link></li>
                            <li><Link href="#demo" className="text-white/50 hover:text-white transition-colors block py-2 min-h-[44px] flex items-center">Live Demo</Link></li>
                            <li><Link href="/pricing" className="text-white/50 hover:text-white transition-colors block py-2 min-h-[44px] flex items-center">Pricing</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-6 tracking-wide">Legal</h4>
                        <ul className="space-y-4">
                            <li><Link href="/privacy" className="text-white/50 hover:text-white transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="text-white/50 hover:text-white transition-colors">Terms of Service</Link></li>
                            <li><Link href="/contact" className="text-white/50 hover:text-white transition-colors">Contact Support</Link></li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="w-full flex flex-col md:flex-row items-center justify-between pt-8">
                    <p className="text-white/40 text-sm mb-4 md:mb-0">
                        © {new Date().getFullYear()} Lumiqe. All rights reserved.
                    </p>
                    <div className="flex gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse mt-1" />
                        <p className="text-white/40 text-sm">Servers Operating Normally</p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
