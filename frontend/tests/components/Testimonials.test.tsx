import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Testimonials from '../../src/components/Testimonials';

describe('Testimonials Component', () => {
    it('renders section title', () => {
        render(<Testimonials />);
        expect(screen.getByText(/What People Are Saying/i)).toBeInTheDocument();
    });

    it('renders testimonials content', () => {
        render(<Testimonials />);
        expect(screen.getByText(/Sarah M./i)).toBeInTheDocument();
        expect(screen.getByText(/Deep Winter/i)).toBeInTheDocument();
    });
});
