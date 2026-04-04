import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import OverviewTab from '../../../src/components/results/OverviewTab';

vi.mock('@/lib/hooks/useTranslation', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

// Mock heavy sub-components to keep tests fast and isolated
vi.mock('@/components/SkinProfileCard', () => ({
    default: ({ hexColor, undertone }: { hexColor: string; undertone: string }) => (
        <div data-testid="skin-profile-card" data-hex={hexColor} data-undertone={undertone} />
    ),
}));
vi.mock('@/components/BestAvoidColors', () => ({
    default: () => <div data-testid="best-avoid-colors" />,
}));
vi.mock('@/components/CelebrityMatch', () => ({
    default: () => <div data-testid="celebrity-match" />,
}));
vi.mock('@/components/PaletteDownload', () => ({
    default: () => <div data-testid="palette-download" />,
}));
vi.mock('@/components/StylingTips', () => ({
    default: () => <div data-testid="styling-tips" />,
}));
vi.mock('@/components/ShareButtons', () => ({
    default: () => <div data-testid="share-buttons" />,
}));
vi.mock('@/components/ShopYourColors', () => ({
    default: () => <div data-testid="shop-your-colors" />,
}));

const defaultProps = {
    season: 'Soft Autumn',
    hexColor: '#C4956A',
    undertone: 'warm',
    confidence: 0.91,
    contrastLevel: 'Medium',
    palette: ['#C4956A', '#8B7355', '#D4A76A'],
    avoidColors: ['#0000FF'],
    metal: 'Gold',
    tips: 'Wear earthy tones',
    celebrities: [{ name: 'Beyoncé', image: '/bey.jpg' }],
    makeup: { lips: '#B56A5A', blush: '#E8A898', eyeshadow: '#8B6060' },
    analysisId: undefined,
    session: null,
    onChatClick: vi.fn(),
};

describe('OverviewTab', () => {
    it('renders SkinProfileCard', () => {
        render(<OverviewTab {...defaultProps} />);
        expect(screen.getByTestId('skin-profile-card')).toBeInTheDocument();
    });

    it('passes hexColor and undertone to SkinProfileCard', () => {
        render(<OverviewTab {...defaultProps} />);
        const card = screen.getByTestId('skin-profile-card');
        expect(card).toHaveAttribute('data-hex', '#C4956A');
        expect(card).toHaveAttribute('data-undertone', 'warm');
    });

    it('renders contrast level badge', () => {
        render(<OverviewTab {...defaultProps} />);
        expect(screen.getByText('Medium')).toBeInTheDocument();
    });

    it('does not render contrast level badge when empty', () => {
        render(<OverviewTab {...defaultProps} contrastLevel="" />);
        expect(screen.queryByText('contrastLevelLabel')).not.toBeInTheDocument();
    });

    it('renders core palette section heading', () => {
        render(<OverviewTab {...defaultProps} />);
        expect(screen.getByText('corePalette')).toBeInTheDocument();
    });

    it('renders all palette color hex codes', () => {
        render(<OverviewTab {...defaultProps} />);
        expect(screen.getByText('#C4956A')).toBeInTheDocument();
        expect(screen.getByText('#8B7355')).toBeInTheDocument();
        expect(screen.getByText('#D4A76A')).toBeInTheDocument();
    });

    it('renders BestAvoidColors when both palette and avoidColors are present', () => {
        render(<OverviewTab {...defaultProps} />);
        expect(screen.getByTestId('best-avoid-colors')).toBeInTheDocument();
    });

    it('does not render BestAvoidColors when avoidColors is empty', () => {
        render(<OverviewTab {...defaultProps} avoidColors={[]} />);
        expect(screen.queryByTestId('best-avoid-colors')).not.toBeInTheDocument();
    });

    it('renders the metal section with Gold', () => {
        render(<OverviewTab {...defaultProps} />);
        expect(screen.getByText('Gold')).toBeInTheDocument();
        expect(screen.getByText('bestMetal')).toBeInTheDocument();
    });

    it('renders makeup section when makeup colors are provided', () => {
        render(<OverviewTab {...defaultProps} />);
        expect(screen.getByText('idealMakeupShades')).toBeInTheDocument();
        expect(screen.getByText('Lips')).toBeInTheDocument();
        expect(screen.getByText('Blush')).toBeInTheDocument();
        expect(screen.getByText('Eyes')).toBeInTheDocument();
    });

    it('does not render makeup section when all makeup fields are empty', () => {
        render(<OverviewTab {...defaultProps} makeup={{ lips: '', blush: '', eyeshadow: '' }} />);
        expect(screen.queryByText('idealMakeupShades')).not.toBeInTheDocument();
    });

    it('renders ShopYourColors component', () => {
        render(<OverviewTab {...defaultProps} />);
        expect(screen.getByTestId('shop-your-colors')).toBeInTheDocument();
    });

    it('renders ShareButtons when analysisId is provided', () => {
        render(<OverviewTab {...defaultProps} analysisId="abc123" />);
        expect(screen.getByTestId('share-buttons')).toBeInTheDocument();
    });

    it('renders inline share buttons when no analysisId', () => {
        render(<OverviewTab {...defaultProps} analysisId={undefined} />);
        expect(screen.getByText('shareResults')).toBeInTheDocument();
        expect(screen.getByText('Share on WhatsApp')).toBeInTheDocument();
    });

    it('calls onChatClick when "Chat with AI Stylist" CTA is clicked', () => {
        const onChatClick = vi.fn();
        render(<OverviewTab {...defaultProps} onChatClick={onChatClick} />);
        fireEvent.click(screen.getByText('chatWithAIStylist'));
        expect(onChatClick).toHaveBeenCalledOnce();
    });

    it('renders clothing suggestions for palette colors', () => {
        render(<OverviewTab {...defaultProps} />);
        expect(screen.getByText('Wear These Colors As')).toBeInTheDocument();
    });
});
