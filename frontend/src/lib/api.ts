/**
 * Lumiqe — Authenticated API Helper.
 *
 * Routes all /api/* calls through the Next.js proxy (/api/proxy/*), which
 * injects the backend JWT server-side. The token is never exposed to client JS.
 *
 * Usage:
 *   import { apiFetch } from '@/lib/api';
 *   const res = await apiFetch('/api/analyze', { method: 'POST', body: formData });
 */

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Authenticated fetch wrapper.
 *
 * @param path     - API path (e.g., '/api/analyze') or full URL
 * @param options  - Standard fetch options (method, body, headers, etc.)
 * @param _session - Deprecated: no longer needed, kept for backward compatibility
 * @returns        - Fetch Response
 */
export async function apiFetch(
    path: string,
    options: RequestInit = {},
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _session?: unknown
): Promise<Response> {
    // Route /api/* through the Next.js proxy so the backend token stays server-side
    const url = path.startsWith('http')
        ? path
        : path.replace(/^\/api\//, '/api/proxy/');

    const headers = new Headers(options.headers);

    // Don't set Content-Type if body is FormData (browser sets boundary automatically)
    if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    return fetch(url, {
        ...options,
        headers,
    });
}

