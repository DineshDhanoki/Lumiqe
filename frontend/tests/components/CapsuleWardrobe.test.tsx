import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CapsuleWardrobe from '../../src/components/CapsuleWardrobe';

const mockItems = [
    { piece: 'Camel Wool Coat', hex: '#C19A6B', why: 'Anchors your entire autumn palette' },
    { piece: 'Rust Silk Blouse', hex: '#B7410E', why: 'Echoes your warmest undertones' },
    { piece: 'Olive Trousers', hex: '#6B7C52', why: 'Earthy neutral that works with everything' },
];

const defaultProps = {
    items: mockItems,
    season: 'True Autumn',
    wardrobeFormula: '60% neutrals (camel, olive, brown) + 30% accent (rust, gold) + 10% pop (forest green)',
};

describe('CapsuleWardrobe Component', () => {
    it('renders the editorial header', () => {
        render(<CapsuleWardrobe {...defaultProps} />);
        expect(screen.getByText(/The Atelier Edit/i)).toBeInTheDocument();
        expect(screen.getByText(/Capsule Wardrobe/i)).toBeInTheDocument();
    });

    it('shows item count and season in subtitle', () => {
        render(<CapsuleWardrobe {...defaultProps} />);
        expect(screen.getByText(/3 essential pieces/i)).toBeInTheDocument();
        expect(screen.getByText(/True Autumn/i)).toBeInTheDocument();
    });

    it('renders the wardrobe formula section', () => {
        render(<CapsuleWardrobe {...defaultProps} />);
        expect(screen.getByText(/Wardrobe Formula/i)).toBeInTheDocument();
        expect(screen.getByText(/60% neutrals/i)).toBeInTheDocument();
    });

    it('renders all wardrobe items', () => {
        render(<CapsuleWardrobe {...defaultProps} />);
        expect(screen.getByText('Camel Wool Coat')).toBeInTheDocument();
        expect(screen.getByText('Rust Silk Blouse')).toBeInTheDocument();
        expect(screen.getByText('Olive Trousers')).toBeInTheDocument();
    });

    it('renders item hex codes', () => {
        render(<CapsuleWardrobe {...defaultProps} />);
        expect(screen.getByText('#C19A6B')).toBeInTheDocument();
        expect(screen.getByText('#B7410E')).toBeInTheDocument();
    });

    it('renders item why descriptions', () => {
        render(<CapsuleWardrobe {...defaultProps} />);
        expect(screen.getByText(/Anchors your entire autumn palette/i)).toBeInTheDocument();
        expect(screen.getByText(/Echoes your warmest undertones/i)).toBeInTheDocument();
    });

    it('renders the shopping CTA link to feed', () => {
        render(<CapsuleWardrobe {...defaultProps} />);
        const link = screen.getByRole('link', { name: /Shop These Colors/i });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', '/feed');
    });

    it('renders color swatches with correct background', () => {
        const { container } = render(<CapsuleWardrobe {...defaultProps} />);
        const swatches = container.querySelectorAll('[style*="background-color"]');
        expect(swatches.length).toBeGreaterThanOrEqual(3);
    });
});
