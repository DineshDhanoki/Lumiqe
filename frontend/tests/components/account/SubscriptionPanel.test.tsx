import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SubscriptionPanel from '../../../src/components/account/SubscriptionPanel';

const baseProfile = {
    is_premium: false,
    free_scans_left: 2,
    credits: 0,
    trial_ends_at: null,
    stripe_subscription_id: null,
    season: null,
};

describe('SubscriptionPanel — Free plan', () => {
    it('renders Free plan label', () => {
        render(<SubscriptionPanel profile={baseProfile} onManageSubscription={vi.fn()} />);
        expect(screen.getByText(/Free Plan/i)).toBeInTheDocument();
    });

    it('shows remaining scan count', () => {
        render(<SubscriptionPanel profile={baseProfile} onManageSubscription={vi.fn()} />);
        expect(screen.getByText(/2 free scans remaining/i)).toBeInTheDocument();
    });

    it('shows credits when > 0', () => {
        render(<SubscriptionPanel profile={{ ...baseProfile, credits: 5 }} onManageSubscription={vi.fn()} />);
        expect(screen.getByText(/5 credits available/i)).toBeInTheDocument();
    });

    it('links to /pricing for upgrade', () => {
        render(<SubscriptionPanel profile={baseProfile} onManageSubscription={vi.fn()} />);
        expect(screen.getByRole('link', { name: /Upgrade for Full Access/i })).toHaveAttribute('href', '/pricing');
    });
});

describe('SubscriptionPanel — Trial', () => {
    const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();

    it('renders Trial badge', () => {
        render(<SubscriptionPanel profile={{ ...baseProfile, trial_ends_at: futureDate }} onManageSubscription={vi.fn()} />);
        expect(screen.getAllByText(/Trial/i).length).toBeGreaterThanOrEqual(1);
    });

    it('shows days remaining', () => {
        render(<SubscriptionPanel profile={{ ...baseProfile, trial_ends_at: futureDate }} onManageSubscription={vi.fn()} />);
        expect(screen.getByText(/days remaining/i)).toBeInTheDocument();
    });

    it('links to /pricing for upgrade', () => {
        render(<SubscriptionPanel profile={{ ...baseProfile, trial_ends_at: futureDate }} onManageSubscription={vi.fn()} />);
        expect(screen.getByRole('link', { name: /Upgrade Plan/i })).toHaveAttribute('href', '/pricing');
    });
});

describe('SubscriptionPanel — Premium', () => {
    const premiumProfile = { ...baseProfile, is_premium: true };

    it('renders Premium badge', () => {
        render(<SubscriptionPanel profile={premiumProfile} onManageSubscription={vi.fn()} />);
        expect(screen.getByText('Premium')).toBeInTheDocument();
    });

    it('shows Obsidian Annual Access', () => {
        render(<SubscriptionPanel profile={premiumProfile} onManageSubscription={vi.fn()} />);
        expect(screen.getByText(/Obsidian Annual Access/i)).toBeInTheDocument();
    });

    it('renders all premium features', () => {
        render(<SubscriptionPanel profile={premiumProfile} onManageSubscription={vi.fn()} />);
        expect(screen.getByText(/Unlimited AI scans/i)).toBeInTheDocument();
        expect(screen.getByText(/AI Stylist chat/i)).toBeInTheDocument();
        expect(screen.getByText(/Daily outfit suggestions/i)).toBeInTheDocument();
    });

    it('calls onManageSubscription when Manage Billing clicked', () => {
        const onManage = vi.fn();
        render(<SubscriptionPanel profile={premiumProfile} onManageSubscription={onManage} />);
        fireEvent.click(screen.getByRole('button', { name: /Manage Billing/i }));
        expect(onManage).toHaveBeenCalledOnce();
    });
});
