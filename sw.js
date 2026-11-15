const CACHE_NAME = 'aarambh-v2-local';

const ASSETS = [
  './',
  './index.html',
  './app.html',
  './manifest.json',
  './css/styles.css',
  './js/storage.js',
  './js/domain.js',
  './js/icons.js',
  './assets/icon.svg',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/favicon-32.png',
  './favicon.ico'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(e.request).then((res) => {
        if (!res || res.status !== 200 || res.type !== 'basic') {
          return res;
        }
        const cloned = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, cloned));
        return res;
      }).catch(() => {
        // Fallback to app.html or index.html for navigation requests
        if (e.request.mode === 'navigate') {
          return caches.match('./app.html');
        }
      });
    })
  );
});
