// ============================================================================
// ★採点（★裁定 その105）── ★決めごと 1か所
//
//   ★★★出さない もの（★裁定 §Q1）
//     ★順位 ／ 平均との 差 ／ 偏差値 ／ 分布の 中の 位置
//     ★★合計・平均は 出して よい。★ただし **くらべる 表** に しません。
//     ★★★既定の 並びは 学籍番号順。★点の 順に 並べ替えません。
//
//   ★★★見える 範囲（★§Q1・§Q2）
//     ★審査員 …… ご自分の 点。★ほかの 審査員の 点は つけ終わるまで 見えません
//     ★事務・学長（`saiten`）…… ぜんぶ
//     ★学生 …… ★確定の あと の、ご自分の 点 だけ
//
//   ★★★型を 決めるのは 学校 です（★§Q3）。★先生は 見るだけ。
//     ★点が 入った あとは 変えられません。
//
//   ★見張り components/tests/evaluation.test.js
// ============================================================================

import { can } from "@/lib/opsPerms";

export const HEAD = "評価の 型";
export const SUB_LINE =
  "この 学校の 評価の 仕方を 決めます。こちらからの 既定は ありません。";

/** ★型を 直せる 方（★`saiten`）。★先生は 見るだけ です。 */
export function mayEditItems(perms) {
  return can(perms, "saiten");
}

/** ★きざみ（★見本の 3つ。★「整数のみ」は 1 と 同じ です）。 */
export const STEPS = Object.freeze([
  { key: "1", label: "1点", value: 1 },
  { key: "0.5", label: "0.5点", value: 0.5 }
]);

export const MAX_MIN = 1;
export const MAX_MAX = 1000;

/** ★入れられる 点か（★満点まで・きざみに 合う こと）。 */
export function pointOk(value, item) {
  if (value === null || value === undefined || value === "") return true;
  const v = Number(value);
  if (!Number.isFinite(v)) return false;
  if (v < 0) return false;
  const max = Number(item && item.max_points);
  if (Number.isFinite(max) && v > max) return false;
  const step = Number((item && item.step) || 1);
  return Math.abs(Math.round(v / step) - v / step) < 1e-9;
}

export function whyPointBad(value, item) {
  if (pointOk(value, item)) return "";
  const v = Number(value);
  const max = Number(item && item.max_points);
  if (Number.isFinite(max) && v > max) return `満点は ${max}点 です。`;
  const step = Number((item && item.step) || 1);
  return `${step}点 きざみで 入れて ください。`;
}

/**
 * ★型を 変えられるか（★裁定 §Q3 の caution）。
 *
 *   ★★★点が 入った あとに 変えると、★入力済みの 点が 宙に 浮きます。
 *     ★★だから 止めます。★「すでに N件 点が 入って います」と お伝えします。
 */
export function mayChangeItem(item, scoreCount) {
  return !(Number(scoreCount) > 0);
}
export function whyCannotChangeItem(scoreCount) {
  const n = Number(scoreCount) || 0;
  return n > 0 ? `すでに ${n}件 点が 入って います。` : "";
}

/** ★「使わない に する」と「消す」の ちがい（★見本の 字）。 */
export const OFF_LABEL = "使わない に する";
export const OFF_NOTE = "点は 残ります。集計に 入りません。あとで もどせます。";
export const DELETE_LABEL = "消す";
export function deleteNote(scoreCount) {
  const n = Number(scoreCount) || 0;
  return n > 0
    ? `${n}人ぶんの 点も 消えます。もどせません。`
    : "点は 入って いないので、そのまま 消せます。";
}

/**
 * ★まとめ（★合計・平均 だけ）。
 *
 *   ★★★順位・偏差値・平均との 差は 出しません（★裁定 §Q1）。
 *   ★★使わない 項目は 入れません。
 */
export function totalOf(scores, items) {
  const 使う = new Set((items || []).filter((i) => i && i.in_use).map((i) => i.id));
  const 並 = (scores || []).filter((s) => s && 使う.has(s.item_id) && s.points != null);
  if (並.length === 0) return null;
  return 並.reduce((n, s) => n + Number(s.points), 0);
}

/** ★何人ぶん 入って いるか（★数 だけ）。 */
export function enteredCount(scores) {
  return (scores || []).filter((s) => s && s.points != null).length;
}

/** ★既定の 並び ── ★名前順（★点の 順に しません）。 */
export function defaultOrder(rows) {
  return [...(rows || [])].sort((a, b) =>
    String((a && a.name) || "").localeCompare(String((b && b.name) || ""), "ja"));
}

/** ★確定（★`saiten` を 持つ 方 だけ）。★確定の あと、学生に 見えます。 */
export function mayConfirm(perms) {
  return can(perms, "saiten");
}
export const CONFIRM_LABEL = "確定する";
export const CONFIRM_NOTE =
  "確定すると、学生 ご本人に、ご自分の 点だけ が 見えます。";

/** ★確定の あとの 直しは 記録に 残ります（★裁定 §Q4）。 */
export const AFTER_CONFIRM_NOTE =
  "確定の あとで 直すと、誰が いつ 直したかを 残します。学生にも お知らせします。";

export const NOT_YET_LINES = Object.freeze([
  "率（％）も、順位も 出しません。",
  "点の 順に 並べ替える ことは できません。"
]);
