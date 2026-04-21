import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import HeroSection from '../../src/components/HeroSection';

describe('HeroSection Component', () => {
    it('renders headline and subtitle', () => {
        render(<HeroSection onOpenAuth={() => { }} />);
        expect(screen.getByText(/Discover Your/i)).toBeInTheDocument();
        expect(screen.getByText(/True Colors/i)).toBeInTheDocument();
        expect(
            screen.getByText(/Stop guessing. Let Lumiqe's AI analyze your skin tone/i)
        ).toBeInTheDocument();
    });

    it('renders CTAs', () => {
        render(<HeroSection onOpenAuth={() => { }} />);
        expect(screen.getByRole('button', { name: /Analyze My Colors/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /View Sample Report/i })).toBeInTheDocument();
    });

    it('calls onOpenAuth when CTA is clicked', async () => {
        const handleOpenAuth = vi.fn();
        render(<HeroSection onOpenAuth={handleOpenAuth} />);

        const btn = screen.getByRole('button', { name: /Analyze My Colors/i });
        btn.click();
        expect(handleOpenAuth).toHaveBeenCalledTimes(1);
    });
});
