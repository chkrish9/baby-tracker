const STATIC_CACHE = "static-v1";
const API_CACHE = "api-v1";
const PAGE_CACHE = "page-v1";

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(STATIC_CACHE).then((c) =>
      c.addAll(["/_next/static/", "/offline.html"]).catch(() => {})
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => ![STATIC_CACHE, API_CACHE, PAGE_CACHE].includes(k)).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Static assets — cache first
  if (url.pathname.startsWith("/_next/static/")) {
    e.respondWith(
      caches.match(request).then((hit) => hit ?? fetch(request).then((res) => {
        const clone = res.clone();
        caches.open(STATIC_CACHE).then((c) => c.put(request, clone));
        return res;
      }))
    );
    return;
  }

  // API GET — network first, cache fallback
  if (url.pathname.startsWith("/api/") && request.method === "GET") {
    e.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(API_CACHE).then((c) => c.put(request, clone));
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Pages — stale-while-revalidate
  if (request.mode === "navigate") {
    e.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(PAGE_CACHE).then((c) => c.put(request, clone));
          return res;
        })
        .catch(() => caches.match(request) ?? caches.match("/offline.html"))
    );
    return;
  }
});
