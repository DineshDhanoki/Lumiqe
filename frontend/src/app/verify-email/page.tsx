'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token') || '';

    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [errorMessage, setErrorMessage] = useState('');
    const [cooldown, setCooldown] = useState(59);
    const [canResend, setCanResend] = useState(false);

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

    useEffect(() => {
        if (cooldown <= 0) { setCanResend(true); return; }
        const t = setInterval(() => setCooldown(prev => prev - 1), 1000);
        return () => clearInterval(t);
    }, [cooldown]);

    const glassCard = {
        background: 'rgba(19, 19, 21, 0.6)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '0.5px solid rgba(196, 151, 62, 0.2)',
        boxShadow: '0 40px 60px -20px rgba(196, 151, 62, 0.05)',
    } as React.CSSProperties;

    if (status === 'verifying') {
        return (
            <div className="min-h-screen bg-[#09090B] flex items-center justify-center p-6 relative overflow-hidden">
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[120px]" />
                    <div className="absolute top-[40%] -right-[15%] w-[50%] h-[50%] rounded-full bg-secondary-container/15 blur-[100px]" />
                </div>
                <div className="absolute top-12 left-0 w-full flex justify-center">
                    <h1 className="font-display italic text-3xl tracking-tighter text-primary">Lumiqe</h1>
                </div>
                <div className="relative z-10 w-full max-w-lg p-12 md:p-16 flex flex-col items-center text-center rounded-3xl" style={glassCard}>
                    <div className="w-14 h-14 border border-primary border-t-transparent rounded-full animate-spin mb-8" />
                    <h2 className="font-display text-4xl md:text-5xl text-on-surface tracking-tight leading-tight mb-4">
                        Verifying your <span className="italic text-primary">elegance.</span>
                    </h2>
                    <p className="text-on-surface-variant font-light leading-relaxed max-w-sm">
                        Please wait while we verify your email address...
                    </p>
                </div>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="min-h-screen bg-[#09090B] flex items-center justify-center p-6 relative overflow-hidden">
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[120px]" />
                    <div className="absolute top-[40%] -right-[15%] w-[50%] h-[50%] rounded-full bg-secondary-container/15 blur-[100px]" />
                </div>
                <div className="absolute top-12 left-0 w-full flex justify-center">
                    <h1 className="font-display italic text-3xl tracking-tighter text-primary">Lumiqe</h1>
                </div>
                <div className="relative z-10 w-full max-w-lg p-12 md:p-16 flex flex-col items-center text-center rounded-3xl" style={glassCard}>
                    <div className="relative mb-10">
                        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                        <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-surface-container-high" style={{ border: '0.5px solid rgba(196, 151, 62, 0.2)' }}>
                            <span className="material-symbols-outlined text-5xl text-primary" style={{ fontVariationSettings: "'FILL' 1, 'wght' 300" }}>check_circle</span>
                        </div>
                        <span className="material-symbols-outlined absolute -top-2 -right-2 text-primary/60 text-xl">auto_awesome</span>
                    </div>
                    <h2 className="font-display text-4xl md:text-5xl text-on-surface tracking-tight leading-tight mb-4">
                        Email <span className="italic text-primary">Verified.</span>
                    </h2>
                    <p className="text-on-surface-variant font-light leading-relaxed max-w-sm mb-10">
                        Your email has been successfully verified. You can now sign in and start using Lumiqe.
                    </p>
                    <Link
                        href="/"
                        className="w-full py-5 relative overflow-hidden rounded-[10px] flex items-center justify-center font-headline font-bold text-on-primary uppercase tracking-widest text-xs hover:opacity-90 active:scale-[0.98] transition-all"
                        style={{ background: 'linear-gradient(to right, #c4973e, #f0bf62)' }}
                    >
                        Go to Sign In
                    </Link>
                </div>
            </div>
        );
    }

    // Error state — also show the "waiting" card with resend if no token
    return (
        <div className="min-h-screen bg-[#09090B] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[120px]" />
                <div className="absolute top-[40%] -right-[15%] w-[50%] h-[50%] rounded-full bg-secondary-container/15 blur-[100px]" />
                <div className="absolute -bottom-[10%] left-[20%] w-[40%] h-[40%] rounded-full bg-tertiary-container/10 blur-[120px]" />
            </div>

            {/* Brand */}
            <div className="absolute top-12 left-0 w-full flex justify-center">
                <h1 className="font-display italic text-3xl tracking-tighter text-primary">Lumiqe</h1>
            </div>

            {/* Verification Glass Card */}
            <div className="relative z-10 w-full max-w-lg p-12 md:p-16 flex flex-col items-center text-center rounded-3xl" style={glassCard}>
                {/* Hero Icon */}
                <div className="relative mb-10">
                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                    <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-surface-container-high" style={{ border: '0.5px solid rgba(196, 151, 62, 0.2)' }}>
                        <span className="material-symbols-outlined text-5xl text-primary" style={{ fontVariationSettings: "'wght' 300" }}>mail</span>
                    </div>
                    <span className="material-symbols-outlined absolute -top-2 -right-2 text-primary/60 text-xl">auto_awesome</span>
                </div>

                {/* Typography */}
                <div className="space-y-4 mb-12">
                    <h2 className="font-display text-4xl md:text-5xl text-on-surface tracking-tight leading-tight">
                        Verify your <span className="italic text-primary">elegance.</span>
                    </h2>
                    <p className="text-on-surface-variant font-light leading-relaxed max-w-sm mx-auto">
                        {errorMessage || "Check your inbox for a verification link. We've sent an invitation to join our exclusive digital atelier."}
                    </p>
                </div>

                {/* Action Area */}
                <div className="w-full space-y-6">
                    {/* Status badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-low" style={{ border: '0.5px solid rgba(196, 151, 62, 0.2)' }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary-fixed-dim">
                            {errorMessage ? 'Verification failed' : 'Waiting for confirmation'}
                        </span>
                    </div>

                    {/* Resend / go home */}
                    <div className="pt-4">
                        {canResend ? (
                            <button
                                onClick={() => { setCooldown(59); setCanResend(false); }}
                                className="w-full py-5 rounded-[10px] font-headline font-bold text-on-primary uppercase tracking-widest text-xs hover:opacity-90 active:scale-95 transition-all"
                                style={{ background: 'linear-gradient(to right, #c4973e, #f0bf62)' }}
                            >
                                Resend Email
                            </button>
                        ) : (
                            <Link
                                href="/"
                                className="block w-full py-5 rounded-[10px] font-headline font-bold text-on-primary uppercase tracking-widest text-xs text-center hover:opacity-90 active:scale-[0.98] transition-all"
                                style={{ background: 'linear-gradient(to right, #c4973e, #f0bf62)' }}
                            >
                                Open Mail App
                            </Link>
                        )}
                    </div>

                    <div className="flex flex-col items-center gap-4">
                        {!canResend && (
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-[11px] text-outline tracking-tighter">COOLDOWN ACTIVE:</span>
                                <span className="font-mono text-[11px] text-primary font-bold">
                                    00:{String(cooldown).padStart(2, '0')}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-12 flex flex-col gap-6 w-full opacity-60">
                    <div className="h-[0.5px] w-full" style={{ background: 'linear-gradient(to right, transparent, rgba(196,151,62,0.2), transparent)' }} />
                    <div className="flex justify-between items-center px-2">
                        <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">Support</span>
                        <Link href="/" className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors">
                            Sign Out
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
                    <div className="w-8 h-8 border border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            }
        >
            <VerifyEmailContent />
        </Suspense>
    );
}
