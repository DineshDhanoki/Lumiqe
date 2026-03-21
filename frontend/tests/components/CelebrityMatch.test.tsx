import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CelebrityMatch from '../../src/components/CelebrityMatch';

describe('CelebrityMatch Component', () => {
    const mockProps = {
        celebrities: [
            { name: 'Taylor Swift', image: '/taylor.jpg' },
            { name: 'Scarlett Johansson', image: '/scarlett.jpg' }
        ]
    };

    it('renders section title', () => {
        render(<CelebrityMatch {...mockProps} />);
        expect(screen.getByText(/Celebrity Matches/i)).toBeInTheDocument();
    });

    it('renders all celebrities', () => {
        render(<CelebrityMatch {...mockProps} />);
        expect(screen.getByText(/Taylor Swift/i)).toBeInTheDocument();
        expect(screen.getByText(/Scarlett Johansson/i)).toBeInTheDocument();
    });
});
