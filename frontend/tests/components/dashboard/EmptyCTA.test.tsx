import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import EmptyCTA from '../../../src/components/dashboard/EmptyCTA';

vi.mock('@/lib/hooks/useTranslation', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

describe('EmptyCTA', () => {
    it('renders the startColorJourney heading', () => {
        render(<EmptyCTA />);
        expect(screen.getByText('startColorJourney')).toBeInTheDocument();
    });

    it('renders the description text', () => {
        render(<EmptyCTA />);
        expect(screen.getByText('startColorJourneyDesc')).toBeInTheDocument();
    });

    it('has a scan link pointing to /analyze', () => {
        render(<EmptyCTA />);
        const link = screen.getByText('scanMyColors').closest('a');
        expect(link).toHaveAttribute('href', '/analyze');
    });
});
