import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ScanGuide from '../../src/components/ScanGuide';

describe('ScanGuide Component', () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    it('renders three steps', () => {
        render(<ScanGuide />);
        expect(screen.getByText('Take a selfie or upload a photo')).toBeInTheDocument();
        expect(screen.getByText('Our AI analyzes your skin tone in seconds')).toBeInTheDocument();
        expect(
            screen.getByText('Get your season, palette, and personalized recommendations')
        ).toBeInTheDocument();
    });

    it('shows "Got it, let\'s go" dismiss link', () => {
        render(<ScanGuide />);
        expect(screen.getByText("Got it, let's go")).toBeInTheDocument();
    });

    it('has close button', () => {
        render(<ScanGuide />);
        expect(screen.getByRole('button', { name: /Dismiss guide/i })).toBeInTheDocument();
    });

    it('does not render if already dismissed (mock localStorage)', () => {
        // Pre-set the dismissed key
        window.localStorage.setItem('lumiqe-scan-guide-seen', 'true');

        render(<ScanGuide />);

        // The guide content should not be visible
        expect(screen.queryByText('Take a selfie or upload a photo')).not.toBeInTheDocument();
    });
});
