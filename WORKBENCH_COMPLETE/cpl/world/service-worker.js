// Cosmic Pyramid Library — Service Worker
// Cache-first for immutable assets (GLBs, CDN libs) -> repeat visits load instantly.
// Network-first for HTML/JS so deployments show up; falls back to cache offline.
const CACHE_PREFIX = 'cpl-';
const CACHE = 'cpl-v17';
const ASSET_RE = /\/assets\//;
self.addEventListener('install', (e) => e.waitUntil(self.skipWaiting()));
self.addEventListener('activate', (e) => e.waitUntil(
  caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith(CACHE_PREFIX) && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
));
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Never intercept cross-origin/CDN/soul traffic. An offline cache miss must not
  // resolve undefined through respondWith(), and authenticated data must not persist.
  if (url.origin !== self.location.origin) return;
  if (req.headers.has('range') || req.headers.has('authorization')) return;
  // Never cache any configured live soul endpoint. Offline continuity uses the explicit snapshot layer.
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.pathname.startsWith('/mcp/') || url.pathname.includes('/gsk/mcp/')) return;
  if (ASSET_RE.test(url.pathname)) {
    e.respondWith(
      caches.open(CACHE).then((cache) =>
        cache.match(req).then((cached) =>
          cached || fetch(req).then(async (res) => {
            if (res.ok && res.status === 200) await cache.put(req, res.clone());
            return res;
          })
        )
      )
    );
  } else {
    e.respondWith(
      fetch(req)
        .then(async (res) => {
          if (res.ok && res.status === 200) {
            const cache = await caches.open(CACHE);
            await cache.put(req, res.clone());
          }
          return res;
        })
        .catch(async () => (await caches.match(req)) || new Response('Offline', { status: 503, statusText: 'Offline' }))
    );
  }
});
