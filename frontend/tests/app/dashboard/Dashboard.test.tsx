import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next-auth/react', () => ({
    useSession: () => ({
        data: { user: { name: 'Dashboard Tester' } },
        status: 'authenticated',
    }),
}));

vi.mock('@/lib/api', () => ({
    apiFetch: vi.fn(),
}));

vi.mock('@/lib/store', () => ({
    useLumiqeStore: (selector: (state: object) => unknown) => selector({
        history: [],
        quiz: {},
        hydrated: true,
    }),
}));

vi.mock('@/lib/hooks/useTranslation', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/components/layout/AppLayout', () => ({
    default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/dashboard/RescanNudge', () => ({ default: () => null }));
vi.mock('@/components/dashboard/StyleIdentityCards', () => ({ default: () => null }));
vi.mock('@/components/dashboard/QuickActions', () => ({ default: () => null }));
vi.mock('@/components/dashboard/DiscoveryQuizzes', () => ({ default: () => null }));
vi.mock('@/components/dashboard/SkincareGuide', () => ({ default: () => null }));
vi.mock('@/components/dashboard/AnalysisHistory', () => ({ default: () => null }));
vi.mock('@/components/dashboard/EmptyCTA', () => ({ default: () => null }));
vi.mock('@/components/dashboard/EmailVerificationBanner', () => ({ default: () => null }));

import Dashboard from '../../../src/app/dashboard/page';
import { apiFetch } from '@/lib/api';

const mockApiFetch = vi.mocked(apiFetch);
let dailyOutfitResponses: Array<Promise<Response>>;

function response(status: number, data?: unknown): Response {
    return {
        ok: status >= 200 && status < 300,
        status,
        json: vi.fn().mockResolvedValue(data),
    } as unknown as Response;
}

function successfulOutfit(): Response {
    return response(200, {
        date: '2026-11-23',
        slots: {
            top: {
                id: 'top-1',
                dominant_color: '#112233',
                match_score: 92,
                image_filename: 'top.jpg',
                category: 'Top',
            },
            bottom: null,
            shoes: null,
            accessory: null,
        },
        filled_count: 1,
        total_slots: 4,
    });
}

describe('Dashboard daily outfit retry', () => {
    beforeEach(() => {
        dailyOutfitResponses = [];
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        mockApiFetch.mockImplementation((path) => {
            if (path === '/api/daily-outfit') {
                const next = dailyOutfitResponses.shift();
                if (!next) throw new Error('Missing daily-outfit test response');
                return next;
            }
            if (path === '/api/analysis/?limit=20') {
                return Promise.resolve(response(200, []));
            }
            throw new Error(`Unexpected API path: ${path}`);
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('moves from an HTTP failure through retry loading to success without duplicate requests', async () => {
        let resolveRetry!: (value: Response) => void;
        dailyOutfitResponses.push(
            Promise.resolve(response(500)),
            new Promise<Response>((resolve) => { resolveRetry = resolve; }),
        );

        render(<Dashboard />);

        const retry = await screen.findByRole('button', { name: 'Retry' });
        fireEvent.click(retry);
        fireEvent.click(retry);

        expect(screen.getByRole('status')).toHaveTextContent(/Loading today's outfit/i);
        expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
        expect(mockApiFetch.mock.calls.filter(([path]) => path === '/api/daily-outfit')).toHaveLength(2);

        await act(async () => { resolveRetry(successfulOutfit()); });

        expect(await screen.findByText('Your outfit for 2026-11-23')).toBeInTheDocument();
        expect(screen.queryByText(/Could not load/i)).not.toBeInTheDocument();
    });

    it('moves from a network failure through retry to the 404 empty state', async () => {
        dailyOutfitResponses.push(
            Promise.reject(new Error('network unavailable')),
            Promise.resolve(response(404)),
        );

        render(<Dashboard />);

        fireEvent.click(await screen.findByRole('button', { name: 'Retry' }));

        expect(await screen.findByText(/Add items to your wardrobe/i)).toBeInTheDocument();
        expect(screen.queryByText(/Could not load/i)).not.toBeInTheDocument();
        await waitFor(() => {
            expect(mockApiFetch.mock.calls.filter(([path]) => path === '/api/daily-outfit')).toHaveLength(2);
        });
    });
});
