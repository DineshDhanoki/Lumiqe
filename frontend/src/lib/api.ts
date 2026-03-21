/**
 * Lumiqe — Authenticated API Helper.
 *
 * Wraps `fetch()` to automatically inject the JWT Authorization header
 * from the NextAuth session. Use this for all protected backend API calls.
 *
 * Usage:
 *   import { apiFetch } from '@/lib/api';
 *   const res = await apiFetch('/api/analyze', { method: 'POST', body: formData }, session);
 */

import { Session } from 'next-auth';

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Authenticated fetch wrapper.
 *
 * @param path     - API path (e.g., '/api/analyze') or full URL
 * @param options  - Standard fetch options (method, body, headers, etc.)
 * @param session  - NextAuth session object (must contain backendToken)
 * @returns        - Fetch Response
 */
export async function apiFetch(
    path: string,
    options: RequestInit = {},
    session?: Session | null
): Promise<Response> {
    const url = path.startsWith('http') ? path : `${API_BASE}${path}`;

    // Build headers — preserve existing headers and add Authorization
    const headers = new Headers(options.headers);

    if (session?.backendToken) {
        headers.set('Authorization', `Bearer ${session.backendToken}`);
    }

    // Don't set Content-Type if body is FormData (browser sets boundary automatically)
    if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    return fetch(url, {
        ...options,
        headers,
    });
}
