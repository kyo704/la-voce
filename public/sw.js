// このファイルは public/sw.js として配置してください。
// La Voce の最小限のService Worker。PWAとして「インストール可能」になるための
// 要件（Service Workerの登録）を満たすことが主目的で、複雑なオフライン機能は持たせていません。
// アプリ自体は元々オンライン（Supabase）が前提のため、ここでは「アプリの外枠（HTML/CSS/JS）」
// だけをキャッシュし、開けなくなることを防ぐ程度に留めています。

const CACHE_NAME = "la-voce-shell-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ネットワーク優先、失敗したときだけキャッシュにフォールバックする（データの新しさを優先するため）。
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
