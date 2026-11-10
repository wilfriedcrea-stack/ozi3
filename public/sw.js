// Service Worker for OZI PWA - Advanced Offline & Chapter Panel Caching
const STATIC_CACHE_NAME = 'ozi-static-v2';
const WEBTOON_CACHE_NAME = 'ozi-webtoon-panels-v1';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './favicon.svg',
  './logo.png'
];

// Install: precache essential shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Notice precaching static assets:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: cleanup older caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE_NAME && name !== WEBTOON_CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Smart caching strategy
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. Never intercept API calls, Firebase Firestore, auth, or Paystack routes
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('firebase') ||
    url.hostname.includes('identitytoolkit') ||
    url.hostname.includes('paystack') ||
    request.method !== 'GET'
  ) {
    return;
  }

  // 2. Images & Webtoon Chapter Panels: Cache-First with Network Fallback
  const isImageRequest = 
    request.destination === 'image' ||
    url.pathname.match(/\.(png|jpg|jpeg|webp|gif|svg)$/i) ||
    url.hostname.includes('dicebear') ||
    url.pathname.includes('/panels/') ||
    url.pathname.includes('/chapters/');

  if (isImageRequest) {
    event.respondWith(
      caches.open(WEBTOON_CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }

        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (fetchErr) {
          // If offline and not in cache, fallback gracefully
          if (cachedResponse) return cachedResponse;
          throw fetchErr;
        }
      })
    );
    return;
  }

  // 3. Navigation / HTML pages: Network First with Cache Fallback for offline usage
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match('./index.html') || await caches.match('/');
        return cached || new Response('Mode hors-ligne OZI. Veuillez vérifier votre connexion.', {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      })
    );
    return;
  }

  // 4. Other static assets (JS, CSS, Fonts): Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          caches.open(STATIC_CACHE_NAME).then((cache) => {
            cache.put(request, networkResponse.clone());
          });
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// Message listener: allows client app to trigger bulk caching of chapter pages for offline reading
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_CHAPTER_PAGES') {
    const pages = event.data.pages || [];
    if (pages.length > 0) {
      caches.open(WEBTOON_CACHE_NAME).then((cache) => {
        return Promise.all(
          pages.map((url) => {
            return fetch(url, { mode: 'no-cors' })
              .then((res) => cache.put(url, res))
              .catch((err) => console.warn('[SW] Could not cache page:', url, err));
          })
        );
      }).then(() => {
        if (event.source) {
          event.source.postMessage({
            type: 'CHAPTER_CACHED_SUCCESS',
            chapterId: event.data.chapterId,
            pagesCount: pages.length
          });
        }
      });
    }
  }
});
