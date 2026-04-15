import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AIStylistChat from '../../src/components/AIStylistChat';

// jsdom doesn't implement scrollIntoView
beforeAll(() => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
});

// Prevent actual API calls
vi.mock('@/lib/api', () => ({
    apiFetch: vi.fn(() => Promise.resolve({ ok: false })),
}));

const defaultProps = {
    season: 'True Autumn',
    undertone: 'warm',
    contrastLevel: 'medium',
    styleArchetype: 'The Earth Muse',
    signatureColorName: 'Warm Cognac',
    metal: 'gold',
};

describe('AIStylistChat Component', () => {
    it('renders the editorial header', () => {
        render(<AIStylistChat {...defaultProps} />);
        expect(screen.getByText(/Lumiqe Intelligence/i)).toBeInTheDocument();
        expect(screen.getByText(/AI Stylist/i)).toBeInTheDocument();
    });

    it('renders the initial greeting message', () => {
        render(<AIStylistChat {...defaultProps} />);
        expect(screen.getByText(/True Autumn/i)).toBeInTheDocument();
        expect(screen.getByText(/The Earth Muse/i)).toBeInTheDocument();
        expect(screen.getByText(/warm undertones/i)).toBeInTheDocument();
    });

    it('renders starter questions when no user messages sent', () => {
        render(<AIStylistChat {...defaultProps} />);
        expect(screen.getByText(/What should I wear to a job interview/i)).toBeInTheDocument();
        expect(screen.getByText(/Can I wear black/i)).toBeInTheDocument();
        expect(screen.getByText(/What colours suit me for a wedding/i)).toBeInTheDocument();
    });

    it('renders input field and send button', () => {
        render(<AIStylistChat {...defaultProps} />);
        expect(screen.getByPlaceholderText(/Ask your stylist anything/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Send message/i })).toBeInTheDocument();
    });

    it('send button is disabled when input is empty', () => {
        render(<AIStylistChat {...defaultProps} />);
        const btn = screen.getByRole('button', { name: /Send message/i });
        expect(btn).toBeDisabled();
    });

    it('send button enables when input has text', () => {
        render(<AIStylistChat {...defaultProps} />);
        const input = screen.getByPlaceholderText(/Ask your stylist anything/i);
        fireEvent.change(input, { target: { value: 'What should I wear?' } });
        const btn = screen.getByRole('button', { name: /Send message/i });
        expect(btn).not.toBeDisabled();
    });

    it('typing in input updates its value', () => {
        render(<AIStylistChat {...defaultProps} />);
        const input = screen.getByPlaceholderText(/Ask your stylist anything/i) as HTMLInputElement;
        fireEvent.change(input, { target: { value: 'Hello stylist' } });
        expect(input.value).toBe('Hello stylist');
    });
});
