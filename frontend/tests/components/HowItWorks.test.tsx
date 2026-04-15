import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import HowItWorks from '../../src/components/HowItWorks';

// Mock localStorage so Zustand's persist middleware works in jsdom
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => { store[key] = value; },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { store = {}; },
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });

// Mock the i18n hook directly so we control the language
vi.mock('../../src/lib/hooks/useTranslation', () => ({
    useTranslation: vi.fn(() => ({
        lang: 'en',
        t: (key: string) => {
            const en: Record<string, string> = {
                howItWorksTitle: 'How It Works',
                howItWorksSubtitle: 'Science meets style. A simple three-step process built on rigorous color theory.',
                howItWorksStep1Title: 'Upload a Selfie',
                howItWorksStep1Desc: 'Snap a well-lit, makeup-free photo facing natural light. We run privacy-first, analyzing the image directly in-memory.',
                howItWorksStep2Title: 'AI Analyzes 100K+ Pixels',
                howItWorksStep2Desc: 'Our custom vision engine extracts your true skin chromaticity, isolating it from shadows and lighting bias.',
                howItWorksStep3Title: 'Get Your Palette',
                howItWorksStep3Desc: 'Discover your color season, metallic matches, and custom shopping recommendations that make you glow.',
            };
            return en[key] ?? key;
        },
    })),
}));

import { useTranslation } from '../../src/lib/hooks/useTranslation';
const mockUseTranslation = vi.mocked(useTranslation);

describe('HowItWorks Component', () => {
    beforeEach(() => {
        // Reset to English
        mockUseTranslation.mockReturnValue({
            lang: 'en',
            t: (key: string) => {
                const en: Record<string, string> = {
                    howItWorksTitle: 'How It Works',
                    howItWorksSubtitle: 'Science meets style. A simple three-step process built on rigorous color theory.',
                    howItWorksStep1Title: 'Upload a Selfie',
                    howItWorksStep1Desc: 'Snap a well-lit, makeup-free photo facing natural light. We run privacy-first, analyzing the image directly in-memory.',
                    howItWorksStep2Title: 'AI Analyzes 100K+ Pixels',
                    howItWorksStep2Desc: 'Our custom vision engine extracts your true skin chromaticity, isolating it from shadows and lighting bias.',
                    howItWorksStep3Title: 'Get Your Palette',
                    howItWorksStep3Desc: 'Discover your color season, metallic matches, and custom shopping recommendations that make you glow.',
                };
                return en[key] ?? key;
            },
        });
    });

    it('renders section title', () => {
        render(<HowItWorks />);
        expect(screen.getByText(/How It Works/i)).toBeInTheDocument();
    });

    it('renders all three steps', () => {
        render(<HowItWorks />);
        expect(screen.getByText(/Upload a Selfie/i)).toBeInTheDocument();
        expect(screen.getByText(/AI Analyzes 100K\+ Pixels/i)).toBeInTheDocument();
        expect(screen.getByText(/Get Your Palette/i)).toBeInTheDocument();
    });

    it('renders step descriptions', () => {
        render(<HowItWorks />);
        expect(screen.getByText(/Snap a well-lit/i)).toBeInTheDocument();
        expect(screen.getByText(/Our custom vision engine/i)).toBeInTheDocument();
        expect(screen.getByText(/Discover your color season/i)).toBeInTheDocument();
    });

    it('renders translated text when language is Spanish', () => {
        mockUseTranslation.mockReturnValue({
            lang: 'es',
            t: (key: string) => {
                const es: Record<string, string> = {
                    howItWorksTitle: 'Cómo Funciona',
                    howItWorksStep1Title: 'Sube una Selfie',
                    howItWorksStep2Title: 'La IA Analiza 100K+ Píxeles',
                    howItWorksStep3Title: 'Obtén Tu Paleta',
                };
                return es[key] ?? key;
            },
        });
        render(<HowItWorks />);
        expect(screen.getByText(/Cómo Funciona/i)).toBeInTheDocument();
        expect(screen.getByText(/Sube una Selfie/i)).toBeInTheDocument();
        expect(screen.getByText(/La IA Analiza 100K\+ Píxeles/i)).toBeInTheDocument();
        expect(screen.getByText(/Obtén Tu Paleta/i)).toBeInTheDocument();
    });

    it('renders translated text when language is Hindi', () => {
        mockUseTranslation.mockReturnValue({
            lang: 'hi',
            t: (key: string) => {
                const hi: Record<string, string> = {
                    howItWorksTitle: 'यह कैसे काम करता है',
                    howItWorksStep1Title: 'सेल्फी अपलोड करें',
                };
                return hi[key] ?? key;
            },
        });
        render(<HowItWorks />);
        expect(screen.getByText('यह कैसे काम करता है')).toBeInTheDocument();
        expect(screen.getByText('सेल्फी अपलोड करें')).toBeInTheDocument();
    });

    it('renders translated text when language is French', () => {
        mockUseTranslation.mockReturnValue({
            lang: 'fr',
            t: (key: string) => {
                const fr: Record<string, string> = {
                    howItWorksTitle: 'Comment ça marche',
                    howItWorksStep1Title: 'Téléchargez un Selfie',
                };
                return fr[key] ?? key;
            },
        });
        render(<HowItWorks />);
        expect(screen.getByText(/Comment ça marche/i)).toBeInTheDocument();
        expect(screen.getByText(/Téléchargez un Selfie/i)).toBeInTheDocument();
    });
});
