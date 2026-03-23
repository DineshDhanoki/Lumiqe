import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SkeletonGrid, SkeletonCard, SkeletonSpinner } from '../../src/components/ui/SkeletonLoader';

describe('SkeletonGrid', () => {
    it('renders default 6 cards', () => {
        const { container } = render(<SkeletonGrid />);
        const cards = container.querySelectorAll('.animate-pulse');
        expect(cards).toHaveLength(6);
    });

    it('renders custom count', () => {
        const { container } = render(<SkeletonGrid count={3} />);
        const cards = container.querySelectorAll('.animate-pulse');
        expect(cards).toHaveLength(3);
    });
});

describe('SkeletonCard', () => {
    it('has animate-pulse class', () => {
        const { container } = render(<SkeletonCard />);
        const root = container.firstElementChild;
        expect(root?.className).toContain('animate-pulse');
    });

    it('renders image and text placeholders', () => {
        const { container } = render(<SkeletonCard />);
        // Image placeholder is the aspect-ratio div
        const imagePlaceholder = container.querySelector('.aspect-\\[3\\/4\\]');
        expect(imagePlaceholder).not.toBeNull();
        // Text placeholders (3 rounded divs inside p-4 container)
        const textContainer = container.querySelector('.space-y-2');
        expect(textContainer?.children.length).toBe(3);
    });
});

describe('SkeletonSpinner', () => {
    it('renders with text', () => {
        render(<SkeletonSpinner text="Loading results..." />);
        expect(screen.getByText('Loading results...')).toBeDefined();
    });

    it('does not render text when none provided', () => {
        const { container } = render(<SkeletonSpinner />);
        const paragraphs = container.querySelectorAll('p');
        expect(paragraphs).toHaveLength(0);
    });

    it('has animate-spin class on spinner element', () => {
        const { container } = render(<SkeletonSpinner />);
        const spinner = container.querySelector('.animate-spin');
        expect(spinner).not.toBeNull();
    });
});
