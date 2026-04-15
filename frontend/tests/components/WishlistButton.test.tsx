import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WishlistButton from '../../src/components/WishlistButton';

const defaultProps = {
    productId: 'prod-1',
    productName: 'Test Product',
    productBrand: 'Test Brand',
    productPrice: '$49.99',
    productImage: 'https://example.com/img.jpg',
    productUrl: 'https://example.com/product',
    matchScore: 85,
};

describe('WishlistButton Component', () => {
    beforeEach(() => {
        // Default: product is not wishlisted
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(JSON.stringify({ wishlisted: false }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            })
        );
    });

    it('renders heart icon', async () => {
        render(<WishlistButton {...defaultProps} />);
        // The button should be present with the favorite MS icon (rendered as span)
        const button = await screen.findByRole('button');
        const icon = button.querySelector('span.material-symbols-outlined');
        expect(icon).toBeTruthy();
    });

    it('has aria-label for accessibility', async () => {
        render(<WishlistButton {...defaultProps} />);
        const button = await screen.findByRole('button', { name: /wishlist/i });
        expect(button).toBeInTheDocument();
    });

    it('shows filled heart when wishlisted', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(JSON.stringify({ wishlisted: true }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            })
        );

        render(<WishlistButton {...defaultProps} />);

        // Wait for the check to resolve and set wishlisted = true
        await waitFor(() => {
            const button = screen.getByRole('button', { name: /Remove from wishlist/i });
            expect(button).toBeInTheDocument();
        });

        // The span should have text-primary class when wishlisted
        const icon = screen.getByRole('button').querySelector('span.material-symbols-outlined');
        expect(icon?.classList.toString()).toContain('text-primary');
    });

    it('shows outline heart when not wishlisted', async () => {
        render(<WishlistButton {...defaultProps} />);

        await waitFor(() => {
            const button = screen.getByRole('button', { name: /Add to wishlist/i });
            expect(button).toBeInTheDocument();
        });

        const icon = screen.getByRole('button').querySelector('span.material-symbols-outlined');
        expect(icon?.classList.toString()).toContain('text-gray-600');
    });

    it('calls fetch on click', async () => {
        const user = userEvent.setup();
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(JSON.stringify({ wishlisted: false }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            })
        );

        render(<WishlistButton {...defaultProps} />);

        // Wait for the component to settle after initial fetch
        await waitFor(() => {
            expect(screen.getByRole('button', { name: /Add to wishlist/i })).toBeInTheDocument();
        });

        const callCountBefore = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.length;

        const button = screen.getByRole('button');
        await user.click(button);

        // Should have called fetch at least one more time for the toggle
        await waitFor(() => {
            const callCountAfter = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.length;
            expect(callCountAfter).toBeGreaterThan(callCountBefore);
        });
    });
});
