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
  const url = new URL(event.request.url);

  // Nunca interceptar requisições não-GET, APIs dinâmicas, streaming Mux ou segmentos HLS
  if (
    event.request.method !== 'GET' ||
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('mux.com') ||
    url.pathname.endsWith('.m3u8') ||
    url.pathname.endsWith('.ts') ||
    url.pathname.endsWith('.m4s')
  ) {
    return;
  }

  // Estratégia simples: Network First, fallback to cache
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
