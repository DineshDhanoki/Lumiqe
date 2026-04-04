import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ModeChooser from '../../../src/components/analyze/ModeChooser';

vi.mock('@/lib/i18n', () => ({
    t: (_lang: string, key: string) => key,
}));

describe('ModeChooser', () => {
    const defaultProps = {
        lang: 'en',
        onSelectCamera: vi.fn(),
        onSelectUpload: vi.fn(),
        onSelectMulti: vi.fn(),
    };

    it('renders camera option with i18n key', () => {
        render(<ModeChooser {...defaultProps} />);
        expect(screen.getByText('liveCamera')).toBeInTheDocument();
    });

    it('renders upload option with i18n key', () => {
        render(<ModeChooser {...defaultProps} />);
        expect(screen.getByText('uploadPhoto')).toBeInTheDocument();
    });

    it('renders multi-photo option', () => {
        render(<ModeChooser {...defaultProps} />);
        expect(screen.getByText('Multi-Photo Analysis')).toBeInTheDocument();
    });

    it('shows Recommended badge on camera option', () => {
        render(<ModeChooser {...defaultProps} />);
        expect(screen.getByText('recommended')).toBeInTheDocument();
    });

    it('shows quality guidance section', () => {
        render(<ModeChooser {...defaultProps} />);
        expect(screen.getByText(/For accurate results/i)).toBeInTheDocument();
    });

    it('calls onSelectCamera when camera button is clicked', () => {
        const onSelectCamera = vi.fn();
        render(<ModeChooser {...defaultProps} onSelectCamera={onSelectCamera} />);
        fireEvent.click(screen.getByText('liveCamera').closest('button')!);
        expect(onSelectCamera).toHaveBeenCalledOnce();
    });

    it('calls onSelectUpload when upload button is clicked', () => {
        const onSelectUpload = vi.fn();
        render(<ModeChooser {...defaultProps} onSelectUpload={onSelectUpload} />);
        fireEvent.click(screen.getByText('uploadPhoto').closest('button')!);
        expect(onSelectUpload).toHaveBeenCalledOnce();
    });

    it('calls onSelectMulti when multi-photo button is clicked', () => {
        const onSelectMulti = vi.fn();
        render(<ModeChooser {...defaultProps} onSelectMulti={onSelectMulti} />);
        fireEvent.click(screen.getByText('Multi-Photo Analysis').closest('button')!);
        expect(onSelectMulti).toHaveBeenCalledOnce();
    });
});
