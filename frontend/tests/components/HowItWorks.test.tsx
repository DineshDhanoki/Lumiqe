import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import HowItWorks from '../../src/components/HowItWorks';
import { useLumiqeStore } from '../../src/lib/store';

describe('HowItWorks Component', () => {
    beforeEach(() => {
        useLumiqeStore.setState({ lang: 'en' });
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
        useLumiqeStore.setState({ lang: 'es' });
        render(<HowItWorks />);
        expect(screen.getByText(/Cómo Funciona/i)).toBeInTheDocument();
        expect(screen.getByText(/Sube una Selfie/i)).toBeInTheDocument();
        expect(screen.getByText(/La IA Analiza 100K\+ Píxeles/i)).toBeInTheDocument();
        expect(screen.getByText(/Obtén Tu Paleta/i)).toBeInTheDocument();
    });

    it('renders translated text when language is Hindi', () => {
        useLumiqeStore.setState({ lang: 'hi' });
        render(<HowItWorks />);
        expect(screen.getByText('यह कैसे काम करता है')).toBeInTheDocument();
        expect(screen.getByText('सेल्फी अपलोड करें')).toBeInTheDocument();
    });

    it('renders translated text when language is French', () => {
        useLumiqeStore.setState({ lang: 'fr' });
        render(<HowItWorks />);
        expect(screen.getByText(/Comment ça marche/i)).toBeInTheDocument();
        expect(screen.getByText(/Téléchargez un Selfie/i)).toBeInTheDocument();
    });
});
