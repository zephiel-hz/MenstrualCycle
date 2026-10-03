const STATIC_CACHE_NAME = "ricils-pwa-static-v5";
const RUNTIME_CACHE_NAME = "ricils-pwa-runtime-v5";
const RSC_CACHE_NAME = "ricils-pwa-rsc-v5";
const API_CACHE_NAME = "ricils-pwa-api-v5";

const PRECACHE_ASSETS = [
  "/",
  "/dashboard",
  "/calendar",
  "/history",
  "/statistics",
  "/settings",
  "/login",
  "/register",
  "/manifest.webmanifest",
  "/offline.html",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
];

// Install: precache primary static assets & page shells safely
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then(async (cache) => {
      for (const asset of PRECACHE_ASSETS) {
        try {
          const response = await fetch(asset, { cache: "no-cache" });
          if (response.ok) {
            await cache.put(asset, response);
          }
        } catch (err) {
          console.warn("Precache item skipped (offline/redirect):", asset, err);
        }
      }
    })
  );
  self.skipWaiting();
});

// Activate: clean up outdated cache buckets
self.addEventListener("activate", (event) => {
  const currentCaches = [
    STATIC_CACHE_NAME,
    RUNTIME_CACHE_NAME,
    RSC_CACHE_NAME,
    API_CACHE_NAME,
  ];
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (!currentCaches.includes(key)) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch routing handler
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== "GET") {
    return;
  }

  // 1. API GET Requests (Network First, Cache Fallback)
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request);
          if (networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(API_CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });
          }
          return networkResponse;
        } catch {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          return new Response(
            JSON.stringify({ offline: true, message: "Mode Offline Aktif", data: null }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      })()
    );
    return;
  }

  // 2. Next.js RSC (React Server Component) Flight Payloads
  const isRsc =
    url.searchParams.has("_rsc") ||
    request.headers.get("rsc") === "1" ||
    request.headers.get("accept")?.includes("text/x-component");

  if (isRsc) {
    event.respondWith(
      (async () => {
        const rscCache = await caches.open(RSC_CACHE_NAME);

        // A. Match exact request
        const cachedExact = await rscCache.match(request);
        if (cachedExact) {
          // Refresh in background if online
          fetch(request)
            .then((res) => {
              if (res.status === 200) {
                const clone = res.clone();
                rscCache.put(request, clone);
              }
            })
            .catch(() => {});
          return cachedExact;
        }

        // B. Match ignoring search params in RSC cache
        const cachedIgnoreSearch = await rscCache.match(request, { ignoreSearch: true });
        if (cachedIgnoreSearch) {
          return cachedIgnoreSearch;
        }

        // C. Match by base pathname in RSC cache (e.g. /settings)
        const cachedByPathname = await rscCache.match(url.pathname);
        if (cachedByPathname) {
          return cachedByPathname;
        }

        // D. Try Network Fetch
        try {
          const networkResponse = await fetch(request);
          if (networkResponse.status === 200) {
            const clone1 = networkResponse.clone();
            const clone2 = networkResponse.clone();
            rscCache.put(request, clone1);
            rscCache.put(url.pathname, clone2);
          }
          return networkResponse;
        } catch {
          // If offline and not in cache, return 503 so Next.js falls back to hard navigation
          return new Response("Offline", {
            status: 503,
            statusText: "Offline",
            headers: { "Content-Type": "text/plain" },
          });
        }
      })()
    );
    return;
  }

  // 3. Static Assets (_next/static, css, js, fonts, images, manifest)
  if (
    url.pathname.startsWith("/_next/static/") ||
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "image" ||
    request.destination === "font"
  ) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;

        try {
          const networkResponse = await fetch(request);
          if (networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(RUNTIME_CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });
          }
          return networkResponse;
        } catch {
          return cached || new Response("", { status: 200 });
        }
      })()
    );
    return;
  }

  // 4. HTML Navigation Requests (mode === 'navigate' or text/html)
  if (
    request.mode === "navigate" ||
    (request.headers.get("accept") && request.headers.get("accept").includes("text/html"))
  ) {
    event.respondWith(
      (async () => {
        const staticCache = await caches.open(STATIC_CACHE_NAME);

        try {
          const networkResponse = await fetch(request);
          if (networkResponse.status === 200) {
            const clone1 = networkResponse.clone();
            const clone2 = networkResponse.clone();
            staticCache.put(request, clone1);
            staticCache.put(url.pathname, clone2);
          }
          return networkResponse;
        } catch {
          // 1. Exact match
          const cachedPage = await staticCache.match(request);
          if (cachedPage) return cachedPage;

          // 2. Ignore query params match
          const cachedIgnoreSearch = await staticCache.match(request, { ignoreSearch: true });
          if (cachedIgnoreSearch) return cachedIgnoreSearch;

          // 3. Pathname match
          const pathnameMatch = await staticCache.match(url.pathname);
          if (pathnameMatch) return pathnameMatch;

          // 4. Subpage shells
          if (url.pathname.startsWith("/settings")) {
            const s = await staticCache.match("/settings");
            if (s) return s;
          }
          if (url.pathname.startsWith("/calendar")) {
            const c = await staticCache.match("/calendar");
            if (c) return c;
          }
          if (url.pathname.startsWith("/history")) {
            const h = await staticCache.match("/history");
            if (h) return h;
          }
          if (url.pathname.startsWith("/statistics")) {
            const st = await staticCache.match("/statistics");
            if (st) return st;
          }

          // 5. General Dashboard shell fallback
          const dashboardCache = await staticCache.match("/dashboard");
          if (dashboardCache) return dashboardCache;

          // 6. Offline fallback page
          const offlinePage = await staticCache.match("/offline.html");
          if (offlinePage) return offlinePage;

          return new Response(
            "<!DOCTYPE html><html><head><title>Mode Offline - Ricil's</title></head><body><h1>Mode Offline Aktif</h1><p>Aplikasi siap digunakan dalam mode offline.</p></body></html>",
            {
              headers: { "Content-Type": "text/html" },
              status: 200,
            }
          );
        }
      })()
    );
    return;
  }

  // 5. Default handler: Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      return (
        cached ||
        fetch(request)
          .then((response) => {
            if (response.status === 200) {
              const clone = response.clone();
              caches.open(RUNTIME_CACHE_NAME).then((cache) => {
                cache.put(request, clone);
              });
            }
            return response;
          })
          .catch(() => cached || new Response("", { status: 200 }))
      );
    })
  );
});

// Notifications click handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes("/dashboard") && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow("/dashboard");
      }
    })
  );
});

