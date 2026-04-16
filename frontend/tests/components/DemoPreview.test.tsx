import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DemoPreview from '../../src/components/DemoPreview';

describe('DemoPreview Component', () => {
    it('renders the bento grid section', () => {
        render(<DemoPreview />);
        expect(document.querySelector('#demo')).toBeInTheDocument();
    });

    it('shows real-time analysis card', () => {
        render(<DemoPreview />);
        expect(screen.getByText(/REAL-TIME ANALYSIS/i)).toBeInTheDocument();
        expect(screen.getByText(/Skin Metric V2\.1/i)).toBeInTheDocument();
    });

    it('shows wardrobe matching sub-card', () => {
        render(<DemoPreview />);
        expect(screen.getByText(/Wardrobe Matching/i)).toBeInTheDocument();
    });

    it('shows AI personal stylist sub-card', () => {
        render(<DemoPreview />);
        expect(screen.getByText(/AI Personal Stylist/i)).toBeInTheDocument();
    });
});
