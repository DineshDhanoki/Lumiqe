'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';

const HowItWorks = dynamic(() => import('../components/HowItWorks'));
const DemoPreview = dynamic(() => import('../components/DemoPreview'));
const Features = dynamic(() => import('../components/Features'));
const Testimonials = dynamic(() => import('../components/Testimonials'));
const FreeTrial = dynamic(() => import('../components/FreeTrial'));
const Pricing = dynamic(() => import('../components/Pricing'));
const Footer = dynamic(() => import('../components/Footer'));
const ScrollReveal = dynamic(() => import('../components/ScrollReveal'));
const SignInModal = dynamic(() => import('../components/SignInModal'), { ssr: false });

export default function Home() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authCallbackUrl, setAuthCallbackUrl] = useState('/analyze');

  const openAuth = (callbackUrl = '/analyze') => {
    setAuthCallbackUrl(callbackUrl);
    setIsAuthModalOpen(true);
  };

  return (
    <main className="relative min-h-screen text-on-surface font-sans selection:bg-primary/20">
      <Navbar />

      <HeroSection onOpenAuth={() => openAuth()} />

      {/* Analytics Counter Banner (Social Proof) */}
      <ScrollReveal delay={0.1}>
        <section className="border-y border-primary/10 bg-surface-container/30 backdrop-blur-md py-8">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <div className="text-center">
              <h4 className="text-2xl sm:text-3xl font-bold text-on-surface mb-1">50K+</h4>
              <p className="text-xs sm:text-sm text-on-surface-variant uppercase tracking-wider">Faces Analyzed</p>
            </div>
            <div className="text-center">
              <h4 className="text-2xl sm:text-3xl font-bold text-on-surface mb-1">12</h4>
              <p className="text-xs sm:text-sm text-on-surface-variant uppercase tracking-wider">Color Seasons</p>
            </div>
            <div className="text-center">
              <h4 className="text-2xl sm:text-3xl font-bold text-on-surface mb-1">&lt; 3s</h4>
              <p className="text-xs sm:text-sm text-on-surface-variant uppercase tracking-wider">Speed</p>
            </div>
            <div className="text-center">
              <h4 className="text-2xl sm:text-3xl font-bold text-on-surface mb-1">100%</h4>
              <p className="text-xs sm:text-sm text-on-surface-variant uppercase tracking-wider">Private</p>
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

      {isAuthModalOpen && (
        <SignInModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          callbackUrl={authCallbackUrl}
        />
      )}
    </main>
  );
}
