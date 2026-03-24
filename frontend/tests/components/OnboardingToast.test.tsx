import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import OnboardingToast from '../../src/components/OnboardingToast';

describe('OnboardingToast Component', () => {
    beforeEach(() => {
        // Clear localStorage so the toast is visible
        const store: Record<string, string> = {};
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(
            (key: string) => store[key] ?? null
        );
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(
            (key: string, value: string) => {
                store[key] = value;
            }
        );
    });

    it('renders first step title', () => {
        render(<OnboardingToast />);
        expect(screen.getByText('Your Color Season')).toBeInTheDocument();
    });

    it('shows progress dots', () => {
        render(<OnboardingToast />);
        // There are 4 onboarding steps, so 4 progress dots (small divs)
        // The step indicator text confirms the count
        expect(screen.getByText(/Step 1 of 4/i)).toBeInTheDocument();
    });

    it('has dismiss button', () => {
        render(<OnboardingToast />);
        expect(screen.getByText('Dismiss')).toBeInTheDocument();
    });

    it('has Next button', () => {
        render(<OnboardingToast />);
        expect(screen.getByText('Next')).toBeInTheDocument();
    });
});
