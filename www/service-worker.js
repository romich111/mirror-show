/**
 * Service Worker for Mirror Show PWA
 * Enables offline functionality and app-like experience
 */

const CACHE_NAME = 'mirror-show-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/manifest.json'
];

// Install event - cache assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(ASSETS_TO_CACHE).catch(err => {
                // If network is unavailable during install, continue
                console.log('Caching failed, will try network later:', err);
            });
        })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip data URLs and chrome extensions
    if (event.request.url.startsWith('data:') || 
        event.request.url.startsWith('chrome-extension:') ||
        event.request.url.startsWith('blob:')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then(response => {
            // Return cached response if available
            if (response) {
                return response;
            }

            // Otherwise, fetch from network
            return fetch(event.request).then(response => {
                // Don't cache non-successful responses
                if (!response || response.status !== 200 || response.type === 'error') {
                    return response;
                }

                // Clone the response
                const responseToCache = response.clone();

                // Cache successful responses
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseToCache);
                });

                return response;
            }).catch(error => {
                console.log('Fetch failed:', error);
                
                // Return cached version if available, otherwise return offline page
                return caches.match(event.request).then(response => {
                    return response || new Response(
                        '<html><body style="background:#0a0a0a;color:#fff;display:flex;align-items:center;justify-content:center;height:100%"><div style="text-align:center"><h1>📴 Offline</h1><p>Network is unavailable</p></div></body></html>',
                        {
                            status: 503,
                            statusText: 'Service Unavailable',
                            headers: new Headers({
                                'Content-Type': 'text/html'
                            })
                        }
                    );
                });
            });
        })
    );
});

// Background sync (optional - for photo uploads in future)
self.addEventListener('sync', event => {
    if (event.tag === 'sync-photos') {
        event.waitUntil(
            // Sync logic would go here
            Promise.resolve()
        );
    }
});

// Handle messages from clients
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Periodic background sync (optional)
self.addEventListener('periodicsync', event => {
    if (event.tag === 'check-updates') {
        event.waitUntil(checkForUpdates());
    }
});

async function checkForUpdates() {
    try {
        const response = await fetch('/manifest.json');
        // Update logic could be implemented here
    } catch (error) {
        console.log('Update check failed:', error);
    }
}

// Push notifications (optional for future features)
self.addEventListener('push', event => {
    const options = {
        body: event.data ? event.data.text() : 'Mirror Show notification',
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><circle cx="96" cy="96" r="90" fill="%230a0a0a"/><text x="96" y="130" font-size="80" text-anchor="middle" font-family="Arial" dominant-baseline="middle">💖</text></svg>',
        badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><circle cx="96" cy="96" r="90" fill="%23ff1493"/></svg>',
        tag: 'mirror-show-notification',
        requireInteraction: false
    };

    event.waitUntil(
        self.registration.showNotification('Mirror Show', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(clientList => {
            for (let client of clientList) {
                if (client.url === '/' && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});
