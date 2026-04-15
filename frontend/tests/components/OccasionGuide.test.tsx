import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import OccasionGuide from '../../src/components/OccasionGuide';

const mockOccasions = {
    work: {
        formula: 'Tailored separates in earthy tones with a camel blazer',
        colors: ['#C19A6B', '#6B7C52'],
        key_pieces: ['Camel blazer', 'Olive trousers', 'Cream blouse'],
    },
    date_night: {
        formula: 'Rich rust or deep teal with gold accessories',
        colors: ['#B7410E', '#008080'],
        key_pieces: ['Silk wrap dress', 'Gold earrings'],
    },
    casual: {
        formula: 'Relaxed layers in warm neutrals',
        colors: ['#D2B48C'],
        key_pieces: ['Linen shirt', 'Warm white tee'],
    },
};

const defaultProps = {
    occasions: mockOccasions,
    season: 'True Autumn',
};

describe('OccasionGuide Component', () => {
    it('renders the editorial header', () => {
        render(<OccasionGuide {...defaultProps} />);
        expect(screen.getByText(/The Occasion Edit/i)).toBeInTheDocument();
        expect(screen.getByText(/Dress the Moment/i)).toBeInTheDocument();
    });

    it('shows the season in the subtitle', () => {
        render(<OccasionGuide {...defaultProps} />);
        expect(screen.getByText(/True Autumn/i)).toBeInTheDocument();
    });

    it('renders all occasion labels', () => {
        render(<OccasionGuide {...defaultProps} />);
        expect(screen.getByText('Work & Office')).toBeInTheDocument();
        expect(screen.getByText('Date Night')).toBeInTheDocument();
        expect(screen.getByText('Casual & Weekend')).toBeInTheDocument();
    });

    it('renders occasion formulas as quotes', () => {
        render(<OccasionGuide {...defaultProps} />);
        expect(screen.getByText(/Tailored separates in earthy tones/i)).toBeInTheDocument();
        expect(screen.getByText(/Rich rust or deep teal/i)).toBeInTheDocument();
    });

    it('renders color hex codes for each occasion', () => {
        render(<OccasionGuide {...defaultProps} />);
        expect(screen.getByText('#C19A6B')).toBeInTheDocument();
        expect(screen.getByText('#B7410E')).toBeInTheDocument();
        expect(screen.getByText('#008080')).toBeInTheDocument();
    });

    it('renders key pieces as chips', () => {
        render(<OccasionGuide {...defaultProps} />);
        expect(screen.getByText('Camel blazer')).toBeInTheDocument();
        expect(screen.getByText('Olive trousers')).toBeInTheDocument();
        expect(screen.getByText('Silk wrap dress')).toBeInTheDocument();
    });

    it('renders a card for each occasion', () => {
        const { container } = render(<OccasionGuide {...defaultProps} />);
        // Each occasion card has rounded-3xl class
        const cards = container.querySelectorAll('.rounded-3xl');
        expect(cards.length).toBeGreaterThanOrEqual(3);
    });

    it('handles empty occasions gracefully', () => {
        render(<OccasionGuide occasions={{}} season="True Autumn" />);
        expect(screen.getByText(/Dress the Moment/i)).toBeInTheDocument();
    });
});
