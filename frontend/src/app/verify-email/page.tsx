'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token') || '';

    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (!token) {
            setErrorMessage('No verification token provided.');
            setStatus('error');
            return;
        }

        let cancelled = false;

        async function verifyEmail() {
            try {
                const response = await fetch('/api/proxy/auth/verify-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token }),
                });

                if (cancelled) return;

                if (!response.ok) {
                    const data = await response.json().catch(() => ({}));
                    throw new Error(data.detail || data.error || 'Verification failed.');
                }

                setStatus('success');
            } catch (err) {
                if (cancelled) return;
                setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred.');
                setStatus('error');
            }
        }

        verifyEmail();

        return () => {
            cancelled = true;
        };
    }, [token]);

    if (status === 'verifying') {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-6">
                <div className="max-w-md w-full text-center space-y-6">
                    <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold text-on-surface">Verifying Your Email</h1>
                        <p className="text-on-surface/60 text-sm">Please wait while we verify your email address...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-surface-container/50 border border-primary/10 rounded-2xl p-8 text-center space-y-6">
                    <span className="material-symbols-outlined text-6xl text-green-500 block mx-auto" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <h1 className="text-2xl font-bold text-on-surface">Email Verified!</h1>
                    <p className="text-on-surface/60">
                        Your email has been successfully verified. You can now sign in and start using Lumiqe.
                    </p>
                    <Link
                        href="/"
                        className="inline-block px-6 py-3 bg-primary-container rounded-full text-on-surface font-medium hover:bg-primary transition-colors"
                    >
                        Go to Sign In
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-surface-container/50 border border-primary/10 rounded-2xl p-8 text-center space-y-6">
                <span className="material-symbols-outlined text-6xl text-primary block mx-auto">error</span>
                <h1 className="text-2xl font-bold text-on-surface">Verification Failed</h1>
                <p className="text-on-surface/60 text-sm">
                    {errorMessage}
                </p>
                <Link
                    href="/"
                    className="inline-block px-6 py-3 bg-primary-container rounded-full text-on-surface font-medium hover:bg-primary transition-colors"
                >
                    Go Home
                </Link>
            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-background flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            }
        >
            <VerifyEmailContent />
        </Suspense>
    );
}
