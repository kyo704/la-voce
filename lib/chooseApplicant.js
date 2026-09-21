// ============================================================================
// ★応募を 選ぶ ── ★決めごと 1か所
//   ★出どころ 見本 `SC['応募を選ぶ']`／★裁定 その94 §4e・その95
//
//   ★★★並べ替えません。★応募の 順の まま です。
//     ★★「実績の 順には しません。」（★見本の 断り）
//     ★★裁定 その95 ── ★人間関係上 有利に なる 設計を 作りません。
//     ★★台帳が 応募の 順で 返します。★画面でも 並べ替えません。
//
//   ★★★たずねられて いる ものが 分かる ように します（★§4c）。
//     ★★色で 分かります。★数えたり、★上に 寄せたり しません。
//
//   ★見張り components/tests/choose-applicant.test.js
// ============================================================================
import { tx } from "@/lib/t";

/** ★題。★数を 入れます（★見本「応募が #件 あります」）。 */
export const HEAD = tx("応募が {n}件 あります");
export const HEAD_NONE = tx("まだ 応募は ありません");

export const GO_DETAIL = tx("見る");
export const CLOSE_POSTING = tx("この募集を 終わりにする");
export const CLOSE_ASK = tx("この募集を 終わりに しますか");
export const CLOSE_ASK_SUB = tx("一覧から 外れます。応募して くださった 方の 控えには 残ります。");
export const CLOSE_OK = tx("終わりに する");
export const CLOSE_CANCEL = tx("やめる");

/** ★送られた ことば（★台帳の 名 → 字）。 */
export const WORDS = Object.freeze({
  ukeraremasu: tx("お受けできます"),
  kyokumoku_kikitai: tx("曲目を もう少し 教えてください"),
  orei_sodan: tx("お礼について 相談させてください")
});

/** ★下の 断り（★見本の `.note`）。★減らしません。 */
export const NOTES = Object.freeze([
  tx("押すと、その方の ことが 見られます。決めるのは、見たあとです。"),
  tx("応募の 順に 並べています。実績の 順には しません。"),
  tx("たずねられている ものは、ことばの 色で 分かります。")
]);
export const NOTES_BOLD = tx("実績の 順には しません。");

/**
 * ★まだ できない こと。
 *
 *   ★★見本には「この学校で #回」が あります。
 *     ★★数える もとが ありません（★成立の 記録を 持って いません）。
 *     ★★0 を 出しません。★新しい 方を 不利に します（★§4e `done_count`）。
 */
export const NOT_YET = Object.freeze([
  { key: "done", label: tx("この学校で 何回"),
    when: tx("成立の あとの 姿を 作る とき。そこで 回数の もとが できます") }
]);

/** ★たずねられて いるか（★色を 変える 目じるし）。 */
export function isAsking(row) {
  return !!row && row.template_key === "kyokumoku_kikitai";
}

/** ★送られた ことばの 字。★「」で くくります（★見本の とおり）。 */
export function wordOf(row) {
  const s = row && WORDS[row.template_key];
  return s ? `「${s}」` : "";
}

/** ★題の 字。★0件の ときは 数を 出しません。 */
export function headOf(rows) {
  const n = Array.isArray(rows) ? rows.length : 0;
  return n === 0 ? HEAD_NONE : HEAD.replace("{n}", String(n));
}

/**
 * ★並び。
 *
 *   ★★★何も しません。★もらった まま 返します。
 *     ★★ここに 並べ替えを 書くと、★裁定 その95 に 触れます。
 *     ★★見張りが `.sort(` を 探して います。
 */
export function inGivenOrder(rows) {
  return Array.isArray(rows) ? rows : [];
}
