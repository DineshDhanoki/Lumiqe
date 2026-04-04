import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TodaysOutfit from '../../../src/components/dashboard/TodaysOutfit';

describe('TodaysOutfit', () => {
    it('renders nothing when no data, not empty, not error', () => {
        const { container } = render(
            <TodaysOutfit dailyOutfit={null} isEmpty={false} isError={false} onRetry={vi.fn()} />
        );
        expect(container.innerHTML).toBe('');
    });

    it('renders empty wardrobe state when isEmpty=true', () => {
        render(<TodaysOutfit dailyOutfit={null} isEmpty={true} isError={false} onRetry={vi.fn()} />);
        expect(screen.getByText(/Add items to your wardrobe/i)).toBeInTheDocument();
    });

    it('wardrobe empty state links to /wardrobe', () => {
        render(<TodaysOutfit dailyOutfit={null} isEmpty={true} isError={false} onRetry={vi.fn()} />);
        expect(screen.getByText('Go to Wardrobe').closest('a')).toHaveAttribute('href', '/wardrobe');
    });

    it('renders error state message', () => {
        render(<TodaysOutfit dailyOutfit={null} isEmpty={false} isError={true} onRetry={vi.fn()} />);
        expect(screen.getByText(/Could not load/i)).toBeInTheDocument();
    });

    it('calls onRetry when Retry button is clicked', () => {
        const onRetry = vi.fn();
        render(<TodaysOutfit dailyOutfit={null} isEmpty={false} isError={true} onRetry={onRetry} />);
        fireEvent.click(screen.getByText('Retry'));
        expect(onRetry).toHaveBeenCalledOnce();
    });

    it('renders outfit date and slot data when filled', () => {
        const dailyOutfit = {
            date: '2025-04-04',
            slots: {
                top: { id: '1', dominant_color: '#FF0000', match_score: 95, image_filename: 'shirt.jpg', category: 'T-Shirt' },
                bottom: null,
                shoes: null,
                accessory: null,
            },
            filled_count: 1,
            total_slots: 4,
        };
        render(<TodaysOutfit dailyOutfit={dailyOutfit} isEmpty={false} isError={false} onRetry={vi.fn()} />);
        expect(screen.getByText('Your outfit for 2025-04-04')).toBeInTheDocument();
        expect(screen.getByText('T-Shirt')).toBeInTheDocument();
        expect(screen.getByText('95% match')).toBeInTheDocument();
    });

    it('shows No item for empty slots', () => {
        const dailyOutfit = {
            date: '2025-04-04',
            slots: { top: null, bottom: null, shoes: null, accessory: null },
            filled_count: 1,
            total_slots: 4,
        };
        render(<TodaysOutfit dailyOutfit={dailyOutfit} isEmpty={false} isError={false} onRetry={vi.fn()} />);
        expect(screen.getAllByText('No item')).toHaveLength(4);
    });

    it('links to /wardrobe from the outfit view', () => {
        const dailyOutfit = {
            date: '2025-04-04',
            slots: { top: null, bottom: null, shoes: null, accessory: null },
            filled_count: 1,
            total_slots: 4,
        };
        render(<TodaysOutfit dailyOutfit={dailyOutfit} isEmpty={false} isError={false} onRetry={vi.fn()} />);
        expect(screen.getByText('View full outfit').closest('a')).toHaveAttribute('href', '/wardrobe');
    });
});
