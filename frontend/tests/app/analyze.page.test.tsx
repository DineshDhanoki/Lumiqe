import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
    apiFetch: vi.fn(),
}));

vi.mock('@/lib/api', () => ({ apiFetch: mocks.apiFetch }));
vi.mock('@/lib/store', () => ({
    useLumiqeStore: (selector: (state: { user: null }) => unknown) => selector({ user: null }),
}));
vi.mock('@/lib/imageUtils', () => ({
    compressImage: vi.fn(),
    storeThumbnail: vi.fn(),
}));
vi.mock('@/components/ScanGuide', () => ({ default: () => null }));
vi.mock('@/components/CameraCapture', () => ({ default: () => null }));
vi.mock('@/components/analyze/AnalyzingSpinner', () => ({ default: () => null }));
vi.mock('@/components/analyze/MultiPhotoUpload', () => ({ default: () => null }));
vi.mock('@/components/layout/AppLayout', () => ({
    default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/components/LanguageSwitcher', () => ({ default: () => null }));

import AnalyzePage from '@/app/analyze/page';

describe('AnalyzePage photo upload validation', () => {
    it('shows a helpful error when a non-image file is selected', () => {
        render(<AnalyzePage />);

        const input = screen.getByLabelText('Choose a photo to upload');
        const file = new File(['not an image'], 'notes.txt', { type: 'text/plain' });

        fireEvent.change(input, { target: { files: [file] } });

        expect(screen.getByText('Please use a valid image (JPEG, PNG, WebP).')).toBeVisible();
        expect(mocks.apiFetch).not.toHaveBeenCalled();
    });
});
