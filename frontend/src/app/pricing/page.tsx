'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Pricing from '@/components/Pricing';
import Footer from '@/components/Footer';
import SignInModal from '@/components/SignInModal';

export default function PricingPage() {
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    return (
        <main className="relative min-h-screen text-on-surface font-body selection:bg-primary/20">
            <Navbar />
            <Pricing onOpenAuth={() => setIsAuthModalOpen(true)} />
            <Footer />
            <SignInModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                callbackUrl="/pricing"
            />
        </main>
    );
}
