// ============================================================================
// Service Worker の更新経路（配信と更新の確認.md §3-1）
//
// ★なぜ要るか
//   skipWaiting と clients.claim は public/sw.js にあり、
//   「新しい版が来たら待たずに有効化する」までは済んでいます。
//   しかし、★新しい版が来たことに気づく仕組みがありませんでした。
//   ブラウザが自発的に sw.js を取りに行くのは、おおむね24時間ごとです。
//   ホーム画面から開いたまま何日も使う人には、古い版が残り続けます。
//   実際に「iPadで古い画面が表示された」という報告になりました。
//
// ★やること（§3-1 の残り2つ）
//   ① 開いたとき・バックグラウンドから戻ったときに registration.update()
//   ② controllerchange を受けたら、★1回だけ location.reload()
//
// ★リロードのループを絶対に起こさないこと（§6-3）。
//   守りを3つ重ねます。
//     ・最初から制御下でなければ、リロードしない（初回インストール時）
//     ・このページの寿命で1回だけ（モジュール内のフラグ）
//     ・直前にリロードしていたら、しない（sessionStorage の時刻）
// ============================================================================

/** リロードしたことを覚えておく鍵。★タブを閉じれば消えます。 */
const RELOAD_MARK = "woolsong-sw-reloaded-at";

/** 直前のリロードから、これだけ経っていなければリロードしない（ミリ秒）。 */
const RELOAD_COOLDOWN_MS = 10000;

/**
 * 更新の見張りを始める。
 * @param {ServiceWorkerRegistration} registration
 * @param {object} deps  差し替え用（テストから呼ぶため）
 * @returns {function} 後片付け
 */
export function watchForUpdates(registration, deps = {}) {
  const doc = deps.document || (typeof document !== "undefined" ? document : null);
  const win = deps.window || (typeof window !== "undefined" ? window : null);
  if (!registration || !doc || !win) return () => {};

  // ① 開いたとき・戻ったときに、新しい版が無いか確かめる
  const check = () => {
    if (doc.visibilityState && doc.visibilityState !== "visible") return;
    try { registration.update(); } catch { /* 取りに行けなくても、画面は動きます */ }
  };
  check();
  doc.addEventListener("visibilitychange", check);
  win.addEventListener("focus", check);

  return () => {
    doc.removeEventListener("visibilitychange", check);
    win.removeEventListener("focus", check);
  };
}

/**
 * 新しい版が制御を取ったら、★1回だけ読み込み直す。
 *
 * @param {object} deps  差し替え用
 * @returns {function} 後片付け
 */
export function reloadOnceOnControllerChange(deps = {}) {
  const nav = deps.navigator || (typeof navigator !== "undefined" ? navigator : null);
  const win = deps.window || (typeof window !== "undefined" ? window : null);
  const store = deps.sessionStorage
    || (typeof sessionStorage !== "undefined" ? sessionStorage : null);
  const now = deps.now || (() => Date.now());
  if (!nav || !nav.serviceWorker || !win) return () => {};

  // ★守り1: 最初から制御下でなければ、リロードしない。
  //   初回インストールでも controllerchange は起きます。そこで読み込み直すと、
  //   初めて開いた人がいきなり再読み込みを見ることになります。
  const hadController = !!nav.serviceWorker.controller;

  // ★守り2: このページの寿命で1回だけ。
  let done = false;

  const onChange = () => {
    if (!hadController || done) return;
    // ★守り3: 直前にリロードしていたら、しない。
    //   万一 controllerchange が繰り返し起きても、ループになりません。
    try {
      const last = store && Number(store.getItem(RELOAD_MARK));
      if (last && now() - last < RELOAD_COOLDOWN_MS) return;
      if (store) store.setItem(RELOAD_MARK, String(now()));
    } catch { /* sessionStorage が使えなくても、守り1と2は効きます */ }
    done = true;
    win.location.reload();
  };

  nav.serviceWorker.addEventListener("controllerchange", onChange);
  return () => nav.serviceWorker.removeEventListener("controllerchange", onChange);
}
