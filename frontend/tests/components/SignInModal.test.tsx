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

    it('shows name field when in sign-up mode', async () => {
        const user = userEvent.setup();
        render(<SignInModal {...defaultProps} />);

        // Switch to sign-up mode
        const toggleButton = screen.getByText(/Don't have an account\? Sign Up/i);
        await user.click(toggleButton);

        expect(screen.getByLabelText('Full name')).toBeInTheDocument();
    });

    it('shows "Forgot your password?" link in login mode', () => {
        render(<SignInModal {...defaultProps} />);
        expect(screen.getByText('Forgot your password?')).toBeInTheDocument();
    });

    it('hides forgot password link in sign-up mode', async () => {
        const user = userEvent.setup();
        render(<SignInModal {...defaultProps} />);

        const toggleButton = screen.getByText(/Don't have an account\? Sign Up/i);
        await user.click(toggleButton);

        expect(screen.queryByText('Forgot your password?')).not.toBeInTheDocument();
    });

    it('shows error message when error state is set', async () => {
        const user = userEvent.setup();
        render(<SignInModal {...defaultProps} />);

        // Submit the form without filling in fields to trigger the error
        const submitButton = screen.getByRole('button', { name: /Sign In/i });
        await user.click(submitButton);

        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText('Please fill in all required fields.')).toBeInTheDocument();
    });

    it('email validation shows error for invalid email format', async () => {
        render(<SignInModal {...defaultProps} />);

        const emailInput = screen.getByLabelText('Email address') as HTMLInputElement;

        // React 19 controlled inputs: call the React onChange handler directly,
        // then trigger blur after React has re-rendered with the new state.
        const getReactProps = (el: HTMLElement) => {
            const key = Object.keys(el).find(k => k.startsWith('__reactProps'));
            return key ? (el as Record<string, any>)[key] : {};
        };

        await act(async () => {
            getReactProps(emailInput).onChange({ target: { value: 'invalid-email' } });
        });

        // After re-render, trigger onBlur which reads updated state
        await act(async () => {
            const freshInput = screen.getByLabelText('Email address');
            getReactProps(freshInput).onBlur();
        });

        expect(screen.getByText('Please enter a valid email address.')).toBeInTheDocument();
    });
});
