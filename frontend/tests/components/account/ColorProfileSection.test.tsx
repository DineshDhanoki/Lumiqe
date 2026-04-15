import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ColorProfileSection from '../../../src/components/account/ColorProfileSection';

const labels = {
    colorProfileLabel: 'Color Profile',
    basedOnLatestScanLabel: 'Based on your latest scan',
    seasonLabel: 'Your Season',
    shopMyColorsLabel: 'Shop My Colors',
    retakeScanLabel: 'Retake Scan',
    notAnalyzedYetLabel: 'Not analyzed yet',
    startFreeScanLabel: 'Start Free Scan',
};

describe('ColorProfileSection', () => {
    it('renders section title', () => {
        render(<ColorProfileSection {...labels} season={null} palette={null} />);
        expect(screen.getByText('Color Profile')).toBeInTheDocument();
    });

    it('shows season badge and name when season is provided', () => {
        render(<ColorProfileSection {...labels} season="True Autumn" palette={['#C19A6B', '#B7410E']} />);
        expect(screen.getAllByText(/True Autumn/i).length).toBeGreaterThanOrEqual(1);
    });

    it('renders palette swatches when palette provided', () => {
        const { container } = render(
            <ColorProfileSection {...labels} season="True Autumn" palette={['#C19A6B', '#B7410E', '#6B7C52']} />
        );
        const swatches = container.querySelectorAll('[style*="background-color"]');
        // 3 swatches + 1 decorative glow
        expect(swatches.length).toBeGreaterThanOrEqual(3);
    });

    it('renders Shop and Retake CTA links', () => {
        render(<ColorProfileSection {...labels} season="True Autumn" palette={['#C19A6B']} />);
        expect(screen.getByRole('link', { name: /Shop My Colors/i })).toHaveAttribute('href', '/shopping-agent');
        expect(screen.getByRole('link', { name: /Retake Scan/i })).toHaveAttribute('href', '/analyze');
    });

    it('shows hex tooltips for each swatch', () => {
        render(<ColorProfileSection {...labels} season="True Autumn" palette={['#C19A6B', '#B7410E']} />);
        expect(screen.getByText('#C19A6B')).toBeInTheDocument();
        expect(screen.getByText('#B7410E')).toBeInTheDocument();
    });

    it('renders empty state when palette is null', () => {
        render(<ColorProfileSection {...labels} season={null} palette={null} />);
        expect(screen.getByText('Not analyzed yet')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Start Free Scan/i })).toHaveAttribute('href', '/analyze');
    });

    it('renders empty state when palette is empty array', () => {
        render(<ColorProfileSection {...labels} season="True Autumn" palette={[]} />);
        expect(screen.getByText('Not analyzed yet')).toBeInTheDocument();
    });
});
