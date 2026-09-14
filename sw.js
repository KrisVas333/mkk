/* MKK service worker — cache-first shell, network-first audio. */
var V = 'mkk-v0.1.0';
var SHELL = ['./', './index.html', './styles.css', './app.js', './manifest.webmanifest',
  './content/config.json', './content/techniques.json', './content/practices.json',
  './content/library.json', './content/games.json', './content/podcasts.json',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(V).then(function (c) {
    return Promise.all(SHELL.map(function (u) { return c.add(u).catch(function () {}); }));
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (k) {
    return Promise.all(k.map(function (n) { return n === V ? null : caches.delete(n); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;

  function fromNet() {
    return fetch(req).then(function (r) {
      if (r && r.ok) { var cp = r.clone(); caches.open(V).then(function (c) { c.put(req, cp); }); }
      return r;
    });
  }
  // App shell + content + audio: always try the network first so an update lands
  // immediately; the cache is the offline fallback, never the source of truth.
  if (req.mode === 'navigate' || /\.(?:html|css|js|json|mp3)$/.test(url.pathname) || url.pathname === '/') {
    e.respondWith(fromNet().catch(function () {
      return caches.match(req).then(function (hit) { return hit || caches.match('./index.html'); });
    }));
    return;
  }
  // Icons and everything else: cache-first, they never change without a version bump.
  e.respondWith(caches.match(req).then(function (hit) { return hit || fromNet(); }));
});
