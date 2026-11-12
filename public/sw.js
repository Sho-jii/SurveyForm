const CACHE_NAME = "surveyform-cache-v1";
const OFFLINE_URL = "/offline.html";

const PRECACHE_ASSETS = [
  "/",
  OFFLINE_URL,
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/brand-logo.png",
  "/favicon.ico",
  "/manifest.json",
];

// 1. Install Event: Cache app shell & offline page
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn("[ServiceWorker] Precache partial error:", err);
      });
    })
  );
  self.skipWaiting();
});

// 2. Activate Event: Clean up old caches & claim clients immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event: Network-first for HTML navigation, with offline.html fallback
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip non-GET requests and API routes (do not cache mutations)
  if (request.method !== "GET" || request.url.includes("/api/")) {
    return;
  }

  // Navigation requests (HTML page loads)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match(OFFLINE_URL).then((response) => {
          return response || new Response("SurveyForm is offline. Please check your internet connection.", {
            headers: { "Content-Type": "text/plain" }
          });
        });
      })
    );
    return;
  }

  // Static assets (images, icons, styles, scripts)
  if (
    request.destination === "image" ||
    request.destination === "font" ||
    request.destination === "style" ||
    request.destination === "script" ||
    request.url.includes("/icons/")
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Fetch update in background (stale-while-revalidate)
          fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
            }
          }).catch(() => {});
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        }).catch(() => {
          // If offline and request is an icon/image
          return caches.match("/icons/icon-192x192.png");
        });
      })
    );
  }
});

