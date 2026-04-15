import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TrialBanner from '../../src/components/TrialBanner';

describe('TrialBanner', () => {
    it('renders nothing when isPremium', () => {
        const { container } = render(
            <TrialBanner trialEndsAt={new Date(Date.now() + 86400000).toISOString()} isPremium={true} />
        );
        expect(container.firstChild).toBeNull();
    });

    it('renders nothing when no trialEndsAt', () => {
        const { container } = render(<TrialBanner trialEndsAt={null} isPremium={false} />);
        expect(container.firstChild).toBeNull();
    });

    it('renders active trial banner with countdown', () => {
        const future = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
        render(<TrialBanner trialEndsAt={future} isPremium={false} />);
        expect(screen.getByText(/Premium Trial/i)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Upgrade Now/i })).toHaveAttribute('href', '/pricing');
    });

    it('dismisses banner when X button clicked', () => {
        const future = new Date(Date.now() + 86400000).toISOString();
        const { container } = render(<TrialBanner trialEndsAt={future} isPremium={false} />);
        fireEvent.click(screen.getByRole('button', { name: /Dismiss banner/i }));
        expect(container.firstChild).toBeNull();
    });

    it('renders expired modal when trial has ended', () => {
        const past = new Date(Date.now() - 1000).toISOString();
        render(<TrialBanner trialEndsAt={past} isPremium={false} />);
        expect(screen.getByText(/Your Trial Has Ended/i)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /View Plans/i })).toHaveAttribute('href', '/pricing');
    });

    it('dismisses expired modal on Maybe later', () => {
        const past = new Date(Date.now() - 1000).toISOString();
        const { container } = render(<TrialBanner trialEndsAt={past} isPremium={false} />);
        fireEvent.click(screen.getByText(/Maybe later/i));
        expect(container.firstChild).toBeNull();
    });
});
