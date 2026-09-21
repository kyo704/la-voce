// ============================================================================
// ★成立後 ── ★決めごと 1か所
//   ★出どころ 見本 `SC['成立後']`／★裁定 その94 §4・§5・§8
//
//   ★★★アプリは 会う ところを 決めません（★§8 `money`・見本の 断り）。
//     ★★「場所は 決めません。会う ところは おふたりで。」
//   ★★★切る 口と 通報の 口は、★どちらも 残します（★§5 `separation_from_report`）。
//     ★★切ったら 通報できない、に しません。
//
//   ★見張り components/tests/after-match.test.js
// ============================================================================
import { tx } from "@/lib/t";

/** ★題は 相手の お名前 です。★呼ぶ側が 入れます。 */
export const HEAD_SUFFIX = tx(" さん");

export const PART_HEAD = tx("楽器・パート");
export const CUT = tx("やめる");
export const REPORT = tx("通報");

/**
 * ★下の 断り（★見本の `.note`）。
 *
 *   ★★★見本の 3行の うち、★出すのは **1行 だけ** です。
 *     ★「誘えるのは 3回までです。同時に 1件だけ。」…… ★誘う 道が ありません
 *     ★「90日で 自動的に 閉じます。」…… ★閉じる 仕掛けが ありません
 *     ★★無い ものを、★在る ように 言いません。★下の `NOT_YET` に 置きました。
 */
export const NOTES = Object.freeze([
  tx("場所は 決めません。会う ところは おふたりで。")
]);

/**
 * ★まだ できない こと。★`when` を 添えます。
 */
export const NOT_YET = Object.freeze([
  { key: "contact", label: tx("連絡先"),
    when: tx("連絡先を どこに どう 置くかが、裁定で 決まった とき") },
  { key: "slots", label: tx("合う 空きコマ"),
    when: tx("時間割との 突き合わせを、端末の 中だけで 作る とき（§4b）") },
  { key: "invite", label: tx("この枠で 誘う"),
    when: tx("誘う 道（回数の 限りも 含めて）を 作る とき") },
  { key: "close90", label: tx("90日で 自動的に 閉じる"),
    when: tx("閉じる 仕掛け（定時の 走り）を 作る とき") },
  { key: "cut", label: tx("やめる"),
    when: tx("切る 道（3つ）を 作る とき") }
]);

/** ★題の 字。 */
export function headOf(m) {
  const n = (m && m.other_display_name) || "";
  return n ? n + HEAD_SUFFIX : tx("成立しました");
}

/**
 * ★決めた あとの 姿に なって いるか。
 *
 *   ★★★`null` は「読めなかった」です。★「成立して いない」では ありません。
 *     ★★分からない ときに「まだです」と 言いません（★2026-09-16 の 学び）。
 */
export function isMatched(m) {
  if (m === null || m === undefined) return null;
  return !!m.application_id;
}
