import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HowItWorks from '../../src/components/HowItWorks';

describe('HowItWorks Component', () => {
    it('renders section title', () => {
        render(<HowItWorks />);
        expect(screen.getByText(/Precision Engineering/i)).toBeInTheDocument();
    });

    it('renders section label', () => {
        render(<HowItWorks />);
        expect(screen.getByText(/The Process/i)).toBeInTheDocument();
    });

    it('renders all three steps', () => {
        render(<HowItWorks />);
        expect(screen.getByText(/01\. Upload/i)).toBeInTheDocument();
        expect(screen.getByText(/02\. AI Analyzes/i)).toBeInTheDocument();
        expect(screen.getByText(/03\. Discover Palette/i)).toBeInTheDocument();
    });

    it('renders step descriptions', () => {
        render(<HowItWorks />);
        expect(screen.getByText(/natural light selfie/i)).toBeInTheDocument();
        expect(screen.getByText(/thousands of lighting conditions/i)).toBeInTheDocument();
        expect(screen.getByText(/60-color digital lookbook/i)).toBeInTheDocument();
    });
});
