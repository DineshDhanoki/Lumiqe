import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SubscriptionModal from '../../src/components/SubscriptionModal';

describe('SubscriptionModal', () => {
    it('renders nothing when closed', () => {
        const { container } = render(<SubscriptionModal isOpen={false} onClose={vi.fn()} />);
        expect(container.firstChild).toBeNull();
    });

    it('renders modal content when open', () => {
        render(<SubscriptionModal isOpen={true} onClose={vi.fn()} />);
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/Unlock Premium Vibes/i)).toBeInTheDocument();
    });

    it('renders upgrade CTA linking to /upgrade', () => {
        render(<SubscriptionModal isOpen={true} onClose={vi.fn()} />);
        expect(screen.getByRole('link', { name: /Upgrade to premium/i })).toHaveAttribute('href', '/upgrade');
    });

    it('renders all premium perks', () => {
        render(<SubscriptionModal isOpen={true} onClose={vi.fn()} />);
        expect(screen.getByText(/Unlimited AI colour scans/i)).toBeInTheDocument();
        expect(screen.getByText(/AI Stylist chat/i)).toBeInTheDocument();
        expect(screen.getByText(/Daily outfit suggestions/i)).toBeInTheDocument();
    });

    it('calls onClose when backdrop clicked', () => {
        const onClose = vi.fn();
        render(<SubscriptionModal isOpen={true} onClose={onClose} />);
        // Backdrop is the first fixed div behind the modal
        const backdrop = document.querySelector('.backdrop-blur-xl');
        if (backdrop) fireEvent.click(backdrop);
        expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose when close button clicked', () => {
        const onClose = vi.fn();
        render(<SubscriptionModal isOpen={true} onClose={onClose} />);
        fireEvent.click(screen.getByRole('button', { name: /Close modal/i }));
        expect(onClose).toHaveBeenCalledOnce();
    });

    it('calls onClose when Back to Casual clicked', () => {
        const onClose = vi.fn();
        render(<SubscriptionModal isOpen={true} onClose={onClose} />);
        fireEvent.click(screen.getByRole('button', { name: /Stay on free plan/i }));
        expect(onClose).toHaveBeenCalledOnce();
    });
});
