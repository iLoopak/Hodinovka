/**
 * Service worker — offline shell caching.
 *
 * Strategie:
 *  - App shell (navigace): network-first s fallbackem na cache → aplikace se
 *    otevře i offline.
 *  - Ostatní GET požadavky (statická aktiva): stale-while-revalidate.
 *
 * Data aplikace žijí v IndexedDB (mimo service worker), takže tady řešíme
 * jen skořápku appky.
 */

const CACHE = "hodinovka-shell-v2";
const SHELL = [
  "/",
  "/klienti/",
  "/klienti/novy/",
  "/klienti/detail/",
  "/klienti/upravit/",
  "/projekty/",
  "/vykazy/",
  "/faktury/",
  "/manifest.json",
  "/icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigace → network-first, fallback na cachovanou skořápku.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match("/")))
    );
    return;
  }

  // Statická aktiva → stale-while-revalidate.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
