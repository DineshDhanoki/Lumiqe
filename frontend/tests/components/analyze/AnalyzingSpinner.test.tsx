import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AnalyzingSpinner from '../../../src/components/analyze/AnalyzingSpinner';

vi.mock('@/lib/i18n', () => ({
    t: (_lang: string, key: string) => key,
}));

describe('AnalyzingSpinner', () => {
    it('has role=status for screen readers', () => {
        render(<AnalyzingSpinner lang="en" previewUrl={null} />);
        expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('has aria-live=polite', () => {
        render(<AnalyzingSpinner lang="en" previewUrl={null} />);
        expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    });

    it('renders i18n analyzing key', () => {
        render(<AnalyzingSpinner lang="en" previewUrl={null} />);
        expect(screen.getByText('analyzing')).toBeInTheDocument();
    });

    it('renders i18n analyzingSubtitle key', () => {
        render(<AnalyzingSpinner lang="en" previewUrl={null} />);
        expect(screen.getByText('analyzingSubtitle')).toBeInTheDocument();
    });

    it('shows preview image when previewUrl is provided', () => {
        render(<AnalyzingSpinner lang="en" previewUrl="data:image/jpeg;base64,/test" />);
        const img = screen.getByAltText('Scanning');
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src', 'data:image/jpeg;base64,/test');
    });

    it('does not render image when previewUrl is null', () => {
        render(<AnalyzingSpinner lang="en" previewUrl={null} />);
        expect(screen.queryByAltText('Scanning')).not.toBeInTheDocument();
    });
});
