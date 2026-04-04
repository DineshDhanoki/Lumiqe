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
        expect(screen.getByText('newScan').closest('a')).toHaveAttribute('href', '/analyze');
    });

    it('shop colors links to /shopping-agent', () => {
        render(<QuickActions aiStylistHref="/results?season=Spring" />);
        expect(screen.getByText('shopColors').closest('a')).toHaveAttribute('href', '/shopping-agent');
    });

    it('buy or pass links to /scan', () => {
        render(<QuickActions aiStylistHref="/results?season=Spring" />);
        expect(screen.getByText('buyOrPass').closest('a')).toHaveAttribute('href', '/scan');
    });

    it('AI stylist uses the provided aiStylistHref', () => {
        render(<QuickActions aiStylistHref="/results?season=Spring&undertone=warm" />);
        expect(screen.getByText('aiStylist').closest('a'))
            .toHaveAttribute('href', '/results?season=Spring&undertone=warm');
    });
});
