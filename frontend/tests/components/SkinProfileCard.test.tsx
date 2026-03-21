import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SkinProfileCard from '../../src/components/SkinProfileCard';

describe('SkinProfileCard Component', () => {
    const mockProps = {
        hexColor: '#D2B48C',
        undertone: 'warm',
        confidence: 0.85
    };

    it('renders hex color text', () => {
        render(<SkinProfileCard {...mockProps} />);
        expect(screen.getByText(/#D2B48C/i)).toBeInTheDocument();
    });

    it('renders undertone text', () => {
        render(<SkinProfileCard {...mockProps} />);
        expect(screen.getByText(/warm undertone/i)).toBeInTheDocument();
    });

    it('renders confidence percentage', () => {
        render(<SkinProfileCard {...mockProps} />);
        expect(screen.getByText(/85%/i)).toBeInTheDocument();
    });
});
