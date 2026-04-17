'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token') || '';

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [status, setStatus] = useState<'form' | 'success' | 'error'>('form');
    const [errorMessage, setErrorMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();

        if (newPassword !== confirmPassword) {
            setErrorMessage('Passwords do not match.');
            setStatus('error');
            return;
        }

        if (newPassword.length < 8) {
            setErrorMessage('Password must be at least 8 characters.');
            setStatus('error');
            return;
        }

        setIsSubmitting(true);
        setStatus('form');
        setErrorMessage('');

        try {
            const response = await fetch('/api/proxy/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, new_password: newPassword }),
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.detail || data.error || 'Failed to reset password.');
            }

            setStatus('success');
        } catch (err) {
            setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred.');
            setStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    }

    if (status === 'success') {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-surface-container/50 border border-primary/10 rounded-2xl p-8 text-center space-y-6">
                    <span className="material-symbols-outlined text-6xl text-primary block mx-auto" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <h1 className="text-2xl font-display italic text-on-surface">Password Reset!</h1>
                    <p className="text-on-surface-variant/60">
                        Your password has been successfully reset. You can now sign in with your new password.
                    </p>
                    <Link
                        href="/"
                        className="inline-block px-6 py-3 bg-primary-container rounded-[10px] text-on-primary font-headline font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all"
                    >
                        Go to Sign In
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-surface-container/50 border border-primary/10 rounded-2xl p-8 space-y-6">
                <div className="text-center space-y-2">
                    <span className="material-symbols-outlined text-5xl text-primary block mx-auto">lock</span>
                    <h1 className="text-2xl font-bold text-on-surface">Reset Your Password</h1>
                    <p className="text-on-surface/60 text-sm">Enter your new password below.</p>
                </div>

                {status === 'error' && (
                    <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-xl p-3 text-sm text-primary">
                        <span className="material-symbols-outlined text-base flex-shrink-0">error</span>
                        <span>{errorMessage}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="new-password" className="block text-sm font-medium text-on-surface/80">
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                id="new-password"
                                type={showNewPassword ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                minLength={8}
                                className="w-full px-4 py-3 bg-surface-container/30 border border-primary/10 rounded-xl text-on-surface placeholder-on-surface-variant/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary pr-12"
                                placeholder="Enter new password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface/40 hover:text-on-surface/70 transition-colors"
                            >
                                {showNewPassword ? <span className="material-symbols-outlined text-xl">visibility_off</span> : <span className="material-symbols-outlined text-xl">visibility</span>}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="confirm-password" className="block text-sm font-medium text-on-surface/80">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <input
                                id="confirm-password"
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={8}
                                className="w-full px-4 py-3 bg-surface-container/30 border border-primary/10 rounded-xl text-on-surface placeholder-on-surface-variant/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary pr-12"
                                placeholder="Confirm new password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface/40 hover:text-on-surface/70 transition-colors"
                            >
                                {showConfirmPassword ? <span className="material-symbols-outlined text-xl">visibility_off</span> : <span className="material-symbols-outlined text-xl">visibility</span>}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 bg-primary-container rounded-[10px] text-on-primary font-headline font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>

                <p className="text-center text-sm text-on-surface/40">
                    <Link href="/" className="text-primary hover:text-primary transition-colors">
                        Back to Home
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-background flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            }
        >
            <ResetPasswordForm />
        </Suspense>
    );
}
