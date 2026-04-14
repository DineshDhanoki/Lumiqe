'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle } from 'lucide-react';

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
                <div className="max-w-md w-full bg-zinc-900/60 border border-white/10 rounded-2xl p-8 text-center space-y-6">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                    <h1 className="text-2xl font-bold text-on-surface">Password Reset!</h1>
                    <p className="text-on-surface/60">
                        Your password has been successfully reset. You can now sign in with your new password.
                    </p>
                    <Link
                        href="/"
                        className="inline-block px-6 py-3 bg-primary-container rounded-full text-on-surface font-medium hover:bg-red-500 transition-colors"
                    >
                        Go to Sign In
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-zinc-900/60 border border-white/10 rounded-2xl p-8 space-y-6">
                <div className="text-center space-y-2">
                    <Lock className="w-12 h-12 text-primary mx-auto" />
                    <h1 className="text-2xl font-bold text-on-surface">Reset Your Password</h1>
                    <p className="text-on-surface/60 text-sm">Enter your new password below.</p>
                </div>

                {status === 'error' && (
                    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-primary">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
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
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-on-surface placeholder-white/30 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 pr-12"
                                placeholder="Enter new password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface/40 hover:text-on-surface/70 transition-colors"
                            >
                                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-on-surface placeholder-white/30 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 pr-12"
                                placeholder="Confirm new password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface/40 hover:text-on-surface/70 transition-colors"
                            >
                                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 bg-primary-container rounded-full text-on-surface font-medium hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>

                <p className="text-center text-sm text-on-surface/40">
                    <Link href="/" className="text-primary hover:text-red-300 transition-colors">
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
                    <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                </div>
            }
        >
            <ResetPasswordForm />
        </Suspense>
    );
}
