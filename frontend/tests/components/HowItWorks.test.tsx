import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HowItWorks from '../../src/components/HowItWorks';

describe('HowItWorks Component', () => {
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
});
