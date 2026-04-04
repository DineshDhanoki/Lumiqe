import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AnalysisHistory from '../../../src/components/dashboard/AnalysisHistory';

vi.mock('@/lib/hooks/useTranslation', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

const makeEntry = (i: number) => ({
    id: `id-${i}`,
    season: `Season ${i}`,
    hexColor: '#C4956A',
    undertone: 'warm',
    confidence: 0.9,
    contrastLevel: 'Medium',
    palette: ['#C4956A'],
    metal: 'Gold',
    timestamp: Date.now() - i * 1000,
});

describe('AnalysisHistory', () => {
    it('renders all entries when fewer than 10', () => {
        const history = [makeEntry(1), makeEntry(2), makeEntry(3)];
        render(<AnalysisHistory history={history} />);
        expect(screen.getByText('Season 1')).toBeInTheDocument();
        expect(screen.getByText('Season 3')).toBeInTheDocument();
    });

    it('limits display to 10 items by default', () => {
        const history = Array.from({ length: 15 }, (_, i) => makeEntry(i + 1));
        render(<AnalysisHistory history={history} />);
        expect(screen.getByText('Season 10')).toBeInTheDocument();
        expect(screen.queryByText('Season 11')).not.toBeInTheDocument();
    });

    it('shows "Show all N analyses" button when more than 10 entries', () => {
        const history = Array.from({ length: 12 }, (_, i) => makeEntry(i + 1));
        render(<AnalysisHistory history={history} />);
        expect(screen.getByText(/Show all 12 analyses/)).toBeInTheDocument();
    });

    it('does not show "Show all" button for 10 or fewer entries', () => {
        const history = Array.from({ length: 10 }, (_, i) => makeEntry(i + 1));
        render(<AnalysisHistory history={history} />);
        expect(screen.queryByText(/Show all/)).not.toBeInTheDocument();
    });

    it('reveals all items after clicking "Show all"', () => {
        const history = Array.from({ length: 12 }, (_, i) => makeEntry(i + 1));
        render(<AnalysisHistory history={history} />);
        fireEvent.click(screen.getByText(/Show all 12 analyses/));
        expect(screen.getByText('Season 12')).toBeInTheDocument();
    });

    it('"Show all" button disappears after clicking', () => {
        const history = Array.from({ length: 12 }, (_, i) => makeEntry(i + 1));
        render(<AnalysisHistory history={history} />);
        fireEvent.click(screen.getByText(/Show all 12 analyses/));
        expect(screen.queryByText(/Show all/)).not.toBeInTheDocument();
    });

    it('links to persisted result page when id is present', () => {
        render(<AnalysisHistory history={[makeEntry(1)]} />);
        const link = screen.getByText('Season 1').closest('a');
        expect(link).toHaveAttribute('href', '/results/id-1');
    });

    it('shows undertone and contrast level', () => {
        render(<AnalysisHistory history={[makeEntry(1)]} />);
        expect(screen.getByText(/warm · Medium contrast/)).toBeInTheDocument();
    });
});
