// ============================================================================
// ★この人との やりとり ── ★決めごと 1か所
//   ★出どころ 見本 `SH['cut']`／★裁定 その94 §5「L3_CUT」・§5-4
//
//   ★★★1押しです。★わけを うかがいません。
//   ★★★相手に 知らせません。★ただ 見えなく なるだけ です。
//     ★★「切られた」と 分かると、★別の 道で 近づいて きます（★§5）。
//   ★★★切った あとでも、★通報の 口は 残ります（★§5-4）。
//     ★★切ったら 通報できない、に しません。
//
//   ★見張り components/tests/cut-sheet.test.js
// ============================================================================
import { tx } from "@/lib/t";

export const HEAD = tx("この人との やりとり");

/**
 * ★切り方（★見本の 3つ）。
 *
 *   ★★★`withdraw`（応募を 取り下げる）は、★いま 出しません。
 *     ★★あれは **人** を 切るのでは なく、★**応募** を 取り下げる ことです。
 *     ★★`matching_cuts` に 入れるのか、★`applications` を 直すのかが
 *       ★★まだ 決まって いません（★migration_applications.sql の NOT_YET ③）。
 *     ★★決まって いない ものを、★押せる 札に しません。
 */
export const KINDS = Object.freeze([
  { key: "mute", label: tx("この人からの 連絡を 止める"), sub: "" },
  { key: "hide", label: tx("この人に 自分を 見せない"),
    sub: tx("相手からは 見えなくなります") }
]);

export const NOT_YET = Object.freeze([
  { key: "withdraw", label: tx("応募を 取り下げる"),
    when: tx("取り下げを 人の 切りと 同じに 扱うかが、裁定で 決まった とき") }
]);

/** ★下の 断り（★見本の `.note`）。★減らしません。 */
export const NOTES = Object.freeze([
  tx("理由は うかがいません。いつでも できます。"),
  tx("相手には 知らせません。ただ 見えなくなるだけです。"),
  tx("話が まとまった あとでも、切ることが できます。"),
  tx("切ったことは、あなただけが 見られます（こちらも 見ません）。")
]);
export const NOTES_BOLDS = Object.freeze([
  tx("理由は うかがいません。"),
  tx("相手には 知らせません。"),
  tx("あなただけが 見られます")
]);

/** ★通報の 口（★§5-4）。★切った あとでも 残ります。 */
export const REPORT = tx("こまったことが ありました");
export const REPORT_NOTE = tx("切ったあとでも、ここから お知らせいただけます。");

/** ★切った あとの 1行。★「切りました」と 言い切りません。 */
export const DONE = tx("見えなくなりました");

/** ★台帳に 渡す 形。★相手と 学校は 呼ぶ側が 入れます。 */
export function toRow(kind) {
  return { kind };
}

/** ★その 切り方が あるか。 */
export function has(kind) {
  return KINDS.some((k) => k.key === kind);
}
