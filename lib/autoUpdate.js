// ============================================================================
// ★自動で 新しい版に する（★2026-09-11・坂本さんの お決め）
//
//   ★★きょう、★配信したのに 実機が 変わらない、が 起きました。
//     ★★原因は Service Worker の 版では ありませんでした。
//       ★覚えた HTML でした（★詳しくは public/sw.js の 註）。
//     ★★だから、★Service Worker に 頼らない 見張りを 足します。
//
//   ★★見るのは 2つの 数です。
//     ① NEXT_PUBLIC_BUILD_SHA … ★この 画面が どの版で 焼かれたか
//        ★組み立ての ときに 埋まります（next.config.mjs）。
//     ② /api/version の short … ★いま 配信されている 版
//        ★★force-dynamic です。★Service Worker も 横取りしません。
//   ★★2つが ちがえば、★新しい 版が 出ています。
//     ★何が 古いキャッシュを 持っていても、★これは 効きます。
//
//   ★★お決め（2026-09-11）
//     「★書きかけが あるときは、★次に その画面を 離れるまで 待つ。
//       ★通知も 出さない」
//     ★★書きかけを 失わせません。★それが いちばん 重い 決まりです。
//
//   ★★読み込み直しの ループを、★絶対に 起こさないこと。
//     ★守りを 4つ 重ねます（★lib/swUpdate.js と 同じ 考え）。
//       ① 版が 分からないとき（dev・unknown）は しない
//       ② この ページの 寿命で 1回だけ
//       ③ 直前に していたら しない（★覚え書きの 時刻）
//       ④ 書きかけが あるときは しない
//
//   ★見張り components/tests/auto-update.test.js
// ============================================================================

/** ★読み込み直したことを 覚える 鍵。★タブを 閉じれば 消えます。 */
export const RELOAD_MARK = "woolsong-build-reloaded-at";

/** ★直前の 読み込み直しから、★これだけ 経っていなければ しません。 */
export const RELOAD_COOLDOWN_MS = 60000;

/** ★どれくらいごとに 見にいくか。 */
export const POLL_MS = 20 * 60 * 1000;

/** ★問い合わせが 返らないときに、★あきらめるまで。 */
export const FETCH_TIMEOUT_MS = 8000;

/** ★この 画面が 焼かれた 版。★分からなければ null。 */
export function bakedSha() {
  const v = (process.env.NEXT_PUBLIC_BUILD_SHA || "").trim();
  if (!v || v === "dev" || v === "unknown") return null;
  return v;
}

/**
 * ★新しい版に すべきか。
 *
 *   ★★1つでも 欠けたら false です。★迷ったら しません。
 *     ★読み込み直しは、★書きかけを 失う 恐れの ある 行いです。
 *
 *   @param o.baked   この 画面の 版
 *   @param o.live    配信されている 版
 *   @param o.dirty   書きかけが あるか
 *   @param o.already このページで もう したか
 *   @param o.lastAt  直前に した 時刻（★ミリ秒。★無ければ 0）
 *   @param o.now     いま（★ミリ秒）。★時計を 見ません。★受け取ります
 */
export function shouldReload(o) {
  const x = o || {};
  if (!x.baked || !x.live) return false;          // ★① 分からないときは しない
  if (x.baked === x.live) return false;           // ★★同じなら 何も しない
  if (x.already) return false;                    // ★② 1ページ 1回
  if (Number(x.now || 0) - Number(x.lastAt || 0) < RELOAD_COOLDOWN_MS) return false; // ★③
  if (x.dirty) return false;                      // ★④ 書きかけが あれば 待つ
  return true;
}

/**
 * ★新しい版が 出ているか（★書きかけは 見ません）。
 *
 *   ★★「待っている」状態を 覚えておくために 要ります。
 *     ★書きかけが 済んだ 瞬間に、★もう一度 聞きに 行かなくて よいように。
 */
export function isStale(baked, live) {
  return !!(baked && live && baked !== live);
}

/** ★配信されている 版を 聞きます。★落ちません。★返らなければ null。 */
export async function fetchLiveSha(fetchImpl, timeoutMs) {
  const f = fetchImpl || (typeof fetch !== "undefined" ? fetch : null);
  if (!f) return null;
  const ms = Number(timeoutMs || FETCH_TIMEOUT_MS);
  let timer = 0;
  try {
    const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    if (ctrl) timer = setTimeout(() => ctrl.abort(), ms);
    // ★★覚え書きを 使わせません。★いつも 取りに 行きます。
    const res = await f("/api/version", {
      cache: "no-store",
      signal: ctrl ? ctrl.signal : undefined
    });
    if (!res || !res.ok) return null;
    const j = await res.json();
    const s = j && typeof j.short === "string" ? j.short.trim() : "";
    return (!s || s === "unknown") ? null : s;
  } catch (e) {
    // ★★つながらないのは ふつうの ことです。★何も しません。
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** ★直前に した 時刻を 読みます。★読めなければ 0。 */
export function readLastReloadAt() {
  if (typeof window === "undefined") return 0;
  try {
    const v = window.sessionStorage.getItem(RELOAD_MARK);
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  } catch (e) {
    return 0;
  }
}

/** ★した 時刻を 覚えます。★覚えられなくても 落ちません。 */
export function markReloaded(now) {
  if (typeof window === "undefined") return;
  try { window.sessionStorage.setItem(RELOAD_MARK, String(now)); } catch (e) { /* ★そのまま */ }
}
