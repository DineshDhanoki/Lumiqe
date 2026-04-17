import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Pricing from '../../src/components/Pricing';

describe('Pricing Component', () => {
    it('renders free and premium plan headings', () => {
        render(<Pricing />);
        expect(screen.getByRole('heading', { name: 'Free Tier' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Pro Tier' })).toBeInTheDocument();
    });

    it('renders the annual price by default', () => {
        render(<Pricing />);
        // isAnnual defaults to true → shows $23
        expect(screen.getByText('$23')).toBeInTheDocument();
    });

    it('shows monthly and annual toggle', () => {
        render(<Pricing />);
        expect(screen.getByText('Monthly')).toBeInTheDocument();
        expect(screen.getByText('Annual')).toBeInTheDocument();
    });

    it('renders upgrade button', () => {
        render(<Pricing />);
        expect(screen.getByText(/Upgrade to Elite/i)).toBeInTheDocument();
    });

    it('renders free plan CTA', () => {
        render(<Pricing />);
        expect(screen.getByText(/Begin Journey/i)).toBeInTheDocument();
    });

    it('renders "Most Coveted" badge on premium', () => {
        render(<Pricing />);
        expect(screen.getByText(/Most Coveted/i)).toBeInTheDocument();
    });
});
