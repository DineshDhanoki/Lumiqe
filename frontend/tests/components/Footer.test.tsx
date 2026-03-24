import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Footer from '../../src/components/Footer';

describe('Footer Component', () => {
    it('renders Lumiqe brand name', () => {
        render(<Footer />);
        expect(screen.getAllByText(/LUMIQE/i).length).toBeGreaterThan(0);
    });

    it('renders footer links', () => {
        render(<Footer />);
        expect(screen.getByText(/Privacy Policy/i)).toBeInTheDocument();
        expect(screen.getByText(/Terms of Service/i)).toBeInTheDocument();
        expect(screen.getByText(/Contact Support/i)).toBeInTheDocument();
    });

    it('renders copyright text', () => {
        render(<Footer />);
        expect(screen.getByText(/All rights reserved/i)).toBeInTheDocument();
    });
});
