import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CelebrityMatch from '../../src/components/CelebrityMatch';

// Mock fetch to prevent actual API calls
global.fetch = vi.fn(() =>
    Promise.resolve({
        ok: false,
        json: () => Promise.resolve(null),
    })
) as unknown as typeof fetch;

describe('CelebrityMatch Component', () => {
    const mockProps = {
        celebrities: [
            { name: 'Taylor Swift', image: '/taylor.jpg' },
            { name: 'Scarlett Johansson', image: '/scarlett.jpg' }
        ]
    };

    it('renders section title', () => {
        render(<CelebrityMatch {...mockProps} />);
        expect(screen.getByText(/Your Celebrity Color Twins/i)).toBeInTheDocument();
    });

    it('renders all celebrities', () => {
        render(<CelebrityMatch {...mockProps} />);
        expect(screen.getByText(/Taylor Swift/i)).toBeInTheDocument();
        expect(screen.getByText(/Scarlett Johansson/i)).toBeInTheDocument();
    });
});
