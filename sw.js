const CACHE_NAME = 'checklists-v1.0.3';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './assets/css/main.css',
  './assets/js/app.js',
  './assets/js/storage.js',
  './assets/js/ui.js',
  './assets/js/i18n.js',
  './assets/icons/favicon.png',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/app-icon-192.png',
  './assets/icons/app-icon-512.png',
  './assets/icons/brand-logo.png',
  './assets/images/checkbox-animation/checked.png',
  './assets/images/checkbox-animation/frame-00.png',
  './assets/images/checkbox-animation/frame-01.png',
  './assets/images/checkbox-animation/frame-02.png',
  './assets/images/checkbox-animation/frame-03.png',
  './assets/images/checkbox-animation/frame-04.png',
  './assets/images/checkbox-animation/frame-05.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Network failed, nothing to do since we return cachedResponse if available
      });

      return cachedResponse || fetchPromise;
    })
  );
});
