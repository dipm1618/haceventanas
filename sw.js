// Service worker de haceventanas.com
// Estrategia "primero la red": siempre intenta traer la versión más nueva; si no hay internet, usa la última copia guardada.
const CACHE = 'hv-v1';
const PRECACHE = ['/', '/manifest.webmanifest', '/favicon-192.png', '/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  // Solo archivos propios del sitio (no Supabase, ni CDNs, ni estadísticas de Vercel)
  if (req.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/_vercel/')) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.status === 200) {
          const copia = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copia));
        }
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || (req.mode === 'navigate' ? caches.match('/') : undefined)))
  );
});
