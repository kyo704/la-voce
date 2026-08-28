// このファイルは public/sw.js として配置してください。
// La Voce の最小限のService Worker。PWAとして「インストール可能」になるための
// 要件（Service Workerの登録）を満たすことが主目的で、複雑なオフライン機能は持たせていません。
// アプリ自体は元々オンライン（Supabase）が前提のため、ここでは「アプリの外枠（HTML/CSS/JS）」
// だけをキャッシュし、開けなくなることを防ぐ程度に留めています。

// エラー応答を取り込んでしまった古いキャッシュを捨てるため、版を上げる。
// ★版を上げると、activate で古い版（la-voce-shell-v2 など）が消えます。
const CACHE_NAME = "woolsong-shell-v3";

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
        // ★重要: 成功した応答だけをキャッシュする。
        // 以前はステータスを見ずに cache.put していたため、504 などのエラー応答まで
        // キャッシュに入り、障害が復旧したあとも「キャッシュ済みの504」が
        // 返り続けることがあった（オフライン時のフォールバックが壊れる）。
        if (response && response.ok && response.type === "basic") {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          }).catch(() => { /* 容量超過などは無視してよい */ });
        }
        return response;
      })
      // ★キャッシュに無いときは undefined が返ります。
      //   respondWith(undefined) は
      //   「Failed to convert value to 'Response'」で落ち、
      //   一瞬の通信断が、そのままページ遷移の失敗になります。
      //   必ず Response を返すこと。
      .catch(async () => {
        const cached = await caches.match(event.request);
        return cached || Response.error();
      })
  );
});
