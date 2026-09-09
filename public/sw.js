// このファイルは public/sw.js として配置してください。
// La Voce の最小限のService Worker。PWAとして「インストール可能」になるための
// 要件（Service Workerの登録）を満たすことが主目的で、複雑なオフライン機能は持たせていません。
// アプリ自体は元々オンライン（Supabase）が前提のため、ここでは「アプリの外枠（HTML/CSS/JS）」
// だけをキャッシュし、開けなくなることを防ぐ程度に留めています。

// エラー応答を取り込んでしまった古いキャッシュを捨てるため、版を上げる。
// ★版を上げると、activate で古い版（la-voce-shell-v2 など）が消えます。
const CACHE_NAME = "woolsong-shell-v4";

// オフラインのときに必ず出せる画面。★install で焼き込みます。
//   これが無いと、キャッシュに無いURLへ移動したときに
//   respondWith がエラー応答を返し、standalone のPWAでは
//   ブラウザのオフライン画面も出ないため★真っ白になります。
//   2026-08-29 の実機確認（§5 テスト4）で、実際にそうなりました。
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  // ★焼き込みに失敗しても install は止めません。
  //   止めると Service Worker 自体が入らず、更新の経路まで死にます。
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.add(new Request(OFFLINE_URL, { cache: "reload" })))
      .catch(() => { /* 取得できなくても、オンラインでは普通に動きます */ })
  );
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
// ★★羊と部屋の絵は、★横取りしません（★2026-09-09）。
//
//   ★★実機の 記録で、★1,089 の 求めと 16.31秒 でした。
//     ★顔の 絵 1枚に 1.67秒 かかっていました。
//   ★★この Service Worker は、★すべての GET を 横取りして、
//     ★成功した応答を 1つずつ Cache Storage に 書き写していました。
//     ★★絵が 何百枚も あると、★その書き写しが 積み上がります。
//   ★★絵は、★ブラウザの ふつうの 覚え書きに まかせます。
//     ★next.config.mjs で immutable を 付けました。★1年 覚えます。
//     ★★そのほうが 速く、★Service Worker より 確かです。
//   ★★外枠（HTML／CSS／JS）は、これまでどおり 面倒を見ます。
//     ★オフラインで 真っ白に しない、という 役目は 変わりません。
function isAsset(url) {
  try {
    const u = new URL(url);
    return u.pathname.startsWith("/sheep/");
  } catch (e) {
    return false;
  }
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  // ★★絵は 横取りしません。★respondWith を 呼ばなければ、
  //   ★ブラウザが ふだんどおり 取りに行きます。
  if (isAsset(event.request.url)) return;
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
        // まず、そのURL自身の控えを探す
        const cached = await caches.match(event.request);
        if (cached) return cached;
        // ★画面への移動なら、必ず何かを返すこと。
        //   ここで Response.error() を返すと、standalone のPWAでは
        //   真っ白になります（§5 テスト4 の失敗）。
        //   ★とくに start_url の「/」は、ログイン済みだと 307 を返すため、
        //     response.ok の条件に掛からず、永久にキャッシュされません。
        //     どれだけオンラインで使っても貯まらないので、
        //     「使っていれば大丈夫」という前提が成り立ちません。
        if (event.request.mode === "navigate") {
          const offline = await caches.match(OFFLINE_URL);
          if (offline) return offline;
        }
        return Response.error();
      })
  );
});
