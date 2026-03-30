import { Metadata } from 'next';
import SharePageClient from './SharePageClient';
import { API_BASE } from '@/lib/api';

interface Props {
    params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { token } = await params;
    try {
        const res = await fetch(`${API_BASE}/api/share/${token}`, { next: { revalidate: 3600 } });
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        const title = `I'm a ${data.season} — Lumiqe Color Analysis`;
        const description = `${data.undertone.charAt(0).toUpperCase() + data.undertone.slice(1)} undertone with a ${data.season.toLowerCase()} palette. Discover your true colors at Lumiqe.`;
        const ogImage = `${API_BASE}/api/share/${token}/og-image`;

        return {
            title,
            description,
            openGraph: {
                title,
                description,
                images: [{ url: ogImage, width: 1200, height: 630, alt: `${data.season} color palette` }],
                type: 'website',
                siteName: 'Lumiqe',
            },
            twitter: {
                card: 'summary_large_image',
                title,
                description,
                images: [ogImage],
            },
        };
    } catch {
        return {
            title: 'Shared Color Analysis — Lumiqe',
            description: 'Discover your true colors with AI-powered color analysis.',
        };
    }
}

export default async function SharePage({ params }: Props) {
    const { token } = await params;
    return <SharePageClient token={token} />;
}
