/**
 * Nāda Service Worker — offline support
 *
 * Caches the app shell (HTML, CSS, JS) for offline use.
 * Audio plays from local files, not from cache.
 */

const CACHE_NAME = 'nada-v1';
const SHELL_FILES = [
  '/',
  '/index.html',
  '/components.css',
  '/components.js',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Only cache app shell requests — never audio files
  if (event.request.url.includes('blob:')) return;

  event.respondWith(
    caches.match(event.request).then(cached =>
      cached || fetch(event.request).catch(() =>
        caches.match('/index.html')
      )
    )
  );
});
