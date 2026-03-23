import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SkipLink from '../../src/components/ui/SkipLink';

describe('SkipLink', () => {
    it('renders "Skip to main content" text', () => {
        render(<SkipLink />);
        expect(screen.getByText('Skip to main content')).toBeDefined();
    });

    it('links to #main-content', () => {
        render(<SkipLink />);
        const link = screen.getByRole('link', { name: 'Skip to main content' });
        expect(link.getAttribute('href')).toBe('#main-content');
    });

    it('has sr-only class', () => {
        render(<SkipLink />);
        const link = screen.getByRole('link', { name: 'Skip to main content' });
        expect(link.className).toContain('sr-only');
    });
});
