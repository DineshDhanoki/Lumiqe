import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock next/image (not in global setup)
vi.mock('next/image', () => ({
    default: ({ src, alt, ...props }: any) =>
        React.createElement('img', { src, alt, ...props }),
}));

import ProductCard from '../../src/components/ProductCard';

const baseProduct = {
    id: 'prod-1',
    name: 'Silk Blouse',
    brand: 'TestBrand',
    price: '$59.99',
    image_url: 'https://example.com/image.jpg',
    match_score: 87.3,
    purchase_link: 'https://example.com/buy',
    is_locked: false,
};

const defaultProps = {
    product: baseProduct,
    idx: 0,
    onLockedClick: vi.fn(),
};

describe('ProductCard', () => {
    it('renders the product name', () => {
        render(<ProductCard {...defaultProps} />);
        expect(screen.getByText('Silk Blouse')).toBeInTheDocument();
    });

    it('renders the product brand', () => {
        render(<ProductCard {...defaultProps} />);
        expect(screen.getByText('TestBrand')).toBeInTheDocument();
    });

    it('renders the price', () => {
        render(<ProductCard {...defaultProps} />);
        expect(screen.getByText('$59.99')).toBeInTheDocument();
    });

    it('has a buy link with the correct href', () => {
        render(<ProductCard {...defaultProps} />);
        const link = screen.getByRole('link', { name: /buy silk blouse/i });
        expect(link).toHaveAttribute('href', 'https://example.com/buy');
    });

    it('shows the match score badge', () => {
        render(<ProductCard {...defaultProps} />);
        expect(screen.getByText('AI 87%')).toBeInTheDocument();
    });
});
