/*
 * Site Measure service worker: keeps the app itself available on site without a signal.
 * Projects live on the device anyway; this makes sure the pages and the code load too.
 * 8462316afc2a789269ba265121dff37a and /_expo/static/js/web/index-8462316afc2a789269ba265121dff37a.js are filled in by scripts/deploy-web.sh, so every deploy installs
 * a fresh cache and the old one is dropped.
 */
const BUILD = '8462316afc2a789269ba265121dff37a';
const BUNDLE = '/_expo/static/js/web/index-8462316afc2a789269ba265121dff37a.js';
const CACHE = 'site-measure-' + BUILD;
const SHELL = ['/', '/index.html', '/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png', '/apple-touch-icon.png', '/favicon.ico', '/bluefy.html'];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      const urls = BUNDLE.startsWith('/') ? [...SHELL, BUNDLE] : SHELL;
      // One missing file must not block the install: cache what is there.
      await Promise.all(urls.map((u) => cache.add(new Request(u, { cache: 'reload' })).catch(() => undefined)));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) if (key !== CACHE && key.startsWith('site-measure-')) await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // The API is never cached: accounts, projects and mail must be live.
  if (url.hostname.startsWith('measure-api')) return;
  if (url.origin === self.location.origin) {
    if (req.mode === 'navigate') event.respondWith(networkFirst(req, '/index.html'));
    else if (url.pathname.startsWith('/_expo/')) event.respondWith(cacheFirst(req));
    else event.respondWith(networkFirst(req));
    return;
  }
  if (FONT_HOSTS.includes(url.hostname)) event.respondWith(staleWhileRevalidate(req));
});

/** Hashed bundles never change: serve from the cache, fetch once. */
async function cacheFirst(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) cache.put(req, res.clone());
  return res;
}

/** Pages and small files: the network when it is there (so a new version arrives at once), the cache when it is not. */
async function networkFirst(req, fallback) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    return (await cache.match(req)) || (fallback && (await cache.match(fallback))) || Response.error();
  }
}

/** Fonts: show what is cached, refresh in the background. */
async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req);
  const refresh = fetch(req)
    .then((res) => {
      if (res.ok) cache.put(req, res.clone());
      return res;
    })
    .catch(() => undefined);
  return hit || (await refresh) || Response.error();
}
