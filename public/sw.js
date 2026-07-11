// v2: never cache navigations/HTML — stale HTML pins dead /_next chunk URLs
// and causes an infinite reload loop. Cache bump purges poisoned v1 caches.
const CACHE = "installer-v2";
const PRECACHE_URLS = ["/manifest.json"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE_URLS)),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.origin !== location.origin) return;
  if (request.method !== "GET") return;
  if (url.pathname.startsWith("/api/")) return;
  // HTML must always come from the network (auth redirects + chunk URLs).
  if (request.mode === "navigate") return;

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request)),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});
