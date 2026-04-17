'use client';

import { useEffect, useState } from 'react';

const DISMISS_KEY = 'lumiqe-verify-banner-dismissed';

export default function EmailVerificationBanner() {
    const [verified, setVerified] = useState<boolean | null>(null);
    const [dismissed, setDismissed] = useState(false);
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    useEffect(() => {
        // Don't re-show if user dismissed this session
        if (sessionStorage.getItem(DISMISS_KEY)) {
            setDismissed(true);
            return;
        }

        fetch('/api/proxy/auth/me')
            .then((res) => res.ok ? res.json() : null)
            .then((data) => {
                if (data) setVerified(data.email_verified ?? true);
            })
            .catch(() => { /* silently skip — non-critical */ });
    }, []);

    function handleDismiss() {
        sessionStorage.setItem(DISMISS_KEY, '1');
        setDismissed(true);
    }

    async function handleResend() {
        setSending(true);
        try {
            await fetch('/api/proxy/auth/resend-verification', { method: 'POST' });
            setSent(true);
        } catch {
            // show nothing on error — user can try again
        } finally {
            setSending(false);
        }
    }

    if (dismissed || verified !== false) return null;

    return (
        <div className="mx-4 mt-4 flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl px-4 py-3 text-sm text-amber-300">
            <span className="material-symbols-outlined text-base flex-shrink-0">mark_email_read</span>
            <span className="flex-1">
                Please verify your email address to unlock all features.
            </span>

            {sent ? (
                    <span className="flex items-center gap-1 text-primary text-xs font-medium">
                        <span className="material-symbols-outlined text-sm text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        Sent!
                    </span>
            ) : (
                <button
                    onClick={handleResend}
                    disabled={sending}
                    className="flex items-center gap-1 text-amber-300 hover:text-amber-200 font-semibold underline underline-offset-2 disabled:opacity-50 whitespace-nowrap"
                >
                    {sending && <span className="material-symbols-outlined text-xs animate-spin">progress_activity</span>}
                    Resend email
                </button>
            )}

            <button
                onClick={handleDismiss}
                aria-label="Dismiss"
                className="text-on-surface-variant/50 hover:text-on-surface-variant transition-colors ml-1"
            >
                <span className="material-symbols-outlined text-base text-on-surface-variant/50 hover:text-on-surface-variant transition-colors ml-1">close</span>
            </button>
        </div>
    );
}
