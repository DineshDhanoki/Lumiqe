import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SkincareGuide from '../../../src/components/dashboard/SkincareGuide';

vi.mock('@/lib/hooks/useTranslation', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

describe('SkincareGuide', () => {
    it('renders routine heading for warm undertone', () => {
        render(<SkincareGuide undertone="warm" />);
        expect(screen.getByText('Routine for warm undertones')).toBeInTheDocument();
    });

    it('renders warm-specific ingredient (Vitamin C)', () => {
        render(<SkincareGuide undertone="warm" />);
        expect(screen.getByText('Vitamin C')).toBeInTheDocument();
    });

    it('renders routine heading for cool undertone', () => {
        render(<SkincareGuide undertone="cool" />);
        expect(screen.getByText('Routine for cool undertones')).toBeInTheDocument();
    });

    it('renders cool-specific ingredient (Hyaluronic acid)', () => {
        render(<SkincareGuide undertone="cool" />);
        expect(screen.getByText('Hyaluronic acid')).toBeInTheDocument();
    });

    it('renders routine heading for neutral undertone', () => {
        render(<SkincareGuide undertone="neutral" />);
        expect(screen.getByText('Routine for neutral undertones')).toBeInTheDocument();
    });

    it('renders neutral-specific ingredient (Squalane)', () => {
        render(<SkincareGuide undertone="neutral" />);
        expect(screen.getByText('Squalane')).toBeInTheDocument();
    });

    it('falls back to neutral routine for unknown undertone', () => {
        render(<SkincareGuide undertone="unknown" />);
        expect(screen.getByText('Squalane')).toBeInTheDocument();
    });

    it('renders daily routine steps as a numbered list', () => {
        render(<SkincareGuide undertone="warm" />);
        expect(screen.getByText('dailyRoutine')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('renders keyIngredients and avoid sections', () => {
        render(<SkincareGuide undertone="warm" />);
        expect(screen.getByText('keyIngredients')).toBeInTheDocument();
        expect(screen.getByText('avoid')).toBeInTheDocument();
    });
});
