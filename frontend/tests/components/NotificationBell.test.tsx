import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationBell from '../../src/components/NotificationBell';

// Mock the apiFetch module used by NotificationBell
vi.mock('@/lib/api', () => ({
    apiFetch: vi.fn(),
}));

import { apiFetch } from '@/lib/api';
const mockApiFetch = vi.mocked(apiFetch);

function createMockResponse(data: unknown, ok = true): Response {
    return {
        ok,
        json: () => Promise.resolve(data),
        status: ok ? 200 : 500,
    } as Response;
}

describe('NotificationBell Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders bell button', async () => {
        mockApiFetch.mockResolvedValue(
            createMockResponse({ notifications: [], unread_count: 0 })
        );

        render(<NotificationBell />);
        const button = screen.getByRole('button', { name: /Notifications/i });
        expect(button).toBeInTheDocument();
    });

    it('shows unread badge when count > 0', async () => {
        mockApiFetch.mockResolvedValue(
            createMockResponse({ notifications: [], unread_count: 5 })
        );

        render(<NotificationBell />);

        await waitFor(() => {
            expect(screen.getByText('5')).toBeInTheDocument();
        });
    });

    it('hides badge when count is 0', async () => {
        mockApiFetch.mockResolvedValue(
            createMockResponse({ notifications: [], unread_count: 0 })
        );

        render(<NotificationBell />);

        await waitFor(() => {
            expect(mockApiFetch).toHaveBeenCalled();
        });

        // Badge has bg-primary class — should not exist when count is 0
        const button = screen.getByRole('button', { name: /Notifications/i });
        const badge = button.querySelector('.bg-primary.rounded-full');
        expect(badge).toBeNull();
    });

    it('opens dropdown on click', async () => {
        const user = userEvent.setup();
        mockApiFetch.mockResolvedValue(
            createMockResponse({ notifications: [], unread_count: 0 })
        );

        render(<NotificationBell />);

        const bellButton = screen.getByRole('button', { name: /Notifications/i });
        await user.click(bellButton);

        // The dropdown should now show the "Notifications" heading
        await waitFor(() => {
            expect(screen.getByText('Notifications')).toBeInTheDocument();
        });
    });

    it('shows "Mark all as read" button', async () => {
        const user = userEvent.setup();
        const notifications = [
            {
                id: 'n1',
                user_id: 1,
                title: 'Test Notification',
                message: 'Test message',
                type: 'info' as const,
                is_read: false,
                created_at: new Date().toISOString(),
            },
        ];

        mockApiFetch.mockResolvedValue(
            createMockResponse({ notifications, unread_count: 1 })
        );

        render(<NotificationBell />);

        // Wait for fetch, then open the dropdown
        await waitFor(() => {
            expect(mockApiFetch).toHaveBeenCalled();
        });

        const bellButton = screen.getByRole('button', { name: /Notifications/i });
        await user.click(bellButton);

        await waitFor(() => {
            expect(screen.getByText('Mark all read')).toBeInTheDocument();
        });
    });
});
