'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setStatus('loading');
        setErrorMessage('');

        try {
            const res = await fetch('/api/proxy/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                // 429 = rate limited
                if (res.status === 429) {
                    throw new Error('Too many requests. Please wait a few minutes and try again.');
                }
                throw new Error(data.detail || 'Something went wrong. Please try again.');
            }

            setStatus('sent');
        } catch (err) {
            setErrorMessage(err instanceof Error ? err.message : 'Something went wrong.');
            setStatus('error');
        }
    }

    if (status === 'sent') {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-surface-container/50 border border-primary/10 rounded-2xl p-8 text-center space-y-6">
                    <span className="material-symbols-outlined text-6xl text-green-500 block mx-auto" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold text-on-surface">Check Your Email</h1>
                        <p className="text-on-surface/60 text-sm">
                            If an account exists for <span className="text-on-surface font-medium">{email}</span>,
                            you'll receive a reset link shortly. It expires in 30 minutes.
                        </p>
                    </div>
                    <p className="text-on-surface/40 text-xs">
                        Didn't get it? Check your spam folder, or{' '}
                        <button
                            onClick={() => setStatus('idle')}
                            className="text-primary hover:text-primary transition-colors underline"
                        >
                            try again
                        </button>
                        .
                    </p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-sm text-on-surface/40 hover:text-on-surface/70 transition-colors"
                    >
                        <span className="material-symbols-outlined text-base">arrow_back</span>
                        Back to sign in
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-surface-container/50 border border-primary/10 rounded-2xl p-8 space-y-6">
                <div className="text-center space-y-2">
                    <span className="material-symbols-outlined text-5xl text-primary block mx-auto">mail</span>
                    <h1 className="text-2xl font-bold text-on-surface">Forgot Password?</h1>
                    <p className="text-on-surface/60 text-sm">
                        Enter your email and we'll send you a reset link.
                    </p>
                </div>

                {status === 'error' && (
                    <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-xl p-3 text-sm text-primary">
                        <span className="material-symbols-outlined text-base flex-shrink-0">error</span>
                        <span>{errorMessage}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="email" className="block text-sm font-medium text-on-surface/80">
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoFocus
                            placeholder="you@example.com"
                            className="w-full px-4 py-3 bg-surface-container/30 border border-primary/10 rounded-xl text-on-surface placeholder-on-surface-variant/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="w-full py-3 bg-primary-container rounded-full text-on-surface font-medium hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {status === 'loading' ? (
                            <>
                                <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                                Sending...
                            </>
                        ) : (
                            'Send Reset Link'
                        )}
                    </button>
                </form>

                <Link
                    href="/"
                    className="flex items-center justify-center gap-2 text-sm text-on-surface/40 hover:text-on-surface/70 transition-colors"
                >
                    <span className="material-symbols-outlined text-base">arrow_back</span>
                    Back to sign in
                </Link>
            </div>
        </div>
    );
}
