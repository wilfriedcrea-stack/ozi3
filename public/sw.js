// Service Worker for OZI PWA - Safe pass-through mode
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(cacheNames.map((cache) => caches.delete(cache)));
    }).then(() => self.clients.claim())
  );
});

// Do not intercept fetches so live applet code, Vite assets, and Firestore always load reliably

