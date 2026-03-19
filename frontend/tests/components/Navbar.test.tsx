import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Navbar from '../../src/components/Navbar';

describe('Navbar Component', () => {
    it('renders logo text correctly', () => {
        render(<Navbar />);
        expect(screen.getByText('LUMIQE')).toBeInTheDocument();
    });

    it('contains navigation links', () => {
        render(<Navbar />);
        expect(screen.getByText('How It Works')).toBeInTheDocument();
        expect(screen.getByText('Features')).toBeInTheDocument();
        expect(screen.getByText('Pricing')).toBeInTheDocument();
    });

    it('contains Login and Sign Up buttons', () => {
        render(<Navbar />);
        expect(screen.getByRole('button', { name: /Log In/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Sign Up/i })).toBeInTheDocument();
    });
});
