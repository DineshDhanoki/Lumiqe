import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import RescanNudge from '../../../src/components/dashboard/RescanNudge';

describe('RescanNudge', () => {
    it('shows the days-ago count in the message', () => {
        render(<RescanNudge daysAgo={75} />);
        expect(screen.getByText(/75 days ago/)).toBeInTheDocument();
    });

    it('shows seasonal update prompt text', () => {
        render(<RescanNudge daysAgo={90} />);
        expect(screen.getByText(/Time for a seasonal update/i)).toBeInTheDocument();
    });

    it('has a Rescan Now link pointing to /analyze', () => {
        render(<RescanNudge daysAgo={75} />);
        const link = screen.getByText('Rescan Now').closest('a');
        expect(link).toHaveAttribute('href', '/analyze');
    });
});
