// Neutralized Service Worker - Forces Cache Purge
const CACHE_NAME = 'adjara-ux-cache-purge-v3';

self.addEventListener('install', (event) => {
    self.skipWaiting(); // Force activation
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((name) => caches.delete(name))
            );
        }).then(() => {
            return self.clients.claim();
        })
    );
});

// Pass-through fetch handler
self.addEventListener('fetch', (event) => {
    // No caching, just fetch from network
    event.respondWith(fetch(event.request));
});
