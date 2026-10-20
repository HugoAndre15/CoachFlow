/* Cache only the public terrain shell. Never cache API responses or account pages. */
const CACHE = "coachflow-terrain-v1";
const FILES = [
  "/terrain/index.html",
  "/terrain/app.js",
  "/terrain/store.js",
  "/terrain/model.js",
  "/terrain/style.css",
  "/api/terrain-config",
];
self.addEventListener("install", (event) =>
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES))),
);
self.addEventListener("activate", (event) =>
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys())
        if (key.startsWith("coachflow-terrain-") && key !== CACHE)
          await caches.delete(key);
      await self.clients.claim();
    })(),
  ),
);
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (
    event.request.method !== "GET" ||
    url.origin !== self.location.origin ||
    !FILES.includes(url.pathname)
  )
    return;
  event.respondWith(
    caches
      .open(CACHE)
      .then(
        async (cache) =>
          (await cache.match(url.pathname)) || fetch(event.request),
      ),
  );
});
