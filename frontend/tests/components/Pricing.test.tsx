import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Pricing from '../../src/components/Pricing';

describe('Pricing Component', () => {
    it('renders free and premium plan headings', () => {
        render(<Pricing />);
        expect(screen.getByText('Free')).toBeInTheDocument();
        expect(screen.getByText('Premium')).toBeInTheDocument();
    });

    it('renders the monthly price by default', () => {
        render(<Pricing />);
        expect(screen.getByText(/₹149/)).toBeInTheDocument();
    });

    it('shows monthly and annual toggle', () => {
        render(<Pricing />);
        expect(screen.getByText('Monthly')).toBeInTheDocument();
        expect(screen.getByText('Annual')).toBeInTheDocument();
    });

    it('renders upgrade button', () => {
        render(<Pricing />);
        expect(screen.getByText(/Upgrade to Premium/i)).toBeInTheDocument();
    });

    it('renders free plan CTA', () => {
        render(<Pricing />);
        expect(screen.getByText(/Get Started Free/i)).toBeInTheDocument();
    });

    it('renders "MOST POPULAR" badge on premium', () => {
        render(<Pricing />);
        expect(screen.getByText(/MOST POPULAR/i)).toBeInTheDocument();
    });
});
