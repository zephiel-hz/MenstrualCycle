const STATIC_CACHE_NAME = "ricils-pwa-static-v2";
const RUNTIME_CACHE_NAME = "ricils-pwa-runtime-v2";
const API_CACHE_NAME = "ricils-pwa-api-v2";

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

// Install: precache primary static assets & page shells
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn("Precache partial error:", err);
      });
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
    // Skip auth/session routes from long caching if not necessary, but allow /api/cycles, /api/logs, etc.
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(API_CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
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
        })
    );
    return;
  }

  // 2. Next.js Static Chunks, Images, Styles, Fonts (Stale-While-Revalidate / Cache-First)
  if (
    url.pathname.startsWith("/_next/static/") ||
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "image" ||
    request.destination === "font"
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(RUNTIME_CACHE_NAME).then((cache) => {
                cache.put(request, clone);
              });
            }
            return networkResponse;
          })
          .catch(() => cached);

        return cached || fetchPromise;
      })
    );
    return;
  }

  // 3. HTML Navigation Requests (Network First with fallback to Cached Page / App Shell)
  if (
    request.mode === "navigate" ||
    (request.headers.get("accept") && request.headers.get("accept").includes("text/html"))
  ) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(STATIC_CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Attempt exact cached page match
          const cachedPage = await caches.match(request);
          if (cachedPage) {
            return cachedPage;
          }

          // If navigation is within app, try fallback to cached /dashboard shell
          if (
            url.pathname.startsWith("/dashboard") ||
            url.pathname.startsWith("/calendar") ||
            url.pathname.startsWith("/history") ||
            url.pathname.startsWith("/statistics") ||
            url.pathname.startsWith("/settings")
          ) {
            const dashboardCache = await caches.match("/dashboard");
            if (dashboardCache) {
              return dashboardCache;
            }
          }

          // Fallback to offline.html
          const offlinePage = await caches.match("/offline.html");
          if (offlinePage) {
            return offlinePage;
          }

          return new Response("Mode Offline - Ricil's", {
            headers: { "Content-Type": "text/html" },
          });
        })
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
          .catch(() => cached)
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

