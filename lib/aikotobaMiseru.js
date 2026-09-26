// ============================================================================
// ★合言葉を 見せる（★門下に 招く・2026-09-26・D群・裁定83）
//
//   ★見本 `SC['合言葉を見せる']`。★題は「門下に 招く」です。
//   ★台帳 `public.teacher_invitations`（★`cap` ／ `used_count` は `sql/103`・
//     ★本番 138本目・2026-09-26）と、★数える 関数 `public.invite_status(code)`。
//
//   ★★★2026-09-26 まで 作れませんでした ── ★上限の 列が 無かった から です。
//     ★★見本の 約束「★N人に なると、ひとりでに 閉じます」「★あと N人」が
//       ★守れませんでした。★`sql/103` で `cap` と `used_count` が 入りました。
//     ★★「打ち間違いは おひとり 10回」も 同じ 日に 入りました（★`invite_attempts`）。
//
//   ★★★下の 5行は **約束** です。★消さないこと ──
//     ①「顔合わせで、お手元で お見せください。」
//       ★★★だから 送る 道を 作りません ── ★メールも LINE も 貼りません。
//     ②「これを 打つと、学校と 門下が 一度に 決まります。あとで 選び直す 画面は ありません。」
//       ★★選び直す 画面を 作らない こと。★作ったら この 行が 嘘に なります。
//     ③「N人に なると、ひとりでに 閉じます。」
//       ★★数は `cap` から。★書き写しません。★`cap` が 無い ときは この 行を 出しません。
//     ④「作り直すと、前の 合言葉は すぐ 使えなく なります。」
//     ⑤「打ち間違いは おひとり 10回までです（同じ 場所からでも、人ごとに 数えます）。」
//       ★★`invite_attempts` は `user_id` ／ `day` ／ `n` です ── ★人ごと に 数えます。
//       ★★★「同じ 場所からでも」── ★`ip` を 見ません。★持って いません。
//
//   ★★★QR は 作りません（★見本は 絵の 代わりを 描いて います）。
//     ★★外の 道具を 呼ばない、という この 家の 決め です。
//     ★★字（合言葉）だけ で 足ります ── ★見本も「★QR が 読めない 端末が ある」と 書いて います。
//
//   ★見張り components/tests/aikotoba-miseru.test.js
// ============================================================================

import { tx } from "@/lib/t";

/** ★戻る 先（★見本 `bk('門下')`）。 */
export const BACK_TO = tx("門下");

/** ★題（★見本の `h2`）。 */
export const TITLE = tx("門下に 招く");

/** ★台帳の 関数の 名（★2か所に 書かない ため）。 */
export const RPC_STATUS = "invite_status";

/** ★台帳から 読む 列。 */
export const COLS = "code, cap, used_count, expires_at";

/**
 * ★あと 何人（★見本 ── `あと 5人`）。
 *
 *   ★★★`cap` が 無い ときは **出しません**（★個別の 合言葉 ── ★1回で 閉じます）。
 *     ★★そこに「あと 1人」と 出すと、★人数の 上限が ある ように 読めます。
 *   ★★負の 数に しません。
 */
export function leftWord(status) {
  const s = status || {};
  if (s.left === null || s.left === undefined) return "";
  const n = Math.max(0, Number(s.left) || 0);
  return tx("あと {n}人").replace("{n}", String(n));
}

/** ★いつまで（★見本 ── `10月31日まで`）。★無ければ 空。 */
export function untilWord(status) {
  const d = String((status || {}).until || "");
  return /^\d{4}-\d{2}-\d{2}/.test(d)
    ? tx("{d}まで").replace("{d}", d.slice(0, 10)) : "";
}

/** ★2つの 札（★見本の `.two`）。 */
export const BTN_COPY = tx("写す");
export const BTN_RENEW = tx("作り直す");
export const BTN_LIMITS = tx("人数と 期限を 変える");

/** ★押した あとの 一言（★見本の `toast`）。 */
export const COPIED = tx("写しました");
export const RENEWED = tx("作り直しました");

/**
 * ★下の 断り（★約束）。
 *
 *   ★★3行目の 人数は `cap` から 出します。★書き写しません。
 *     ★★`cap` が 無い ときは **その 行を 出しません** ── ★人数で 閉じない から です。
 */
export function noteLines(status) {
  const s = status || {};
  const 出 = [
    tx("顔合わせで、お手元で お見せください。"),
    tx("これを 打つと、学校と 門下が 一度に 決まります。あとで 選び直す 画面は ありません。")
  ];
  if (s.cap !== null && s.cap !== undefined) {
    出.push(tx("{n}人に なると、ひとりでに 閉じます。").replace("{n}", String(Number(s.cap) || 0)));
  }
  出.push(tx("作り直すと、前の 合言葉は すぐ 使えなく なります。"));
  出.push(tx("打ち間違いは おひとり 10回までです（同じ 場所からでも、人ごとに 数えます）。"));
  return 出;
}

/** ★太字に する 行（★見本の `<b>` ── ★どの 行にも あります）。 */
export function noteStrong(status) {
  return noteLines(status).map((_, i) => i);
}

/** ★合言葉が 読めない とき（★`invite_status` が `ok:false` を 返した とき）。 */
export const GONE_LINE = tx("この 合言葉は もう ありません。");
export const GONE_HOW = tx("作り直すと、新しい 合言葉が 出ます。");
export function isGone(status) {
  return !status || status.ok === false;
}
