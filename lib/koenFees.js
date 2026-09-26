// ============================================================================
// ★参加費（★2026-09-26・D群・裁定201）
//
//   ★見本 `SC['参加費']`。★台帳 `public.koen_fees`（★2026-09-26 に 数えました：9列）。
//
//   ★★★裁定201 ── ★決済・送金・販売・源泉徴収・相場集計は **しません**。
//     ★★だから ここは「いただいたか どうか」の 記録 だけ です。
//
//   ★★★下の 3行は **約束** です。★消さないこと ──
//     ①「お金の やりとりは、この アプリの 外で 行います。
//        ★ここは いただいたかどうかの 記録だけ です。」
//       ★★`koen_fees` に 決済の 列は ありません（★`paid_on` は 日 だけ）。
//     ②「まだの方に、アプリから 催促は しません。」
//       ★★★催促の 道を 作らない こと。★お知らせも 出しません。
//         ★★`lib/…` に この 表から 通知を 出す 道は ありません。
//     ③「出演者には ご自分のぶんだけ 見えます。ほかの方の ことは 出ません。」
//       ★★台帳の 決まりが そう して います。★画面でも 混ぜません。
//
//   ★★★「％」も「平均」も 出しません（★CLAUDE.md）。★数 だけ です。
//
//   ★見張り components/tests/koen-fees.test.js
// ============================================================================

/** ★戻る 先（★見本 `bk('公演の運営')`）。 */

import { tx } from "@/lib/t";
export const BACK_TO = tx("公演の 運営");

/** ★題。 */
export const TITLE = tx("参加費");

/** ★上の 3行の 札（★見本の `card`）。 */
export const HEAD_EACH = tx("ひとり");
export const HEAD_PAID = tx("いただいた");
export const HEAD_YET = tx("まだ");

/** ★ひとりずつ の 節（★見本の `sh3`）。 */
export const LIST_HEAD = tx("ひとりずつ");

/** ★1人の 右に 出る 字（★見本 ── `いただいた ›` ／ `まだ ›`）。 */
export function markOf(row) {
  return (row && row.paid_on) ? HEAD_PAID : HEAD_YET;
}

/** ★いただいた 日（★無ければ 空。★「—」で 埋めません）。 */
export function paidDayOf(row) {
  const d = String((row || {}).paid_on || "");
  return /^\d{4}-\d{2}-\d{2}/.test(d) ? d.slice(0, 10) : "";
}

/** ★いただいた 人数。★率を 作れる 形に しません。 */
export function paidCount(rows) {
  return (Array.isArray(rows) ? rows : []).filter((r) => r && r.paid_on).length;
}

/** ★まだの 人数。 */
export function yetCount(rows) {
  return (Array.isArray(rows) ? rows : []).filter((r) => r && !r.paid_on).length;
}

/**
 * ★「ひとり いくら」。
 *
 *   ★★★`koen` に「ひとりの 額」の 列が ありません（★2026-09-26 に 数えました：15列）。
 *     ★★だから 行から 出します ── ★**ぜんぶ 同じ 額の ときだけ** 出します。
 *     ★★★ちがう 額が 混ざって いる ときは **出しません**。
 *       ★★平均も 最も 多い 額も 出しません ── ★どちらも 嘘に なります。
 *       ★★「ひとりずつ」の 一覧に 実際の 額が 出ます。★そこで 分かります。
 *   ★★1行も 無い ときも 出しません。
 */
export function eachYen(rows) {
  const 列 = (Array.isArray(rows) ? rows : []).filter((r) => r && Number.isFinite(Number(r.amount_yen)));
  if (列.length === 0) return null;
  const 種 = new Set(列.map((r) => Number(r.amount_yen)));
  return 種.size === 1 ? [...種][0] : null;
}

/** ★円（★区切りを 手で 書きません）。 */
export function yen(n) {
  const v = Number(n);
  return Number.isFinite(v) ? `${v.toLocaleString("ja-JP")}円` : "";
}

/** ★人（★見本 ── `31人`）。 */
export function people(n) {
  return `${Number(n) || 0}人`;
}

/** ★下の 断り（★約束。★消さないこと）。 */
export const NOTES = Object.freeze([
  tx("お金の やりとりは、この アプリの 外で 行います。ここは いただいたかどうかの 記録だけ です。"),
  tx("まだの方に、アプリから 催促は しません。お手元の 一覧として お使いください。"),
  tx("出演者には ご自分のぶんだけ 見えます。ほかの方の ことは 出ません。"),
  // ★★★4行目（★運営の 見本 `P_koenDues`。★電話の 見本より 長い ほう を 取ります）。
  //   ★★確かめました ── ★`patchOf` が 送るのは `paid_on` **1列 だけ** です。
  //     ★額を 触る 道が この 画面に ありません。
  //   ★★★額を 直す 画面を 作る 日には、★そこでも `paid_on` を 消さない こと。
  //     ★消したら この 行が 嘘に なります。★見張りが 見て います。
  tx("金額を 変えても、いただいた 記録は 消えません。")
]);

/** ★太字に する 行（★見本の `<b>`）。 */
export const NOTES_STRONG = Object.freeze([0, 1, 2, 3]);

/** ★台帳から 読む 列（★`select('*')` を 書かない ため）。 */
export const COLS = "id, koen_id, member_id, member_name_at, amount_yen, memo, paid_on";

/**
 * ★台帳へ 入れる 形（★いただいた／まだ を 変える とき）。
 *
 *   ★★★`paid_on` 1列 だけ 送ります。★額を 触りません。
 *   ★★「まだ」に 戻す ときは null。★行は 消しません（★記録を 消さない）。
 */
export function patchOf(paid, todayISO) {
  return { paid_on: paid ? String(todayISO || "").slice(0, 10) || null : null };
}
