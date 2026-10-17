/* PequeAventura - uso sin conexion y actualizaciones automaticas de la pagina. */
const CACHE_PREFIX = 'pequeaventura-pwa-';
const CACHE_NAME = 'pequeaventura-pwa-20261017-v3-icono-app';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/favicon-48.png',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/pequeaventura-icono-original.png'
];
const HOME = new URL('./index.html', self.registration.scope).href;

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
            .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const scope = new URL(self.registration.scope);
  if (url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;

  if (req.mode === 'navigate') {
    // Actualiza la pagina mientras hay internet; guarda la ultima version para uso offline.
    event.respondWith(
      fetch(req)
        .then(response => {
          if (response.ok) {
            const fresh = response.clone();
            event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(HOME, fresh)));
          }
          return response;
        })
        .catch(() => caches.match(req).then(cached => cached || caches.match(HOME)))
    );
    return;
  }

  // Iconos y manifest se cargan inmediatamente desde la cache inicial.
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(response => {
      if (response.ok && response.type === 'basic') {
        const fresh = response.clone();
        event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(req, fresh)));
      }
      return response;
    }))
  );
});
