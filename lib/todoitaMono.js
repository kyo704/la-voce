// ============================================================================
// ★届いたもの（★2026-09-26・D群）
//
//   ★見本 `SC['届いたもの']`。★台帳 `public.page_inquiries`（★10列）と
//     ★`public.blocked_senders`（★3列）── ★2026-09-26 に 数えました。
//
//   ★★★下の 4行は **約束** です。★消さないこと ──
//     ①「お返しは ご自分の メールから お願いします。ここに 返信の 欄は ありません。」
//       ★★★返信の 欄を **置きません**。★「できません」と 書いて 欄を 置く のでは ない。
//         ★★欄が あれば、★いつか 誰かが つなぎます（★`自分の門下` と 同じ 判じ）。
//     ②「90日で 消えます。残したいものは、お手元に お写しください。」
//       ★★日数は `lib/renraku.js` の `HIDE_AFTER_DAYS` から 出します。★書き写しません。
//     ③「同じ方から たくさん 届くときは、その方からを 止められます
//        （お名前は 相手に 伝わりません）。」
//       ★★`blocked_senders` は `email_hash` だけ を 持ちます ── ★お名前も 本文も 持ちません。
//       ★★★だから「伝わりません」は 本当 です。★相手に 知らせる 道も ありません。
//     ④「受け付けないことも できます（はじめは 受け付けません）。」
//       ★★★空きを 入れないこと ── ★見本は 「受け付けないことも」 です（★2026-09-26 に 数えました）。
//       ★★既定は **受け付けない** です。★`portfolios.contact_mode` が 決めます。
//
//   ★★★「済」は 印 だけ です。★数えません。★率も 出しません。
//
//   ★見張り components/tests/todoita-mono.test.js
// ============================================================================

import { tx } from "@/lib/t";
import { HIDE_AFTER_DAYS, whenWord } from "@/lib/renraku";

/** ★戻る 先（★見本 `bk('ページの設定')`）。 */
export const BACK_TO = tx("ページの設定");

/** ★題。 */
export const TITLE = tx("届いたもの");

/** ★題の 下の 1行。 */
export const LEAD = tx("あなたの ページから 届いた ものです。");

/** ★1つも 無い とき。★責めません。★0件と 書きません。 */
export const EMPTY_LINE = tx("まだ ありません。");

/** ★済みの 印（★見本の `済`）。★数えません。 */
export const DONE_MARK = tx("済");
export function markOf(row) {
  return (row && row.done_at) ? DONE_MARK : "";
}

/**
 * ★日（★見本は「9月20日」── ★2026-09-26 に 数えました）。
 *
 *   ★★★`YYYY-MM-DD` を そのまま 出して いました。★見本と 違って いました。
 *   ★★★日の 字は `lib/renraku.js` の `whenWord` が 持ちます。★ここで 組み立てません ──
 *     ★★台帳は UTC です。★字を 切ると 日が ずれます（★あちらの 註）。
 *     ★★この 画面も 同じ 便り の 台帳を 読みます。★同じ 出し方で なければ、
 *       ★★同じ 便りが 2つの 画面で 別の 日に 見えます。
 */
export function dayOf(row) {
  return whenWord(String((row || {}).created_at || ""));
}

/**
 * ★1行の 下に 添える 字（★見本 ── `9月20日　10月の 公演の 件で…`）。
 *
 *   ★★本文は そのまま です。★こちらで 切りません ── ★切ると、★何の 話かが 消えます。
 *     ★★長い ものは 画面の 側で 折ります。
 */
export function subOf(row) {
  const r = row || {};
  return [dayOf(r), String(r.body || "").trim()].filter(Boolean).join("　");
}

/** ★お名前（★`from_name`。★無ければ 空。★メールは 出しません）。 */
export function nameOf(row) {
  return String((row || {}).from_name || "").trim();
}

/** ★止める 札（★見本の 註の とおり。★お名前は 相手に 伝わりません）。 */
export const BTN_BLOCK = tx("この方からを 止める");

/**
 * ★下の 断り（★約束）。
 *
 *   ★★2行目の 日数は `HIDE_AFTER_DAYS` から。★書き写しません。
 */
export function noteLines() {
  return [
    tx("お返しは ご自分の メールから お願いします。ここに 返信の 欄は ありません。"),
    tx("{n}日で 消えます。残したいものは、お手元に お写しください。")
      .replace("{n}", String(HIDE_AFTER_DAYS)),
    tx("同じ方から たくさん 届くときは、その方からを 止められます（お名前は 相手に 伝わりません）。"),
    tx("受け付けないことも できます（はじめは 受け付けません）。")
  ];
}

/** ★太字に する 行（★見本の `<b>`）。 */
export const NOTES_STRONG = Object.freeze([0, 1, 2, 3]);

/**
 * ★台帳から 読む 列（★`select('*')` を 書かない ため）。
 *
 *   ★★★`from_email` を **読みません** ── ★画面に 出しません。
 *     ★★止める ときも `email_hash` は 台帳の 側で 作ります。
 *       ★★こちらに 生の メールを 持ちません。
 */
export const COLS = "id, from_name, body, created_at, done_at, spam";

/** ★迷いの ものは 出しません（★`spam` が 真の 行）。 */
export function visibleRows(rows) {
  return (Array.isArray(rows) ? rows : []).filter((r) => r && !r.spam);
}
