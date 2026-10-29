/* Kingdom Duel service worker (generated at build time by vite.config.ts).
 * Precaches the whole build so the game reloads offline. Every URL is
 * relative to the worker's own location, so it works under any base path
 * (for example GitHub Pages' /kingdom-duel/). */
const VERSION = '__KD_VERSION__';
const CACHE = `kingdom-duel-${VERSION}`;
const PRECACHE = __KD_PRECACHE__;
const SCOPE = new URL('./', self.location.href);
const INDEX = new URL('index.html', SCOPE).href;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(PRECACHE.map((path) => new Request(new URL(path, SCOPE), { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith('kingdom-duel-') && key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.href.startsWith(SCOPE.href)) return;

  if (request.mode === 'navigate') {
    // Network first so a new deploy is picked up; the cached shell when offline.
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(INDEX, copy));
          }
          return response;
        })
        .catch(() => caches.match(INDEX, { ignoreVary: true }).then((cached) => cached || Response.error())),
    );
    return;
  }

  // Hashed build assets and static art: cache first, fill the cache on miss.
  event.respondWith(
    caches.match(request, { ignoreSearch: true, ignoreVary: true }).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    }),
  );
});
