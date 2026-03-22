/**
 * Next.js API Proxy — forwards requests to the FastAPI backend.
 *
 * The backend JWT is read from the server-side NextAuth token (httpOnly cookie)
 * and injected as an Authorization header. It is never exposed to client JS.
 */

import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function handler(
    req: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path } = await params;
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    const apiPath = path.join('/');
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

    try {
        const response = await fetch(url, fetchOptions);
        const responseHeaders = new Headers(response.headers);
        responseHeaders.delete('transfer-encoding');
        return new NextResponse(response.body, {
            status: response.status,
            headers: responseHeaders,
        });
    } catch {
        return NextResponse.json(
            { error: 'PROXY_ERROR', detail: 'Could not connect to backend' },
            { status: 502 }
        );
    }
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH };
