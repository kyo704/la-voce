// ============================================================================
// ★出席の 回数（★裁定 その90 §2 §4・2026-09-18）
//
//   ★★★数え方
//     ★★「いま 何回目」＝ ★**行われた** 回数（★休んでも 数えます）
//     ★★「出席」…… ★**出席した** 回数
//
//   ★★★出さない もの（★裁定 その90 §4）
//     ★✕ 率（％）
//     ★✕「9 / 12」の 形 ── ★★見た人が 割るのと、★画面が 割るのは 別 です
//     ★✕ 出席順の 並べ替え ── ★既定は 名前順
//     ★✕ 色での 警告 ── ★印だけ
//
//   ★★★「12回目 / 30回」は 全員 同じ です。★進み ぐあい です。
//     ★★これは 割り算では ありません。★「いま どこまで 来たか」です。
//     ★★だから この 1つ だけ、★スラッシュを 使います（★見本の とおり）。
//
//   ★見張り components/tests/attendance-count.test.js
// ============================================================================

/** ★数えて よい しるし（★`lib/todayBand.js` の `ATTENDANCE` と 同じ 3つ）。 */
export const COUNTED_AS_HELD = Object.freeze(["came", "absent"]);
export const COUNTED_AS_CAME = Object.freeze(["came"]);

/**
 * ★行われた 回数（★「いま 何回目」）。
 *
 *   ★★出席 と 休み を 数えます。★★休講は **数えません**。
 *     ★★休講＝その回を しなかった とき です（★`lib/opsAttendance.js` の 注）。
 *     ★★しなかった 回を「行われた」と 数えるのは、★嘘 です。
 *   ★★まだ つけて いない ものも 数えません。★起きたか 分かりません。
 */
export function heldCount(lessons) {
  return (lessons || []).filter((l) =>
    l && COUNTED_AS_HELD.includes(l.attendance)).length;
}

/** ★出席した 回数。 */
export function cameCount(lessons) {
  return (lessons || []).filter((l) =>
    l && COUNTED_AS_CAME.includes(l.attendance)).length;
}

/**
 * ★その方の 出席（★見本 ──「出席 11」）。
 *
 *   ★★★数 だけ を 返します。★率を 作れる 形に しません。
 */
export function cameWord(lessons) {
  return `出席 ${cameCount(lessons)}`;
}

/**
 * ★進み ぐあい（★見本 ──「12回目 / 30回」）。
 *
 *   ★★★門下の みなさん 同じ です。★その方の 成績では ありません。
 *   ★★年間の 回数（型）が 無ければ、★分母を 出しません。
 *     ★★★無い ものを、★在る ように 見せません。
 */
export const NO_TOTAL = "回数が まだ 決まって いません";
export function progressWord(heldTimes, total) {
  // ★★★`Number(null)` は **0** です（★2026-09-18・見張りが 捕まえました）。
  //   ★★`Number.isFinite` だけ では、★渡されて いない ことを 見分けられません。
  //   ★★★「まだ 分からない」が「0回目」と 出ます。★ちがう ことです。
  if (heldTimes === null || heldTimes === undefined || heldTimes === "") return "";
  const h = Number(heldTimes);
  const t = Number(total);
  if (!Number.isFinite(h)) return "";
  if (!Number.isFinite(t) || t <= 0) return `${h}回目`;
  return `${h}回目 / ${t}回`;
}

/**
 * ★足りない 見込みか（★見本の ★印）。
 *
 *   ★★★色を 使いません。★印だけ です（★裁定 その90 §4）。
 *   ★★★責める 形に しません。
 *   ★★見込み です ── ★残りの 回を ぜんぶ 出ても 足りない とき だけ。
 *     ★★「いま 少ない」では 出しません。★まだ 取り返せます。
 *
 *   ★★`need` … ★足りると される 回数（★学校が 決めます）。
 *     ★★無ければ、★印を 出しません。★勝手な 線を 引きません。
 */
export const SHORT_MARK = "★";
export function looksShort({ came, held, total, need }) {
  const c = Number(came), h = Number(held), t = Number(total), n = Number(need);
  if (![c, h, t, n].every(Number.isFinite)) return false;
  if (t <= 0 || n <= 0) return false;
  const のこり = Math.max(0, t - h);
  return c + のこり < n;
}

/** ★印の わけ（★画面に 出します。★黙って 印だけ 置きません）。 */
export const SHORT_NOTE =
  "★は 規定に 足りない 見込みです。責める ものでは ありません。";

/**
 * ★並び（★裁定 その90 §4 ── ★出席順に しません）。
 *
 *   ★★★渡された 順の まま 返します。★並べ替えません。
 *     ★★この 手が ある こと 自体が、★決めの 置き場 です。
 *     ★★★「出席の 多い順」を 足したく なった 日に、★ここを 見て ください。
 */
export function inGivenOrder(rows) {
  return (rows || []).slice();
}

/** ★率は 出しません（★裁定 その90）。★この 字を 画面に 出します。 */
export const NO_RATE_LINE = "率（％）は 出しません。回数だけです。";
