'use client';

import { useState } from 'react';

import { apiFetch } from '@/lib/api';
import { Session } from 'next-auth';
import { events } from '@/lib/analytics';

interface Props {
    analysisId: string;
    season: string;
    session?: Session | null;
}

/**
 * WhatsApp SVG icon (official shape).
 */
function WhatsAppIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
    );
}

export default function ShareButtons({ analysisId, season, session }: Props) {
    const [shareUrl, setShareUrl] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(false);

    const getShareUrl = async (): Promise<string | null> => {
        if (shareUrl) return shareUrl;
        setLoading(true);
        try {
            const res = await apiFetch(`/api/share/${analysisId}/token`, {}, session);
            if (!res.ok) return null;
            const data = await res.json();
            setShareUrl(data.share_url);
            return data.share_url;
        } catch {
            return null;
        } finally {
            setLoading(false);
        }
    };

    const copyLink = async () => {
        const url = await getShareUrl();
        if (!url) return;
        await navigator.clipboard.writeText(url);
        setCopied(true);
        events.shareCreated('copy');
        setTimeout(() => setCopied(false), 2000);
    };

    const shareWhatsApp = async () => {
        const url = await getShareUrl();
        if (!url) return;
        events.shareCreated('whatsapp');
        const message = `I just discovered I'm a ${season}! \u{1F3A8} Find your color season at ${url}`;
        window.open(
            `https://wa.me/?text=${encodeURIComponent(message)}`,
            '_blank'
        );
    };

    const shareTwitter = async () => {
        const url = await getShareUrl();
        if (!url) return;
        events.shareCreated('twitter');
        window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(`I just discovered I'm a ${season}! Find your colors too:`)}&url=${encodeURIComponent(url)}`,
            '_blank'
        );
    };

    const shareInstagram = async () => {
        const url = await getShareUrl();
        if (!url) return;
        await navigator.clipboard.writeText(url);
        setCopied(true);
        events.shareCreated('instagram');
        setTimeout(() => setCopied(false), 3000);
    };

    return (
        <div className="bg-surface-container/50 border border-primary/10 p-6 rounded-3xl">
            <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-xl text-primary">share</span>
                <h3 className="font-headline text-lg font-bold text-on-surface">Share Your Results</h3>
            </div>
            <div className="flex flex-wrap gap-3">
                {/* WhatsApp - primary share action */}
                <button
                    onClick={shareWhatsApp}
                    disabled={loading}
                    className="flex items-center gap-2 px-5 py-3 bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/30 rounded-xl text-sm font-label font-semibold text-[#25D366] transition-all disabled:opacity-50"
                >
                    <WhatsAppIcon className="w-5 h-5" />
                    Share on WhatsApp
                </button>
                {/* Copy Link */}
                <button
                    onClick={copyLink}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2.5 bg-surface-container hover:bg-surface-container/80 border border-outline-variant/30 rounded-xl text-sm font-label font-medium text-on-surface transition-all disabled:opacity-50"
                >
                    {copied ? <span className="material-symbols-outlined text-base text-tertiary">check</span> : <span className="material-symbols-outlined text-base">content_copy</span>}
                    {copied ? 'Copied!' : 'Copy Link'}
                </button>
                {/* Twitter/X */}
                <button
                    onClick={shareTwitter}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2.5 bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/20 rounded-xl text-sm font-medium text-sky-300 transition-all disabled:opacity-50"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    Twitter/X
                </button>
                {/* Instagram Stories */}
                <button
                    onClick={shareInstagram}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2.5 bg-pink-600/20 hover:bg-pink-600/30 border border-pink-500/20 rounded-xl text-sm font-medium text-pink-300 transition-all disabled:opacity-50"
                    title="Link copied — paste in Instagram Stories"
                >
                    <span className="material-symbols-outlined text-base">photo_camera</span>
                    Stories
                </button>
            </div>
        </div>
    );
}
