'use strict';
const VERSION = '__BUILD_VERSION__';
const PREFIX = 'dhahabi-full-';
const CACHE = PREFIX + VERSION;
const BASE = '/gold-app-pwa/full/';
const CORE = [
  BASE,
  BASE + 'index.html',
  BASE + 'manifest.webmanifest',
  BASE + 'pwa-icon.png',
  BASE + 'app_icon_user.jpg'
];

self.addEventListener('install', event => {
  // A new build waits until the user chooses "Update now".
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return;

  // Version metadata and live price snapshots must never come from an old cache.
  if (url.pathname.endsWith('/version.json') || url.pathname.endsWith('/prices-live.json')) {
    event.respondWith(fetch(event.request, {cache:'no-store'}));
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match(BASE + 'index.html')));
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      if (!response.ok) return response;
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(event.request, copy)).catch(() => {});
      return response;
    }))
  );
});
