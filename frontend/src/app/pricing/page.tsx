'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Pricing from '@/components/Pricing';
import Footer from '@/components/Footer';
import SignInModal from '@/components/SignInModal';

export default function PricingPage() {
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    return (
        <main className="relative min-h-screen text-white font-sans selection:bg-red-900/50">
            <Navbar />
            <div className="pt-20">
                <Pricing onOpenAuth={() => setIsAuthModalOpen(true)} />
            </div>
            <Footer />
            <SignInModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                callbackUrl="/pricing"
            />
        </main>
    );
}
