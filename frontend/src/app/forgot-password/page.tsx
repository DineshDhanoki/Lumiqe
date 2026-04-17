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
            <div className="min-h-screen bg-[#09090B] flex items-center justify-center p-6 relative overflow-hidden">
                {/* Ambient Background */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[20%] left-[15%] w-96 h-96 bg-primary/20 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] bg-secondary-container/20 rounded-full blur-[150px]" />
                </div>
                <div className="relative z-10 w-full max-w-md">
                    <div
                        className="rounded-[24px] p-10 md:p-12 flex flex-col items-center text-center"
                        style={{ background: 'rgba(32, 31, 34, 0.6)', backdropFilter: 'blur(16px)', border: '0.5px solid rgba(196, 151, 62, 0.2)' }}
                    >
                        <span className="font-display italic text-3xl tracking-tighter text-primary mb-10">Lumiqe</span>
                        <div className="relative mb-8">
                            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                            <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-surface-container-high" style={{ border: '0.5px solid rgba(196, 151, 62, 0.2)' }}>
                                <span className="material-symbols-outlined text-4xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>mark_email_read</span>
                            </div>
                        </div>
                        <h1 className="font-display text-4xl md:text-5xl text-on-surface tracking-tight leading-tight mb-4">
                            Check Your <span className="italic text-primary">Inbox.</span>
                        </h1>
                        <p className="text-on-surface-variant font-light leading-relaxed max-w-sm mb-2">
                            If an account exists for <span className="text-primary font-medium">{email}</span>, you&apos;ll receive a reset link shortly. It expires in 30 minutes.
                        </p>
                        <p className="text-on-surface-variant/40 text-xs mb-10">
                            Didn&apos;t get it? Check your spam folder, or{' '}
                            <button onClick={() => setStatus('idle')} className="text-primary hover:opacity-80 transition-opacity underline">
                                try again
                            </button>
                            .
                        </p>
                        <Link
                            href="/"
                            className="font-mono text-[10px] text-primary hover:text-on-surface transition-colors uppercase tracking-tighter"
                        >
                            Back to secure login
                        </Link>
                    </div>
                    <div className="mt-8 flex justify-center items-center gap-3">
                        <span className="h-px w-8 bg-outline-variant/30" />
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                            <span className="font-mono text-[9px] text-outline-variant uppercase tracking-widest">Secured by Lumiqe AI Intelligence</span>
                        </div>
                        <span className="h-px w-8 bg-outline-variant/30" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#09090B] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[20%] left-[15%] w-96 h-96 bg-primary/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] bg-secondary-container/20 rounded-full blur-[150px]" />
                <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-20"
                    style={{ background: 'radial-gradient(circle, rgba(196,151,62,0.1) 0%, transparent 70%)' }} />
            </div>

            <div className="relative z-10 w-full max-w-md">
                {/* Glass Card */}
                <div
                    className="rounded-[24px] p-10 md:p-12 flex flex-col items-center"
                    style={{ background: 'rgba(32, 31, 34, 0.4)', backdropFilter: 'blur(16px)', border: '0.5px solid rgba(196, 151, 62, 0.2)' }}
                >
                    {/* Brand Mark */}
                    <div className="mb-10 text-center">
                        <span className="font-display italic text-3xl tracking-tighter text-primary">Lumiqe</span>
                    </div>

                    {/* Header */}
                    <div className="w-full mb-10">
                        <h1 className="font-display italic text-4xl md:text-5xl text-on-surface text-center mb-4 leading-tight">
                            Reset Password
                        </h1>
                        <p className="font-label text-xs uppercase tracking-[0.2em] text-outline text-center">
                            Enter your email to receive a recovery link
                        </p>
                    </div>

                    {/* Error */}
                    {status === 'error' && (
                        <div className="w-full flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-[10px] p-3 text-sm text-primary mb-6">
                            <span className="material-symbols-outlined text-base flex-shrink-0">error</span>
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="w-full space-y-10">
                        <div className="space-y-2">
                            <label htmlFor="email" className="block font-label text-xs uppercase tracking-widest text-outline">
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
                                className="w-full px-0 py-3 bg-transparent border-0 border-b border-outline-variant focus:outline-none focus:border-primary transition-colors text-on-surface placeholder-on-surface-variant/30 text-sm"
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className="w-full py-4 font-headline font-bold text-xs uppercase tracking-[0.2em] text-on-primary rounded-[10px] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                style={{ background: 'linear-gradient(to right, #c4973e, #f0bf62)' }}
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
                        </div>

                        <div className="flex flex-col items-center pt-2">
                            <Link
                                href="/"
                                className="font-mono text-[10px] text-primary hover:text-on-surface transition-colors uppercase tracking-tighter"
                            >
                                Back to secure login
                            </Link>
                        </div>
                    </form>
                </div>

                {/* System Status */}
                <div className="mt-8 flex justify-center items-center gap-3">
                    <span className="h-px w-8 bg-outline-variant/30" />
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                        <span className="font-mono text-[9px] text-outline-variant uppercase tracking-widest">Secured by Lumiqe AI Intelligence</span>
                    </div>
                    <span className="h-px w-8 bg-outline-variant/30" />
                </div>
            </div>
        </div>
    );
}
