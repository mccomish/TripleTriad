const CACHE_NAME = 'tt-v1';
const PRECACHE = [
    '/',
    '/css/style.css',
    '/js/cards.js',
    '/js/main.js',
    '/js/ui.js',
    '/js/net.js',
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(PRECACHE))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (e) => {
    // Network-first for API/socket calls, cache-first for static assets
    if (e.request.url.includes('/api/') || e.request.url.includes('/socket.io/')) {
        return;
    }
    e.respondWith(
        fetch(e.request)
            .then(res => {
                const clone = res.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
                return res;
            })
            .catch(() => caches.match(e.request))
    );
});
