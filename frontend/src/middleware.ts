import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
        // Only allow relative callback URLs to prevent open-redirect attacks
        const rawCallback = request.nextUrl.pathname + request.nextUrl.search;
        const safeCallback = rawCallback.startsWith('/') && !rawCallback.startsWith('//') ? rawCallback : '/analyze';
        const callbackUrl = encodeURIComponent(safeCallback);
        const signInUrl = new URL(`/?callbackUrl=${callbackUrl}`, request.url);
        return NextResponse.redirect(signInUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/shopping-agent/:path*',
        '/account/:path*',
        '/quiz/:path*',
        '/wishlist/:path*',
        '/admin/:path*',
    ],
};
