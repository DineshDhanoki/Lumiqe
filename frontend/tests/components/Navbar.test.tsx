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
        expect(screen.getByText('Analysis')).toBeInTheDocument();
        expect(screen.getByText('Wardrobe')).toBeInTheDocument();
        expect(screen.getByText('Gallery')).toBeInTheDocument();
    });

    it('contains icon buttons for unauthenticated state', () => {
        render(<Navbar />);
        expect(screen.getByRole('button', { name: /Notifications/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Sign in/i })).toBeInTheDocument();
    });
});
