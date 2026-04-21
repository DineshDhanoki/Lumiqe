import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Pricing from '../../src/components/Pricing';

describe('Pricing Component', () => {
    it('renders free and premium plan headings', () => {
        render(<Pricing />);
        expect(screen.getByRole('heading', { name: 'Discovery' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Elite Atelier' })).toBeInTheDocument();
    });

    it('renders section heading', () => {
        render(<Pricing />);
        expect(screen.getByRole('heading', { name: /Invest In Your Aura/i })).toBeInTheDocument();
    });

    it('renders free tier price', () => {
        render(<Pricing />);
        expect(screen.getByText('Free')).toBeInTheDocument();
    });

    it('renders pro tier price', () => {
        render(<Pricing />);
        expect(screen.getByText('$29')).toBeInTheDocument();
        expect(screen.getByText('/one-time')).toBeInTheDocument();
    });

    it('renders upgrade button', () => {
        render(<Pricing />);
        expect(screen.getByText(/Unlock Elite Access/i)).toBeInTheDocument();
    });

    it('renders free plan CTA', () => {
        render(<Pricing />);
        expect(screen.getByText(/Get Started/i)).toBeInTheDocument();
    });

    it('renders "Most Popular" badge on premium', () => {
        render(<Pricing />);
        expect(screen.getByText(/Most Popular/i)).toBeInTheDocument();
    });
});
