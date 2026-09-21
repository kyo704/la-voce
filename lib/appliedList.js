// ============================================================================
// ★応募した 募集 ── ★決めごと 1か所
//   ★出どころ 見本 `SC['応募した募集']`／★裁定 その94 §4c・その130
//
//   ★★★終わった わけを 書きません（★見本の 断り）。
//     ★★「ほかの方に 決まったのか、★取り下げられたのかは 分かりません。」
//     ★★台帳も わけを 返しません。★出しようが ありません。
//
//   ★★★お知らせを 送りません（★裁定 その87）。★開いた ときに 見えます。
//
//   ★見張り components/tests/applied-list.test.js
// ============================================================================
import { tx } from "@/lib/t";

export const HEAD = tx("応募した 募集");
export const NOW_HEAD = tx("いま");
export const ENDED_HEAD = tx("終わったもの");

/** ★いま の 1行に 出す 字。 */
export const APPLIED = tx("応募しています");
export const WITHDRAWN = tx("取り下げました");

/** ★終わり方（★2つ だけ。★わけでは ありません）。 */
export const ENDED_WORDS = Object.freeze({
  closed: tx("この募集は 終わりました"),
  expired: tx("期限が 過ぎました")
});

/** ★たずねた ことへの お返事（★§4c）。 */
export const REPLY_NONE = tx("たずねた ことに、まだ お返事は ありません");
export const REPLY_PIECES = tx("曲目が 届きました ──「{s}」");
export const REPLY_WORDS = Object.freeze({
  kyokumoku_kore_kara: tx("曲目は これから 決めます、とのことです"),
  toujitsu_made_ni: tx("当日までに お伝えします、とのことです")
});

/** ★1件も 無い とき。 */
export const EMPTY = tx("まだ 応募して いません。");

/** ★下の 断り（★見本の `.note`）。 */
export const NOTES = Object.freeze([
  tx("終わった 理由は 書きません。ほかの方に 決まったのか、取り下げられたのかは 分かりません。"),
  tx("お知らせは 送りません。開いたときに 見えます。"),
  tx("たずねた ことへの お返事も、ここに 出ます。")
]);

/**
 * ★まだ できない こと。
 *
 *   ★★★見本には「90日で、この一覧からも 消えます。」が あります。
 *     ★★消す 仕掛けが どこにも ありません（★2026-09-21 に 確かめました）。
 *     ★★無い ものを、★在る ように 言いません。★出して いません。
 */
export const NOT_YET = Object.freeze([
  { key: "hide90", label: tx("90日で この一覧から 消える"),
    when: tx("消す 仕掛け（定時の 走り）を 作る とき") }
]);

/** ★「いま」と「終わったもの」に 分けます。 */
export function split(rows) {
  const 並 = Array.isArray(rows) ? rows : [];
  return {
    now: 並.filter((r) => !r.ended),
    ended: 並.filter((r) => !!r.ended)
  };
}

/**
 * ★たずねた ことへの お返事の 1行。
 *
 *   ★★★たずねて いない 人には、★何も 出しません。
 *     ★★「お返事は ありません」は、★たずねた 人にだけ 意味が あります。
 *     ★★たずねて いない のに 出すと、★待って いる ように 見えます。
 */
export function replyLine(row) {
  if (!row || row.template_key !== "kyokumoku_kikitai") return "";
  if (!row.reply_template_key) return REPLY_NONE;
  if (row.reply_template_key === "kyokumoku_kotae") {
    const 曲 = Array.isArray(row.reply_pieces) ? row.reply_pieces : [];
    if (曲.length === 0) return REPLY_NONE;
    return REPLY_PIECES.replace("{s}", 曲.join("、"));
  }
  return REPLY_WORDS[row.reply_template_key] || "";
}

/** ★いま の 1行の、★下に 添える 字。 */
export function stateLine(row) {
  if (!row) return "";
  return row.status === "withdrawn" ? WITHDRAWN : APPLIED;
}

/** ★終わったもの の 1行の、★下に 添える 字。 */
export function endedLine(row) {
  return (row && ENDED_WORDS[row.ended]) || "";
}
