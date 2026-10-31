import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UploadDropzone from '../../../src/components/analyze/UploadDropzone';

vi.mock('@/lib/i18n', () => ({
    t: (_lang: string, key: string) => key,
}));

describe('UploadDropzone', () => {
    const defaultProps = {
        lang: 'en',
        error: null,
        onFile: vi.fn(),
        onBack: vi.fn(),
    };

    it('does not expose an inert button role on the dropzone wrapper', () => {
        render(<UploadDropzone {...defaultProps} />);
        expect(screen.queryByRole('button', { name: /upload a selfie/i })).not.toBeInTheDocument();
    });

    it('reaches the native file input by keyboard', async () => {
        const user = userEvent.setup();
        render(<UploadDropzone {...defaultProps} />);
        await user.tab();
        expect(document.activeElement).toHaveAttribute('aria-label', 'Choose a photo to upload');
    });

    it('renders upload labels from i18n keys', () => {
        render(<UploadDropzone {...defaultProps} />);
        expect(screen.getByText('tapToUpload')).toBeInTheDocument();
        expect(screen.getByText('dragDrop')).toBeInTheDocument();
        expect(screen.getByText('maxSize')).toBeInTheDocument();
    });

    it('has a file input that accepts images', () => {
        render(<UploadDropzone {...defaultProps} />);
        const input = screen.getByLabelText('Choose a photo to upload');
        expect(input).toHaveAttribute('type', 'file');
        expect(input).toHaveAttribute('accept', 'image/*');
    });

    it('shows error message when error prop is set', () => {
        render(<UploadDropzone {...defaultProps} error="File too large" />);
        expect(screen.getByText('File too large')).toBeInTheDocument();
    });

    it('announces errors through a live region', () => {
        render(<UploadDropzone {...defaultProps} error="File too large" />);
        const live = screen.getByRole('status');
        expect(live).toHaveAttribute('aria-live', 'polite');
        expect(live).toHaveTextContent('File too large');
    });

    it('keeps the live region mounted when there is no error', () => {
        render(<UploadDropzone {...defaultProps} />);
        expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('does not show error when error is null', () => {
        render(<UploadDropzone {...defaultProps} error={null} />);
        expect(screen.queryByText('File too large')).not.toBeInTheDocument();
    });

    it('calls onBack when back button is clicked', () => {
        const onBack = vi.fn();
        render(<UploadDropzone {...defaultProps} onBack={onBack} />);
        fireEvent.click(screen.getByText('back'));
        expect(onBack).toHaveBeenCalledOnce();
    });

    it('calls onFile when a file is selected via input', () => {
        const onFile = vi.fn();
        render(<UploadDropzone {...defaultProps} onFile={onFile} />);
        const input = screen.getByLabelText('Choose a photo to upload');
        const file = new File(['img'], 'selfie.jpg', { type: 'image/jpeg' });
        fireEvent.change(input, { target: { files: [file] } });
        expect(onFile).toHaveBeenCalledWith(file);
    });
});
