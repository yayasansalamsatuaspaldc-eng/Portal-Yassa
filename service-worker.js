const CACHE_NAME = "portal-yassa-v6";
const APP_SHELL = [
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

// Install: cache app shell
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
});

// Activate: bersihkan cache versi lama
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: cache-first untuk shell portal saja.
// Aplikasi GAS yang dibuka lewat kartu (target lain/tab baru) TIDAK melalui service worker ini,
// jadi tidak akan ikut ke-cache atau bikin data GAS jadi basi.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isShellRequest = APP_SHELL.some((path) =>
    url.pathname.endsWith(path.replace("./", "/"))
  );

  if (!isShellRequest) return; // biarkan request lain (mis. ke script.google.com) lewat normal

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
      );
    })
  );
});
