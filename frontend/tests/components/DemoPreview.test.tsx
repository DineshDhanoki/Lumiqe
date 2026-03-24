import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import DemoPreview from '../../src/components/DemoPreview';

const mockDemoData = [
    {
        id: '1',
        name: 'Test Setup',
        thumbnail: '/test.jpg',
        season: 'Deep Winter',
        undertone: 'cool',
        hex_color: '#4B3927',
        confidence: 0.85,
        palette: ['#000', '#111', '#222', '#333', '#444', '#555'],
        description: 'Test description.'
    }
];

beforeEach(() => {
    global.fetch = vi.fn(() =>
        Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockDemoData),
        })
    ) as unknown as typeof fetch;
});

describe('DemoPreview Component', () => {
    it('renders skeleton on initial load before fetch completes or shortly after if mocked', async () => {
        render(<DemoPreview />);
        expect(screen.getByText(/See the Engine in Action/i)).toBeInTheDocument();
    });

    it('renders demo data successfully', async () => {
        render(<DemoPreview />);
        await waitFor(() => {
            expect(screen.getByText('Test Setup')).toBeInTheDocument();
            expect(screen.getAllByText('Deep Winter').length).toBeGreaterThan(0);
        });
    });

    it('fetches from the correct proxy endpoint', async () => {
        render(<DemoPreview />);
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/proxy/demo-results');
        });
    });
});
