import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import QuickActions from '../../../src/components/dashboard/QuickActions';

vi.mock('@/lib/hooks/useTranslation', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

describe('QuickActions', () => {
    it('renders 4 action links', () => {
        render(<QuickActions aiStylistHref="/results?season=Spring" />);
        expect(screen.getAllByRole('link')).toHaveLength(4);
    });

    it('new scan links to /analyze', () => {
        render(<QuickActions aiStylistHref="/results?season=Spring" />);
        expect(screen.getByText('Scan New').closest('a')).toHaveAttribute('href', '/analyze');
    });

    it('AI Remix uses the provided aiStylistHref', () => {
        render(<QuickActions aiStylistHref="/results?season=Spring" />);
        expect(screen.getByText('AI Remix').closest('a')).toHaveAttribute('href', '/results?season=Spring');
    });

    it('Planner links to /wardrobe', () => {
        render(<QuickActions aiStylistHref="/results?season=Spring" />);
        expect(screen.getByText('Planner').closest('a')).toHaveAttribute('href', '/wardrobe');
    });

    it('AI stylist uses the provided aiStylistHref', () => {
        render(<QuickActions aiStylistHref="/results?season=Spring&undertone=warm" />);
        expect(screen.getByText('AI Remix').closest('a'))
            .toHaveAttribute('href', '/results?season=Spring&undertone=warm');
    });
});
