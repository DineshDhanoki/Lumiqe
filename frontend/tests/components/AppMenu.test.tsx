import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AppMenu from '../../src/components/AppMenu';

// Override default unauthenticated mock for specific tests
const mockSignOut = vi.fn();
let mockStatus = 'unauthenticated';

vi.mock('next-auth/react', () => ({
    useSession: () => ({ data: mockStatus === 'authenticated' ? { user: { name: 'Test' } } : null, status: mockStatus }),
    signOut: (...args: unknown[]) => mockSignOut(...args),
    signIn: vi.fn(),
    SessionProvider: ({ children }: any) => children,
}));

describe('AppMenu Component', () => {
    beforeEach(() => {
        mockStatus = 'unauthenticated';
        mockSignOut.mockClear();
    });

    it('renders nothing when unauthenticated', () => {
        const { container } = render(<AppMenu />);
        expect(container.innerHTML).toBe('');
    });

    it('renders hamburger button when authenticated', () => {
        mockStatus = 'authenticated';
        render(<AppMenu />);
        expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument();
    });

    it('opens dropdown with nav links on click', () => {
        mockStatus = 'authenticated';
        render(<AppMenu />);
        fireEvent.click(screen.getByRole('button', { name: /open menu/i }));

        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Scanner')).toBeInTheDocument();
        expect(screen.getByText('Shop Colors')).toBeInTheDocument();
        expect(screen.getByText('Account')).toBeInTheDocument();
        expect(screen.getByText('Log Out')).toBeInTheDocument();
    });

    it('nav links have correct hrefs', () => {
        mockStatus = 'authenticated';
        render(<AppMenu />);
        fireEvent.click(screen.getByRole('button', { name: /open menu/i }));

        expect(screen.getByText('Dashboard').closest('a')).toHaveAttribute('href', '/dashboard');
        expect(screen.getByText('Scanner').closest('a')).toHaveAttribute('href', '/scan');
        expect(screen.getByText('Account').closest('a')).toHaveAttribute('href', '/account');
    });

    it('calls signOut when Log Out is clicked', () => {
        mockStatus = 'authenticated';
        render(<AppMenu />);
        fireEvent.click(screen.getByRole('button', { name: /open menu/i }));
        fireEvent.click(screen.getByText('Log Out'));

        expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/' });
    });

    it('closes menu when a nav link is clicked', () => {
        mockStatus = 'authenticated';
        render(<AppMenu />);
        fireEvent.click(screen.getByRole('button', { name: /open menu/i }));
        expect(screen.getByText('Dashboard')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Dashboard'));
        // Dropdown should be closed — Dashboard link no longer in the dropdown
        expect(screen.queryByText('Scanner')).not.toBeInTheDocument();
    });

    it('toggles between open and close icons', () => {
        mockStatus = 'authenticated';
        render(<AppMenu />);

        const btn = screen.getByRole('button');
        expect(btn).toHaveAttribute('aria-expanded', 'false');

        fireEvent.click(btn);
        expect(btn).toHaveAttribute('aria-expanded', 'true');

        fireEvent.click(btn);
        expect(btn).toHaveAttribute('aria-expanded', 'false');
    });
});
