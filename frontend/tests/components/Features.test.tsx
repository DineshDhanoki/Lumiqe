import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Features from '../../src/components/Features';

describe('Features Component', () => {
    it('renders section headline', () => {
        render(<Features />);
        expect(screen.getByText(/Why Choose Lumiqe/i)).toBeInTheDocument();
    });

    it('renders feature titles', () => {
        render(<Features />);
        expect(screen.getByText(/Clinical-Grade Accuracy/i)).toBeInTheDocument();
        expect(screen.getByText(/12 Season Framework/i)).toBeInTheDocument();
        expect(screen.getByText(/Curated Shopping/i)).toBeInTheDocument();
        expect(screen.getByText(/Privacy by Design/i)).toBeInTheDocument();
    });
});
