const CACHE = 'firetable-revA-1';
const ASSETS = [
  './', './index.html', './app.js', './manifest.webmanifest', './icon-192.png', './icon-512.png',
  './dxf/firebin_ALL-PARTS_3mm.dxf', './dxf/firebin_P1_V-body_x1.dxf',
  './dxf/firebin_P2_end-plate_x2.dxf', './dxf/firebin_P3_rim-ring_x1.dxf'
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// Cache first so it opens instantly in the workshop with no signal; refresh the cache in the background.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((hit) => {
      const net = fetch(e.request).then((res) => {
        if (res && res.ok && new URL(e.request.url).origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
