import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MultiPhotoUpload from '../../../src/components/analyze/MultiPhotoUpload';

vi.mock('@/lib/i18n', () => ({
    t: (_lang: string, key: string) => key,
}));

// URL.createObjectURL is not in jsdom
vi.stubGlobal('URL', { ...URL, createObjectURL: vi.fn(() => 'blob:mock'), revokeObjectURL: vi.fn() });

describe('MultiPhotoUpload', () => {
    const defaultProps = {
        lang: 'en',
        apiError: null,
        onAnalyze: vi.fn(),
        onBack: vi.fn(),
    };

    it('renders the multi-photo header', () => {
        render(<MultiPhotoUpload {...defaultProps} />);
        expect(screen.getByText('Multi-Photo Analysis')).toBeInTheDocument();
    });

    it('analyze button is disabled with 0 files', () => {
        render(<MultiPhotoUpload {...defaultProps} />);
        expect(screen.getByRole('button', { name: /Analyze 0/i })).toBeDisabled();
    });

    it('shows file counter text', () => {
        render(<MultiPhotoUpload {...defaultProps} />);
        expect(screen.getByText('0/5 photos added · Minimum 2 required')).toBeInTheDocument();
    });

    it('shows apiError when provided', () => {
        render(<MultiPhotoUpload {...defaultProps} apiError="Upload failed" />);
        expect(screen.getByText('Upload failed')).toBeInTheDocument();
    });

    it('calls onBack when back button is clicked', () => {
        const onBack = vi.fn();
        render(<MultiPhotoUpload {...defaultProps} onBack={onBack} />);
        fireEvent.click(screen.getByText('back'));
        expect(onBack).toHaveBeenCalledOnce();
    });

    it('shows validation error for non-image file', () => {
        render(<MultiPhotoUpload {...defaultProps} />);
        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        const pdf = new File(['content'], 'doc.pdf', { type: 'application/pdf' });
        fireEvent.change(input, { target: { files: [pdf] } });
        expect(screen.getByText(/valid image/i)).toBeInTheDocument();
    });

    it('shows validation error for file over 5MB', () => {
        render(<MultiPhotoUpload {...defaultProps} />);
        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        const big = new File([new Uint8Array(6 * 1024 * 1024)], 'huge.jpg', { type: 'image/jpeg' });
        fireEvent.change(input, { target: { files: [big] } });
        expect(screen.getByText(/under 5MB/i)).toBeInTheDocument();
    });

    it('adds a valid image and enables analyze button after 2 files', () => {
        render(<MultiPhotoUpload {...defaultProps} />);
        const addImage = () => {
            const input = document.querySelector('input[type="file"]') as HTMLInputElement;
            const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });
            fireEvent.change(input, { target: { files: [file] } });
        };
        addImage();
        addImage();
        expect(screen.getByRole('button', { name: /Analyze 2 Photos/i })).not.toBeDisabled();
    });

    it('calls onAnalyze with the files when analyze button is clicked', () => {
        const onAnalyze = vi.fn();
        render(<MultiPhotoUpload {...defaultProps} onAnalyze={onAnalyze} />);
        const addImage = () => {
            const input = document.querySelector('input[type="file"]') as HTMLInputElement;
            const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });
            fireEvent.change(input, { target: { files: [file] } });
        };
        addImage();
        addImage();
        fireEvent.click(screen.getByRole('button', { name: /Analyze 2 Photos/i }));
        expect(onAnalyze).toHaveBeenCalledOnce();
        expect(onAnalyze.mock.calls[0][0]).toHaveLength(2);
    });
});
