const CACHE_NAME = 'amf-cache-v1';

const URLS_TO_CACHE = [
  '/',
  '/app',
  '/manifest.json'
  // Outros assets importantes poderiam entrar aqui
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(URLS_TO_CACHE))
  );
});

self.addEventListener('fetch', (event) => {
  // Estratégia simples: Network First, fallback to cache
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
