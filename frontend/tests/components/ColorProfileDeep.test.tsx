import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ColorProfileDeep from '../../src/components/ColorProfileDeep';

const defaultProps = {
    season: 'Soft Autumn',
    styleArchetype: 'The Earth Muse',
    signatureColor: { hex: '#8B6347', name: 'Warm Cognac' },
    value: 'Medium',
    chroma: 'Soft',
    contrastLevel: 'Low',
    undertone: 'warm',
    foundationUndertone: 'Look for foundations labeled warm or golden beige.',
    jewelryGuide: 'Gold and rose gold metals complement your warmth best.',
    colorHarmonies: {
        monochromatic: 'Layer shades of brown and tan for a tonal look.',
        complementary: 'Add muted teal accents for contrast.',
        analogous: 'Combine terracotta, rust, and warm olive.',
        neutral_base: 'Warm beige and off-white as your neutral foundation.',
    },
    patterns: {
        best: ['Soft florals', 'Abstract earth tones', 'Paisley'],
        scale: 'Medium',
        avoid: ['Bold geometric', 'High contrast stripes'],
    },
};

describe('ColorProfileDeep Component', () => {
    it('renders the main heading', () => {
        render(<ColorProfileDeep {...defaultProps} />);
        expect(screen.getByText(/Your Color Profile/i)).toBeInTheDocument();
    });

    it('renders style archetype', () => {
        render(<ColorProfileDeep {...defaultProps} />);
        expect(screen.getByText('The Earth Muse')).toBeInTheDocument();
        expect(screen.getByText(/Style Archetype/i)).toBeInTheDocument();
    });

    it('renders signature color name and hex', () => {
        render(<ColorProfileDeep {...defaultProps} />);
        expect(screen.getByText('Warm Cognac')).toBeInTheDocument();
        expect(screen.getByText('#8B6347')).toBeInTheDocument();
        expect(screen.getByText(/Signature Color/i)).toBeInTheDocument();
    });

    it('renders color characteristics', () => {
        render(<ColorProfileDeep {...defaultProps} />);
        expect(screen.getByText(/Color Characteristics/i)).toBeInTheDocument();
        expect(screen.getAllByText('Medium').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('Soft')).toBeInTheDocument();
        expect(screen.getByText('Low')).toBeInTheDocument();
    });

    it('renders undertone with capital first letter', () => {
        render(<ColorProfileDeep {...defaultProps} />);
        expect(screen.getByText('Warm')).toBeInTheDocument();
    });

    it('renders color harmonies section', () => {
        render(<ColorProfileDeep {...defaultProps} />);
        expect(screen.getByText(/How to Combine Your Colors/i)).toBeInTheDocument();
        expect(screen.getByText(/Monochromatic/i)).toBeInTheDocument();
        expect(screen.getByText(/Complementary/i)).toBeInTheDocument();
        expect(screen.getByText(/Analogous/i)).toBeInTheDocument();
        expect(screen.getByText(/Layer shades of brown/i)).toBeInTheDocument();
    });

    it('renders pattern guide', () => {
        render(<ColorProfileDeep {...defaultProps} />);
        expect(screen.getByText(/Pattern Guide/i)).toBeInTheDocument();
        expect(screen.getByText('Soft florals')).toBeInTheDocument();
        expect(screen.getByText('Bold geometric')).toBeInTheDocument();
    });

    it('renders foundation undertone and jewelry guide', () => {
        render(<ColorProfileDeep {...defaultProps} />);
        expect(screen.getByText(/Foundation Undertone/i)).toBeInTheDocument();
        expect(screen.getByText(/Jewelry Guide/i)).toBeInTheDocument();
        expect(screen.getByText(/warm or golden beige/i)).toBeInTheDocument();
        expect(screen.getByText(/Gold and rose gold/i)).toBeInTheDocument();
    });

    it('renders progress bars for value, chroma and contrast', () => {
        const { container } = render(<ColorProfileDeep {...defaultProps} />);
        // Progress bar divs use bg-primary class
        const bars = container.querySelectorAll('.bg-primary.rounded-full');
        expect(bars.length).toBeGreaterThanOrEqual(3);
    });
});
