const CACHE_NAME = 'lumiqe-v2';
const STATIC_ASSETS = [
    '/',
    '/manifest.json',
];

// API paths that use network-first with cache fallback
const CACHED_API_PATHS = [
    '/api/proxy/products',
    '/api/proxy/wishlist',
    '/api/proxy/wardrobe',
    '/api/proxy/outfits/saved',
    '/api/proxy/referral/code',
    '/api/proxy/auth/me',
    '/api/proxy/skin-profiles',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

/**
 * Check if a URL pathname matches one of the cached API paths.
 */
function isCachedApiPath(pathname) {
    return CACHED_API_PATHS.some((p) => pathname.startsWith(p));
}

/**
 * Check if a request is for a static asset (CSS, JS, images).
 */
function isStaticAsset(request) {
    const url = new URL(request.url);
    return /\.(css|js|png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|eot)$/i.test(url.pathname);
}

/**
 * Offline JSON error response when both network and cache fail.
 */
function offlineJsonResponse() {
    return new Response(
        JSON.stringify({ error: 'OFFLINE', detail: 'You appear to be offline and no cached data is available.' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
}

// ─── Push Notification Handler ────────────────────────────
self.addEventListener('push', (event) => {
    let data = { title: 'Lumiqe', body: 'You have a new notification', url: '/' };
    try {
        data = event.data ? event.data.json() : data;
    } catch {
        // Use defaults if JSON parsing fails
    }

    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            data: { url: data.url || '/' },
            vibrate: [100, 50, 100],
        })
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = event.notification.data?.url || '/';
    event.waitUntil(
        self.clients.matchAll({ type: 'window' }).then((clients) => {
            for (const client of clients) {
                if (client.url.includes(url) && 'focus' in client) {
                    return client.focus();
                }
            }
            return self.clients.openWindow(url);
        })
    );
});

// ─── Fetch Handler ────────────────────────────────────────
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    if (request.method !== 'GET') return;

    // Network-first with cache fallback for specific API paths
    if (isCachedApiPath(url.pathname)) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                    }
                    return response;
                })
                .catch(() =>
                    caches.match(request).then((cached) => cached || offlineJsonResponse())
                )
        );
        return;
    }

    // Skip non-cached API paths entirely
    if (url.pathname.startsWith('/api/')) {
        return;
    }

    // Stale-while-revalidate for static assets (CSS, JS, images)
    if (isStaticAsset(request)) {
        event.respondWith(
            caches.match(request).then((cached) => {
                const networkFetch = fetch(request).then((response) => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                    }
                    return response;
                });
                return cached || networkFetch;
            })
        );
        return;
    }

    // Default: cache-first for pre-cached static assets, network for everything else
    event.respondWith(
        caches.match(request).then((cached) => {
            const fetched = fetch(request).then((response) => {
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                }
                return response;
            });
            return cached || fetched;
        })
    );
});
