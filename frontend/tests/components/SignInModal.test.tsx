import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import userEvent from '@testing-library/user-event';
import SignInModal from '../../src/components/SignInModal';

describe('SignInModal Component', () => {
    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
    };

    it('renders email and password inputs', () => {
        render(<SignInModal {...defaultProps} />);
        expect(screen.getByLabelText('Email address')).toBeInTheDocument();
        expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });

    it('shows name fields when in sign-up mode', async () => {
        const user = userEvent.setup();
        render(<SignInModal {...defaultProps} />);

        // Toggle button text is split across elements — use a role query
        const toggleButton = screen.getByRole('button', { name: /sign up/i });
        await user.click(toggleButton);

        expect(screen.getByLabelText('First name')).toBeInTheDocument();
        expect(screen.getByLabelText('Last name')).toBeInTheDocument();
    });

    it('shows "Forgot password?" link in login mode', () => {
        render(<SignInModal {...defaultProps} />);
        expect(screen.getByText('Forgot password?')).toBeInTheDocument();
    });

    it('hides forgot password link in sign-up mode', async () => {
        const user = userEvent.setup();
        render(<SignInModal {...defaultProps} />);

        const toggleButton = screen.getByRole('button', { name: /sign up/i });
        await user.click(toggleButton);

        expect(screen.queryByText('Forgot password?')).not.toBeInTheDocument();
    });

    it('shows error message when error state is set', async () => {
        const user = userEvent.setup();
        render(<SignInModal {...defaultProps} />);

        const submitButton = screen.getByRole('button', { name: /Sign In/i });
        await user.click(submitButton);

        // Inline field errors appear instead of a top-level alert
        expect(screen.getByText('Email is required.')).toBeInTheDocument();
        expect(screen.getByText('Password is required.')).toBeInTheDocument();
    });

    it('email validation shows error for invalid email format', async () => {
        render(<SignInModal {...defaultProps} />);

        const emailInput = screen.getByLabelText('Email address') as HTMLInputElement;

        const getReactProps = (el: HTMLElement) => {
            const key = Object.keys(el).find(k => k.startsWith('__reactProps'));
            return key ? (el as Record<string, any>)[key] : {};
        };

        await act(async () => {
            getReactProps(emailInput).onChange({ target: { value: 'invalid-email' } });
        });

        await act(async () => {
            const freshInput = screen.getByLabelText('Email address');
            getReactProps(freshInput).onBlur();
        });

        expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument();
    });
});
