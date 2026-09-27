/**
 * Guardo la pantalla de la app para abrirla si se cae la red.
 * No cacheo /api: entradas y salidas van al servidor o a la cola del navegador.
 */
const CACHE = 'cdattg-pantalla-v1';

globalThis.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(['/', '/index.html', '/manifest.webmanifest'])).then(() => globalThis.skipWaiting()),
  );
});

globalThis.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => globalThis.clients.claim()),
  );
});

globalThis.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.pathname.startsWith('/api/')) return;
  event.respondWith(responder(req));
});

async function responder(req) {
  try {
    const net = await fetch(req);
    const copia = net.clone();
    const cache = await caches.open(CACHE);
    await cache.put(req, copia);
    return net;
  } catch {
    const hit = await caches.match(req);
    if (hit) return hit;
    if (req.mode === 'navigate') {
      const inicio = await caches.match('/index.html');
      if (inicio) return inicio;
    }
    throw new Error('sin-red');
  }
}
