const STATIC_CACHE = "static-v2";
const API_CACHE = "api-v2";
const PAGE_CACHE = "page-v2";
const ALL_CACHES = [STATIC_CACHE, API_CACHE, PAGE_CACHE];

const PRECACHE_URLS = [
  "/offline.html",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// ── Install: precache essentials ──────────────────────────────────────────────
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(STATIC_CACHE).then((c) =>
      Promise.allSettled(PRECACHE_URLS.map((url) => c.add(url)))
    )
  );
  self.skipWaiting();
});

// ── Activate: purge old caches, notify clients of update ─────────────────────
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !ALL_CACHES.includes(k))
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
     .then(() => self.clients.matchAll({ type: "window" }))
     .then((clients) => clients.forEach((c) => c.postMessage({ type: "SW_UPDATED" })))
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Skip cross-origin, non-GET, and Next.js HMR requests
  if (url.origin !== self.location.origin) return;
  if (request.method !== "GET") return;
  if (url.pathname.startsWith("/_next/webpack-hmr")) return;

  // Static assets — cache first, then network
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    e.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // API GET — network first, stale cache fallback
  if (url.pathname.startsWith("/api/")) {
    e.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // Page navigations — network first, page cache fallback, then offline page
  if (request.mode === "navigate") {
    e.respondWith(navigateFetch(request));
    return;
  }

  // Everything else — stale-while-revalidate
  e.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
});

// ── Strategies ────────────────────────────────────────────────────────────────
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached ?? new Response(JSON.stringify({ error: "offline" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function navigateFetch(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(PAGE_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request) ?? await caches.match("/offline.html");
    return cached;
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cached = await caches.match(request);
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      caches.open(cacheName).then((c) => c.put(request, response.clone()));
    }
    return response;
  }).catch(() => null);
  return cached ?? fetchPromise;
}

// ── Push notifications (stub — ready to wire backend) ────────────────────────
self.addEventListener("push", (e) => {
  if (!e.data) return;
  const { title = "Baby Tracker", body = "", icon = "/icons/icon-192.png", url = "/dashboard" } = e.data.json();
  e.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge: "/icons/icon-96.png",
      data: { url },
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const target = e.notification.data?.url ?? "/dashboard";
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url === target && "focus" in c);
      return existing ? existing.focus() : self.clients.openWindow(target);
    })
  );
});
