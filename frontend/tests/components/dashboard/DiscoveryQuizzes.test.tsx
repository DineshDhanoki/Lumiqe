import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DiscoveryQuizzes from '../../../src/components/dashboard/DiscoveryQuizzes';

describe('DiscoveryQuizzes', () => {
    it('renders both quiz titles', () => {
        render(<DiscoveryQuizzes />);
        expect(screen.getByText('Body Shape Analysis')).toBeInTheDocument();
        expect(screen.getByText('Style Personality Quiz')).toBeInTheDocument();
    });

    it('body shape quiz links to /quiz/body-shape', () => {
        render(<DiscoveryQuizzes />);
        expect(screen.getByText('Body Shape Analysis').closest('a'))
            .toHaveAttribute('href', '/quiz/body-shape');
    });

    it('style quiz links to /quiz/style', () => {
        render(<DiscoveryQuizzes />);
        expect(screen.getByText('Style Personality Quiz').closest('a'))
            .toHaveAttribute('href', '/quiz/style');
    });

    it('shows question count for body shape quiz', () => {
        render(<DiscoveryQuizzes />);
        expect(screen.getByText(/6 questions/i)).toBeInTheDocument();
    });

    it('shows question count for style quiz', () => {
        render(<DiscoveryQuizzes />);
        expect(screen.getByText(/10 questions/i)).toBeInTheDocument();
    });
});
