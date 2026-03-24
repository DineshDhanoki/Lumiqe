import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PaletteDownload from '../../src/components/PaletteDownload';

// Mock the apiFetch module
vi.mock('@/lib/api', () => ({
    apiFetch: vi.fn(() =>
        Promise.resolve({
            ok: true,
            blob: () => Promise.resolve(new Blob(['mock-image-data'], { type: 'image/png' }))
        })
    ),
    API_BASE: 'http://localhost:8000',
}));

import { apiFetch } from '@/lib/api';

describe('PaletteDownload Component', () => {
    it('renders download button', () => {
        render(<PaletteDownload season="Deep Winter" />);
        expect(screen.getByRole('button', { name: /Save My Palette/i })).toBeInTheDocument();
    });

    it('handles click and triggers apiFetch', async () => {
        render(<PaletteDownload season="Deep Winter" />);
        const button = screen.getByRole('button', { name: /Save My Palette/i });

        // Mock URL methods since JSDOM doesn't have them
        global.URL.createObjectURL = vi.fn(() => 'mock-url');
        global.URL.revokeObjectURL = vi.fn();

        fireEvent.click(button);

        expect(apiFetch).toHaveBeenCalledWith('/api/palette-card', expect.any(Object));
    });
});
