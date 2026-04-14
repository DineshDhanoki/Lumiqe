import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import BestAvoidColors from '../../src/components/BestAvoidColors';

describe('BestAvoidColors Component', () => {
    const mockProps = {
        bestColors: ['#FF0000', '#00FF00'],
        avoidColors: ['#0000FF']
    };

    it('renders section titles', () => {
        render(<BestAvoidColors {...mockProps} />);
        expect(screen.getByText(/Ideal Pairings/i)).toBeInTheDocument();
        expect(screen.getByText(/Avoid These/i)).toBeInTheDocument();
    });

    it('renders all swatches', () => {
        render(<BestAvoidColors {...mockProps} />);
        expect(screen.getByText(/#FF0000/i)).toBeInTheDocument();
        expect(screen.getByText(/#0000FF/i)).toBeInTheDocument();
    });
});
