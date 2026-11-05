// Offline cache for Field Notebook. Bump VERSION when you upload a new index.html.
const VERSION = 'fn-v1.1.1';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION && k !== 'fn-inbox').map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Android share sheet → "फील्ड नोटबुक": keep the shared file, then open the app to merge it
  if (e.request.method === 'POST' && url.pathname.endsWith('/receive')) {
    e.respondWith((async () => {
      const fd = await e.request.formData(); const f = fd.get('file');
      if (f && f.text) { const c = await caches.open('fn-inbox'); await c.put(new URL('./inbox', self.registration.scope).href, new Response(await f.text())); }
      return Response.redirect(new URL('./?inbox=1', self.registration.scope).href, 303);
    })());
    return;
  }
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(caches.open(VERSION).then(async c => {
    const hit = await c.match(e.request, { ignoreSearch: true });
    const net = fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => hit);
    return hit || net;   // offline-first; refreshed copy is used on next open
  }));
});
