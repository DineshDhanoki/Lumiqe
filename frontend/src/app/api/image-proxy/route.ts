import { NextRequest, NextResponse } from 'next/server';

/**
 * Image Proxy — Fetches external images server-side to bypass CDN hotlink blocking.
 * 
 * Usage: /api/image-proxy?url=https://img105.savana.com/v1/goods-pic/...
 * 
 * Security: Only allows known CDN domains to prevent open-proxy abuse.
 */

const ALLOWED_HOSTS = new Set([
    'img105.savana.com',
    'img.savana.com',
    'images.bewakoof.com',
    'assets.myntassets.com',
    'lp2.hm.com',
    'static.zara.net',
    'st.mngbcn.com',
    'lsco.scene7.com',
    'images.puma.com',
    'campusshoes.com',
    'www.snitch.co.in',
    'www.bonkerscorner.com',
    'urbanmonkey.com',
    'www.giva.co',
    'www.aldoshoes.in',
    'm.media-amazon.com',
]);

export async function GET(request: NextRequest) {
    const imageUrl = request.nextUrl.searchParams.get('url');

    if (!imageUrl) {
        return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    // Validate domain
    let hostname: string;
    try {
        hostname = new URL(imageUrl).hostname;
    } catch {
        return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    if (!ALLOWED_HOSTS.has(hostname)) {
        return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 });
    }

    try {
        const response = await fetch(imageUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
                'Referer': `https://${hostname}/`,
            },
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: `Upstream returned ${response.status}` },
                { status: response.status },
            );
        }

        const contentType = response.headers.get('content-type') || 'image/jpeg';
        const buffer = await response.arrayBuffer();

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400, s-maxage=604800',
                'Access-Control-Allow-Origin': '*',
            },
        });
    } catch (err: unknown) {
        return NextResponse.json(
            { error: 'Failed to fetch image', detail: err instanceof Error ? err.message : 'Unknown error' },
            { status: 502 },
        );
    }
}
