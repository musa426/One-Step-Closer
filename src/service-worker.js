/* global self, caches */
// npm run build injects this build's ID and assets into public/sw.js.
const BUILD_ID = "BUILD_ID_PLACEHOLDER";
const CACHE_PREFIX = "one-step-closer-";
const CACHE_NAME = CACHE_PREFIX + BUILD_ID;
const PRECACHE = ["PRECACHE_PLACEHOLDER"];
const ROUTES = new Set(["/", "/weekly", "/places", "/partner", "/settings"]);

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)));
  // Let existing tabs finish using their matching HTML and JavaScript.
  // A new version activates once those tabs have been closed.
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  const pathname = url.pathname === "/" ? "/" : url.pathname.replace(/\/$/, "");
  if (request.mode === "navigate" && ROUTES.has(pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      return (await cache.match(pathname)) || fetch(request);
    })());
    return;
  }

  // Never substitute HTML for Next.js RSC/flight responses.
  // Next.js falls back to a full navigation when a route fetch is offline.
  if (request.headers.get("RSC") === "1") return;
  if (!PRECACHE.includes(url.pathname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    return (await cache.match(url.pathname)) || fetch(request);
  })());
});
