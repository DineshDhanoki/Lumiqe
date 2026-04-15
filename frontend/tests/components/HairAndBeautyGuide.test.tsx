import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HairAndBeautyGuide from '../../src/components/HairAndBeautyGuide';

const defaultProps = {
    season: 'Soft Autumn',
    hairColors: {
        best_natural: ['Warm Brown', 'Chestnut'],
        highlights: ['Caramel Balayage', 'Golden Blonde'],
        avoid: ['Ash Blonde', 'Cool Black'],
    },
    makeupExtended: {
        foundation: 'Warm beige with yellow undertones',
        concealer: 'Peach-toned under-eye',
        lips_shades: ['Terracotta', 'Dusty Rose', 'Warm Nude'],
        eyeliner: 'Brown or bronze',
        mascara: 'Warm brown',
        brow_color: 'Soft taupe',
    },
    makeupBase: {
        lips: '#C17A5A',
        blush: '#E8A87C',
        eyeshadow: '#8B6347',
    },
};

describe('HairAndBeautyGuide Component', () => {
    it('renders the editorial header', () => {
        render(<HairAndBeautyGuide {...defaultProps} />);
        expect(screen.getByText(/The Beauty Edit/i)).toBeInTheDocument();
        expect(screen.getByText(/Hair & Beauty/i)).toBeInTheDocument();
    });

    it('renders the season name', () => {
        render(<HairAndBeautyGuide {...defaultProps} />);
        expect(screen.getByText(/Soft Autumn/i)).toBeInTheDocument();
    });

    it('renders hair color guide section', () => {
        render(<HairAndBeautyGuide {...defaultProps} />);
        expect(screen.getByText(/Hair Color Guide/i)).toBeInTheDocument();
        expect(screen.getByText(/Best Natural Shades/i)).toBeInTheDocument();
    });

    it('renders best natural hair shades', () => {
        render(<HairAndBeautyGuide {...defaultProps} />);
        expect(screen.getByText('Warm Brown')).toBeInTheDocument();
        expect(screen.getByText('Chestnut')).toBeInTheDocument();
    });

    it('renders highlights section', () => {
        render(<HairAndBeautyGuide {...defaultProps} />);
        expect(screen.getByText(/Highlights/i)).toBeInTheDocument();
        expect(screen.getByText(/Caramel Balayage/i)).toBeInTheDocument();
        expect(screen.getByText(/Golden Blonde/i)).toBeInTheDocument();
    });

    it('renders avoid hair shades with strikethrough style', () => {
        render(<HairAndBeautyGuide {...defaultProps} />);
        expect(screen.getByText('Ash Blonde')).toBeInTheDocument();
        expect(screen.getByText('Cool Black')).toBeInTheDocument();
    });

    it('renders complete makeup guide section', () => {
        render(<HairAndBeautyGuide {...defaultProps} />);
        expect(screen.getByText(/Complete Makeup Guide/i)).toBeInTheDocument();
    });

    it('renders makeup detail rows', () => {
        render(<HairAndBeautyGuide {...defaultProps} />);
        expect(screen.getByText(/Foundation/i)).toBeInTheDocument();
        expect(screen.getByText('Warm beige with yellow undertones')).toBeInTheDocument();
        expect(screen.getByText(/Eyeliner/i)).toBeInTheDocument();
        expect(screen.getByText('Brown or bronze')).toBeInTheDocument();
    });

    it('renders lip shade spectrum', () => {
        render(<HairAndBeautyGuide {...defaultProps} />);
        expect(screen.getByText(/Lip Shade Spectrum/i)).toBeInTheDocument();
        expect(screen.getByText('Terracotta')).toBeInTheDocument();
        expect(screen.getByText('Dusty Rose')).toBeInTheDocument();
        expect(screen.getByText('Warm Nude')).toBeInTheDocument();
    });

    it('renders hero swatch hex codes', () => {
        render(<HairAndBeautyGuide {...defaultProps} />);
        expect(screen.getByText('#C17A5A')).toBeInTheDocument();
        expect(screen.getByText('#E8A87C')).toBeInTheDocument();
        expect(screen.getByText('#8B6347')).toBeInTheDocument();
    });

    it('skips hair sections when arrays are empty', () => {
        const props = {
            ...defaultProps,
            hairColors: { best_natural: [], highlights: [], avoid: [] },
        };
        render(<HairAndBeautyGuide {...props} />);
        expect(screen.queryByText(/Best Natural Shades/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Highlights/i)).not.toBeInTheDocument();
    });

    it('skips lip shade spectrum when array is empty', () => {
        const props = {
            ...defaultProps,
            makeupExtended: { ...defaultProps.makeupExtended, lips_shades: [] },
        };
        render(<HairAndBeautyGuide {...props} />);
        expect(screen.queryByText(/Lip Shade Spectrum/i)).not.toBeInTheDocument();
    });
});
