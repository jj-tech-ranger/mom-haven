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

// Push notification listener for Firebase Cloud Messaging (FCM) and web push payloads
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: 'MomHaven Reminder', body: event.data ? event.data.text() : 'You have an upcoming clinical reminder.' };
  }

  // Standard FCM payload nesting
  const title = payload.notification?.title || payload.title || 'MomHaven Reminder';
  const body = payload.notification?.body || payload.body || 'You have an upcoming health appointment or schedule event.';
  const icon = payload.notification?.icon || payload.icon || '/icon.png';
  const badge = payload.badge || '/icon.png';
  const deepLink = payload.data?.deepLink || payload.deepLink || 'today';
  const reminderId = payload.data?.reminderId || payload.reminderId;

  const options = {
    body,
    icon,
    badge,
    tag: reminderId ? `reminder-${reminderId}` : 'momhaven-reminder',
    data: {
      url: `/?tab=${deepLink}`,
      deepLink,
      reminderId,
      ...payload.data,
    },
    requireInteraction: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click event handler: focus existing window or open to deepLink
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const deepLink = data.deepLink || 'today';
  const targetUrl = data.url || `/?tab=${deepLink}`;

  event.waitUntil((async () => {
    const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of allClients) {
      if ('focus' in client) {
        await client.focus();
        if ('navigate' in client) {
          await client.navigate(targetUrl);
        }
        return;
      }
    }
    if (self.clients.openWindow) {
      await self.clients.openWindow(targetUrl);
    }
  })());
});

// Allow client app to trigger a local system notification via service worker
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_LOCAL_NOTIFICATION') {
    const { title, body, deepLink, reminderId } = event.data;
    self.registration.showNotification(title || 'MomHaven Reminder', {
      body: body || 'You have an upcoming reminder.',
      icon: '/icon.png',
      badge: '/icon.png',
      tag: reminderId ? `reminder-${reminderId}` : 'momhaven-reminder',
      data: {
        url: `/?tab=${deepLink || 'today'}`,
        deepLink: deepLink || 'today',
        reminderId,
      },
      requireInteraction: true,
    });
  }
});
