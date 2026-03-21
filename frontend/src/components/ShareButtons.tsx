'use client';

import { useState } from 'react';
import { Share2, Copy, Check, MessageCircle, Instagram } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Session } from 'next-auth';
import { events } from '@/lib/analytics';

interface Props {
    analysisId: string;
    season: string;
    session?: Session | null;
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
        window.open(
            `https://wa.me/?text=${encodeURIComponent(`I'm a ${season}! Check out my color analysis on Lumiqe: ${url}`)}`,
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
        <div className="bg-zinc-900/50 border border-white/10 p-6 rounded-3xl">
            <div className="flex items-center gap-2 mb-4">
                <Share2 className="w-5 h-5 text-red-400" />
                <h3 className="text-lg font-bold text-white">Share Your Results</h3>
            </div>
            <div className="flex flex-wrap gap-3">
                <button
                    onClick={copyLink}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-50"
                >
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy Link'}
                </button>
                <button
                    onClick={shareWhatsApp}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2.5 bg-green-600/20 hover:bg-green-600/30 border border-green-500/20 rounded-xl text-sm font-medium text-green-300 transition-all disabled:opacity-50"
                >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                </button>
                <button
                    onClick={shareTwitter}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2.5 bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/20 rounded-xl text-sm font-medium text-sky-300 transition-all disabled:opacity-50"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    Twitter/X
                </button>
                <button
                    onClick={shareInstagram}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2.5 bg-pink-600/20 hover:bg-pink-600/30 border border-pink-500/20 rounded-xl text-sm font-medium text-pink-300 transition-all disabled:opacity-50"
                    title="Link copied — paste in Instagram Stories"
                >
                    <Instagram className="w-4 h-4" />
                    Stories
                </button>
            </div>
        </div>
    );
}
