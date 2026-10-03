const STATIC_CACHE_NAME = "ricils-pwa-static-v4";
const RUNTIME_CACHE_NAME = "ricils-pwa-runtime-v4";
const API_CACHE_NAME = "ricils-pwa-api-v4";

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
  const currentCaches = [STATIC_CACHE_NAME, RUNTIME_CACHE_NAME, API_CACHE_NAME];
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
          // Return empty offline JSON fallback if not cached yet
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

  // 2. Next.js Static Chunks, Images, Styles, Fonts, RSC Payloads (Stale-While-Revalidate with Cache-Ignore-Search fallback)
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.searchParams.has("_rsc") ||
    request.headers.get("rsc") === "1" ||
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "image" ||
    request.destination === "font"
  ) {
    event.respondWith(
      (async () => {
        // Exact match first
        const cached = await caches.match(request);
        if (cached) {
          // If online, update in background
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse.status === 200) {
                const clone = networkResponse.clone();
                caches.open(RUNTIME_CACHE_NAME).then((cache) => {
                  cache.put(request, clone);
                });
              }
            })
            .catch(() => {});
          return cached;
        }

        // Try matching ignoring search params (e.g. ?_rsc=hash)
        const cachedIgnoreSearch = await caches.match(request, { ignoreSearch: true });
        if (cachedIgnoreSearch) {
          return cachedIgnoreSearch;
        }

        // Try network fetch
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
          // Fallback for RSC / sub-routes
          if (url.searchParams.has("_rsc") || request.headers.get("rsc") === "1") {
            const baseCached = await caches.match(url.pathname, { ignoreSearch: true });
            if (baseCached) return baseCached;
            const dashCached = await caches.match("/dashboard");
            if (dashCached) return dashCached;
          }
          // Default empty 200 response to prevent Promise resolving to undefined
          return new Response("", { status: 200, headers: { "Content-Type": "text/plain" } });
        }
      })()
    );
    return;
  }

  // 3. HTML Navigation Requests (Network First with fallback to Cached Page / App Shell)
  if (
    request.mode === "navigate" ||
    (request.headers.get("accept") && request.headers.get("accept").includes("text/html"))
  ) {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request);
          if (networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(STATIC_CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });
          }
          return networkResponse;
        } catch {
          // Attempt exact cached page match
          const cachedPage = await caches.match(request);
          if (cachedPage) return cachedPage;

          // Attempt match ignoring query params
          const cachedIgnoreSearch = await caches.match(request, { ignoreSearch: true });
          if (cachedIgnoreSearch) return cachedIgnoreSearch;

          // Match by specific pathname
          const pathnameMatch = await caches.match(url.pathname);
          if (pathnameMatch) return pathnameMatch;

          // If navigation is within app, try fallback to cached /settings or /dashboard shell
          if (
            url.pathname.startsWith("/dashboard") ||
            url.pathname.startsWith("/calendar") ||
            url.pathname.startsWith("/history") ||
            url.pathname.startsWith("/statistics") ||
            url.pathname.startsWith("/settings")
          ) {
            const settingsCache = await caches.match("/settings");
            if (settingsCache && url.pathname.startsWith("/settings")) return settingsCache;
            const dashboardCache = await caches.match("/dashboard");
            if (dashboardCache) return dashboardCache;
          }

          // Fallback to offline.html
          const offlinePage = await caches.match("/offline.html");
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

  // 4. Default handler: Stale-While-Revalidate
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
