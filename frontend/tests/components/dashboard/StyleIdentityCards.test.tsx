import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import StyleIdentityCards from '../../../src/components/dashboard/StyleIdentityCards';

vi.mock('@/lib/hooks/useTranslation', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

const mockAnalysis = {
    id: 'abc',
    season: 'Soft Autumn',
    hexColor: '#C4956A',
    undertone: 'warm',
    confidence: 0.91,
    contrastLevel: 'Medium',
    palette: ['#C4956A', '#8B7355'],
    metal: 'Gold',
    timestamp: Date.now(),
};

describe('StyleIdentityCards', () => {
    it('shows noAnalysisYet when no analysis data', () => {
        render(<StyleIdentityCards lastAnalysis={null} bodyShape={null} stylePersonality={null} />);
        expect(screen.getByText('noAnalysisYet')).toBeInTheDocument();
    });

    it('shows season name when analysis is present', () => {
        render(<StyleIdentityCards lastAnalysis={mockAnalysis} bodyShape={null} stylePersonality={null} />);
        expect(screen.getByText('Soft Autumn')).toBeInTheDocument();
    });

    it('shows undertone in the season card', () => {
        render(<StyleIdentityCards lastAnalysis={mockAnalysis} bodyShape={null} stylePersonality={null} />);
        expect(screen.getByText(/warm undertone/i)).toBeInTheDocument();
    });

    it('shows notTakenYet for body shape and personality when unset', () => {
        render(<StyleIdentityCards lastAnalysis={null} bodyShape={null} stylePersonality={null} />);
        expect(screen.getAllByText('notTakenYet')).toHaveLength(2);
    });

    it('renders body shape label for hourglass', () => {
        const bodyShape = { shape: 'hourglass', timestamp: Date.now() };
        render(<StyleIdentityCards lastAnalysis={null} bodyShape={bodyShape} stylePersonality={null} />);
        expect(screen.getByText('Hourglass')).toBeInTheDocument();
    });

    it('renders body shape emoji for pear', () => {
        const bodyShape = { shape: 'pear', timestamp: Date.now() };
        render(<StyleIdentityCards lastAnalysis={null} bodyShape={bodyShape} stylePersonality={null} />);
        expect(screen.getByText('🍐')).toBeInTheDocument();
    });

    it('renders personality label for minimalist', () => {
        const stylePersonality = { personality: 'minimalist', timestamp: Date.now() };
        render(<StyleIdentityCards lastAnalysis={null} bodyShape={null} stylePersonality={stylePersonality} />);
        expect(screen.getByText('The Minimalist')).toBeInTheDocument();
    });

    it('renders personality label for romantic', () => {
        const stylePersonality = { personality: 'romantic', timestamp: Date.now() };
        render(<StyleIdentityCards lastAnalysis={null} bodyShape={null} stylePersonality={stylePersonality} />);
        expect(screen.getByText('The Romantic')).toBeInTheDocument();
    });

    it('shows retakeQuiz link when body shape is set', () => {
        const bodyShape = { shape: 'apple', timestamp: Date.now() };
        render(<StyleIdentityCards lastAnalysis={null} bodyShape={bodyShape} stylePersonality={null} />);
        const link = screen.getByText('retakeQuiz', { selector: 'a' });
        expect(link).toHaveAttribute('href', '/quiz/body-shape');
    });
});
