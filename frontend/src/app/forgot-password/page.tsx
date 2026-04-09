'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

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
            <div className="min-h-screen bg-stone-950 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-zinc-900/60 border border-white/10 rounded-2xl p-8 text-center space-y-6">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold text-white">Check Your Email</h1>
                        <p className="text-white/60 text-sm">
                            If an account exists for <span className="text-white font-medium">{email}</span>,
                            you'll receive a reset link shortly. It expires in 30 minutes.
                        </p>
                    </div>
                    <p className="text-white/40 text-xs">
                        Didn't get it? Check your spam folder, or{' '}
                        <button
                            onClick={() => setStatus('idle')}
                            className="text-red-400 hover:text-red-300 transition-colors underline"
                        >
                            try again
                        </button>
                        .
                    </p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to sign in
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-950 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-zinc-900/60 border border-white/10 rounded-2xl p-8 space-y-6">
                <div className="text-center space-y-2">
                    <Mail className="w-12 h-12 text-red-500 mx-auto" />
                    <h1 className="text-2xl font-bold text-white">Forgot Password?</h1>
                    <p className="text-white/60 text-sm">
                        Enter your email and we'll send you a reset link.
                    </p>
                </div>

                {status === 'error' && (
                    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-400">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{errorMessage}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="email" className="block text-sm font-medium text-white/80">
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
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="w-full py-3 bg-red-600 rounded-full text-white font-medium hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {status === 'loading' ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            'Send Reset Link'
                        )}
                    </button>
                </form>

                <Link
                    href="/"
                    className="flex items-center justify-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to sign in
                </Link>
            </div>
        </div>
    );
}
