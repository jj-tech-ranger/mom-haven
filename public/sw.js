const CACHE_NAME = 'momhaven-emergency-shell-v1';
const SHELL = ['/'];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const response = await fetch('/');
    await cache.put('/', response.clone());
    const html = await response.text();
    const urls = new Set(SHELL);
    for (const match of html.matchAll(/(?:src|href)=["'](\/[^"']+)["']/g)) {
      if (!match[1].startsWith('/api/')) urls.add(match[1]);
    }
    await Promise.all([...urls].filter((url) => url !== '/').map(async (url) => {
      try {
        const asset = await fetch(url);
        if (asset.ok) await cache.put(url, asset);
      } catch {
        // The root document is already cached; individual assets can be learned on first use.
      }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok && request.destination !== 'document') {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    } catch {
      const fallback = await caches.match('/');
      if (fallback) return fallback;
      throw new Error('Offline and no app shell is cached');
    }
  })());
});
