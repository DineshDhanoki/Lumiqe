/**
 * Next.js API Proxy — forwards requests to the FastAPI backend.
 *
 * The backend JWT is read from the server-side NextAuth token (httpOnly cookie)
 * and injected as an Authorization header. It is never exposed to client JS.
 */

import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const MAX_BODY_SIZE = 15 * 1024 * 1024; // 15MB
const REQUEST_TIMEOUT_MS = 30_000; // 30 seconds

async function handler(
    req: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    // Check body size limit via Content-Length header
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
        return NextResponse.json(
            { error: 'PAYLOAD_TOO_LARGE', detail: 'Request body exceeds 15MB limit' },
            { status: 413 }
        );
    }

    const { path } = await params;
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    const apiPath = path.join('/');

    // Path allowlist — only forward known API routes to prevent proxy abuse
    const ALLOWED_PREFIXES = [
        'auth/', 'analyze', 'scan-item', 'complete-profile', 'color-chat',
        'styling-tips', 'shopping-agent', 'products', 'outfit', 'palette-card',
        'stripe/', 'referral/', 'share/', 'profile', 'events', 'health',
        'analysis/', 'admin/', 'notifications', 'wishlist', 'wardrobe',
        'saved-outfits', 'community/', 'b2b/', 'price-alerts',
    ];
    if (!ALLOWED_PREFIXES.some(prefix => apiPath.startsWith(prefix))) {
        return NextResponse.json(
            { error: 'FORBIDDEN', detail: 'API path not allowed' },
            { status: 403 }
        );
    }

    const url = `${API_BASE}/api/${apiPath}${req.nextUrl.search}`;

    const headers = new Headers();

    // Forward content-type (critical for multipart/form-data boundary)
    const contentType = req.headers.get('content-type');
    if (contentType) headers.set('content-type', contentType);

    // Inject backend JWT server-side — never touches client JavaScript
    if (token?.backendToken) {
        headers.set('Authorization', `Bearer ${token.backendToken}`);
    }

    const fetchOptions: RequestInit = { method: req.method, headers };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (fetchOptions as any).body = req.body;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (fetchOptions as any).duplex = 'half';
    }

    // AbortController for 30s timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    fetchOptions.signal = controller.signal;

    try {
        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);
        const responseHeaders = new Headers(response.headers);
        responseHeaders.delete('transfer-encoding');
        return new NextResponse(response.body, {
            status: response.status,
            headers: responseHeaders,
        });
    } catch (err) {
        clearTimeout(timeoutId);
        if (err instanceof DOMException && err.name === 'AbortError') {
            return NextResponse.json(
                { error: 'GATEWAY_TIMEOUT', detail: 'Backend did not respond within 30 seconds' },
                { status: 504 }
            );
        }
        return NextResponse.json(
            { error: 'PROXY_ERROR', detail: 'Could not connect to backend' },
            { status: 502 }
        );
    }
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH };
