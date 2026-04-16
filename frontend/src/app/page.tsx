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

      {/* Stats Bar */}
      <ScrollReveal delay={0.1}>
        <section className="px-6">
          <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 py-12 bg-surface-container-low/50 backdrop-blur-sm rounded-2xl border border-outline-variant/10">
            <div className="text-center px-8 border-b md:border-b-0 md:border-r border-outline-variant/20 pb-8 md:pb-0">
              <p className="text-4xl font-headline font-extrabold text-primary mb-1">50K+</p>
              <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant">Active Global Users</p>
            </div>
            <div className="text-center px-8 border-b md:border-b-0 md:border-r border-outline-variant/20 pb-8 md:pb-0">
              <p className="text-4xl font-headline font-extrabold text-primary mb-1">12</p>
              <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant">Seasonal Profiles</p>
            </div>
            <div className="text-center px-8">
              <p className="text-4xl font-headline font-extrabold text-primary mb-1">98%</p>
              <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant">Analysis Accuracy</p>
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
