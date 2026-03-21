import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PaletteDownload from '../../src/components/PaletteDownload';

// Mock global fetch
global.fetch = vi.fn(() =>
    Promise.resolve({
        ok: true,
        blob: () => Promise.resolve(new Blob(['mock-image-data'], { type: 'image/png' }))
    })
) as unknown as typeof fetch;

describe('PaletteDownload Component', () => {
    it('renders download button', () => {
        render(<PaletteDownload season="Deep Winter" />);
        expect(screen.getByRole('button', { name: /Save My Palette/i })).toBeInTheDocument();
    });

    it('handles click and triggers fetch', async () => {
        const { getByRole } = render(<PaletteDownload season="Deep Winter" />);
        const button = getByRole('button', { name: /Save My Palette/i });

        // We mock window.URL.createObjectURL and revokeObjectURL since JSDOM doesn't have them
        global.URL.createObjectURL = vi.fn(() => 'mock-url');
        global.URL.revokeObjectURL = vi.fn();

        // Trigger click
        fireEvent.click(button);

        // Expect fetch to have been called
        expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/api/palette-card', expect.any(Object));
    });
});
