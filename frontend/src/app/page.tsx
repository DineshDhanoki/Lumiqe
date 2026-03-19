'use client';

import { useState } from 'react';
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import HowItWorks from '../components/HowItWorks';
import DemoPreview from '../components/DemoPreview';
import Features from '../components/Features';
import Testimonials from '../components/Testimonials';
import FreeTrial from '../components/FreeTrial';
import Footer from '../components/Footer';
import SignInModal from '../components/SignInModal';
import Pricing from '../components/Pricing';
import ScrollReveal from '../components/ScrollReveal';

export default function Home() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authCallbackUrl, setAuthCallbackUrl] = useState('/analyze');

  const openAuth = (callbackUrl = '/analyze') => {
    setAuthCallbackUrl(callbackUrl);
    setIsAuthModalOpen(true);
  };

  return (
    <main className="relative min-h-screen text-white font-sans selection:bg-red-900/50">
      <Navbar />

      <HeroSection onOpenAuth={() => openAuth()} />

      {/* Analytics Counter Banner (Social Proof) */}
      <ScrollReveal delay={0.1}>
        <section className="border-y border-white/10 bg-white/5 backdrop-blur-md py-8">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-white/10">
            <div className="text-center">
              <h4 className="text-3xl font-bold text-white mb-1">50K+</h4>
              <p className="text-sm text-white/50 uppercase tracking-wider">Faces Analyzed</p>
            </div>
            <div className="text-center">
              <h4 className="text-3xl font-bold text-white mb-1">12</h4>
              <p className="text-sm text-white/50 uppercase tracking-wider">Color Seasons</p>
            </div>
            <div className="text-center hidden md:block">
              <h4 className="text-3xl font-bold text-white mb-1">&lt; 3s</h4>
              <p className="text-sm text-white/50 uppercase tracking-wider">Speed</p>
            </div>
            <div className="text-center hidden md:block">
              <h4 className="text-3xl font-bold text-white mb-1">100%</h4>
              <p className="text-sm text-white/50 uppercase tracking-wider">Private</p>
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal delay={0.2}>
        <HowItWorks />
      </ScrollReveal>

      <ScrollReveal delay={0.2}>
        <DemoPreview />
      </ScrollReveal>

      <ScrollReveal delay={0.2}>
        <Features />
      </ScrollReveal>

      <ScrollReveal delay={0.2}>
        <Testimonials />
      </ScrollReveal>

      <ScrollReveal delay={0.2}>
        <Pricing onOpenAuth={() => openAuth('/pricing')} />
      </ScrollReveal>

      <ScrollReveal delay={0.2}>
        <FreeTrial onOpenAuth={() => openAuth()} />
      </ScrollReveal>

      <Footer />

      <SignInModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        callbackUrl={authCallbackUrl}
      />
    </main>
  );
}
