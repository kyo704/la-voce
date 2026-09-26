// ============================================================================
// ★お支払いの こと（★わたしの 出演料・2026-09-26・D群・裁定201）
//
//   ★見本 `SC['わたしの出演料']`。★題は「お支払いの こと」です（★『出演料』では ない）。
//   ★台帳 `public.koen_fees`（★2026-09-26 に 数えました：9列）。
//
//   ★★★`sql/89`（koen_budget）は 要りません（★Opus・2026-09-26）。
//     ★`koen_pay` は 作りかけて 取り消された もの。★`koen_budget` は 公演の 収支（★2027年）。
//     ★★どちらも この 画面の ものでは ありません。
//
//   ★★★下の 4行は **約束** です。★消さないこと ──
//     ①「ほかの 出演者の 額は 出ません。あなたの ぶんだけです。」
//       ★★台帳の 決まりが そう して います ── ★`koen_fees_select` は
//         ★`koen_can_manage(koen_id)`（★制作）か、★ご自分の 行 だけ を 通します。
//       ★★★だから この 画面は **1行しか** 受け取りません。
//         ★★一覧を 渡す 道を 作らない こと。★渡せば 決まりの 外で 混ざります。
//     ②「ここは 記録だけ です。お支払いは この アプリの 外で 行われます。」
//       ★★`koen_fees` に 決済の 列は ありません。
//     ③「源泉徴収・消費税の 計算は しません。税の ことは、ご自分で お確かめください。」
//       ★★★割る・引く・足す を **1つも しません**。★額を そのまま 出します。
//         ★★税の 式を 書いたら、★この 行が 嘘に なります（★裁定201）。
//     ④「食い違うときは、制作の 方に おたずねください。」
//       ★★直す 道を こちらに 置きません ── ★書けるのは 制作 だけ です。
//
//   ★見張り components/tests/watashi-no-gaku.test.js
// ============================================================================

import { tx } from "@/lib/t";

/** ★戻る 先（★見本 `bk('公演')`）。 */
export const BACK_TO = tx("公演");

/** ★題（★見本の `h2`）。★「出演料」では ありません。 */
export const TITLE = tx("お支払いの こと");

/** ★3行の 札（★見本の `card`）。 */
export const HEAD_AMOUNT = tx("決まった 額");
export const HEAD_BREAKDOWN = tx("内わけ");
export const HEAD_HANDED = tx("お渡し");

/** ★お渡しの 2つ（★見本 ── `まだ`）。 */
export const HANDED_YET = tx("まだ");
export const HANDED_DONE = tx("済み");
export function handedWord(row) {
  return (row && row.paid_on) ? HANDED_DONE : HANDED_YET;
}

/**
 * ★額（★見本 ── `50,000円`）。
 *
 *   ★★★そのまま 出します。★引きません。★割りません（★約束③）。
 *   ★★無い ときは 空 です ── ★0円と 書きません（★「まだ 決まって いない」と
 *     ★「0円」は ちがいます）。
 */
export function amountWord(row) {
  const v = Number((row || {}).amount_yen);
  return Number.isFinite(v) ? `${v.toLocaleString("ja-JP")}円` : "";
}

/**
 * ★内わけ（★見本 ── `本番1回 ＋ 稽古3回 まとめて`）。
 *
 *   ★★`koen_fees.memo` を そのまま 出します。★こちらで 組み立てません。
 *   ★★無ければ 空 です。★「—」で 埋めません。
 */
export function breakdownOf(row) {
  const s = String((row || {}).memo || "").trim();
  return s;
}

/** ★題の 下の 1行（★公演の 名 ／ 主催）。★無い ものは 詰めます。 */
export function subLineOf(koenTitle, orgName) {
  return [koenTitle, orgName].filter((x) => x && String(x).trim()).join("　／　");
}

/** ★1行も 無い とき。★責めません。★どこで 決まるかを 書きます。 */
export const EMPTY_LINE = tx("まだ 決まって いません。");
export const EMPTY_HOW = tx("制作の 方が 決めると、ここに 出ます。");

/** ★下の 断り（★約束。★消さないこと）。 */
export const NOTES = Object.freeze([
  tx("ほかの 出演者の 額は 出ません。あなたの ぶんだけです。"),
  tx("ここは 記録だけ です。お支払いは この アプリの 外で 行われます。"),
  tx("源泉徴収・消費税の 計算は しません。税の ことは、ご自分で お確かめください。"),
  tx("食い違うときは、制作の 方に おたずねください。")
]);

/** ★太字に する 行（★見本の `<b>`）。 */
export const NOTES_STRONG = Object.freeze([0, 1, 2, 3]);

/**
 * ★台帳から 読む 列（★`select('*')` を 書かない ため）。
 *
 *   ★★★`member_name_at` を 読みません ── ★ご自分の 行 だけ なので 要りません。
 *     ★★読むと、★一覧を 作りたく なります。★作れる 形を 残しません。
 */
export const COLS = "id, koen_id, amount_yen, memo, paid_on";
