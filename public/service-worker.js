const LOCK_ON_CACHE = [
  "/",
  "/api/transaction",
  "/db.js",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/index.html",
  "/index.js",
  "/manifest.webmanifest",
  "/style.css",
];

const START_CACHE_NAME = "static-cache-v13";
const SETUP_CACHE_NAME = "data-cache-v8";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(START_CACHE_NAME).then((cache) => {
      console.log("Pre-Cache check success!");
      return cache.addAll(LOCK_ON_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
          if (key !== START_CACHE_NAME && key !== SETUP_CACHE_NAME) {
            console.log("cache data removal in progress.", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.url.includes("/api/")) {
    console.log("[Service Worker] Fetch (data)", event.request.url);

    event.respondWith(caches.open(SETUP_CACHE_NAME).then((cache) => {
        return fetch(event.request)
          .then((response) => {
            if (response.status === 200) {
              cache.put(event.request.url, response.clone());
            }
            return response;
          })
          .catch((err) => {
            return cache.match(event.request);
          });
      })
    );

    return;
  }

  event.respondWith(
    caches.open(START_CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((response) => {
        return response || fetch(event.request);
      });
    })
  );
});