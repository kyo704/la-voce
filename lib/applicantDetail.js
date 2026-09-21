// ============================================================================
// ★応募者の 詳細 ── ★決めごと 1か所
//   ★出どころ 見本 `SC['応募者の詳細']`／★裁定 その94 §4e・§4f・§7
//
//   ★★★出す のは、★ご本人が 応募の ときに 選んだ ものだけ です。
//     ★★選ばなかった ものは、★台帳が 空で 返します。★画面で 隠して いません。
//
//   ★★★年齢・学年・門下は 出しません（★§7）。
//     ★★台帳の 返りに 列が ありません。★出しようが ありません。
//
//   ★見張り components/tests/applicant-detail.test.js
// ============================================================================
import { tx } from "@/lib/t";

/** ★節の 題。 */
export const HEADS = Object.freeze({
  word: tx("送られた ことば"),
  days: tx("来られる 日"),
  rec: tx("録画"),
  rep: tx("レパートリー"),
  award: tx("受賞"),
  teacher: tx("師事")
});

/** ★送られた ことば（★台帳の 名 → 字）。 */
export const WORDS = Object.freeze({
  ukeraremasu: tx("お受けできます"),
  kyokumoku_kikitai: tx("曲目を もう少し 教えてください"),
  orei_sodan: tx("お礼について 相談させてください")
});

export const REC_GO = tx("見る");
export const REP_NOTE = tx("ご本人が 公開している ぶんだけです。");

/** ★下の 断り（★見本の `.note`）。★減らしません。 */
export const NOTES = Object.freeze([
  tx("年齢・学年・門下は 出しません。決めるのに 要らないからです。"),
  tx("写真・録画・レパートリーは、ご本人が 出すかどうかを 選んでいます。"),
  tx("空いている コマだけを 出しています。授業は 出ません。")
]);
export const NOTES_BOLDS = Object.freeze([
  tx("年齢・学年・門下は 出しません。"),
  tx("ご本人が 出すかどうかを 選んでいます")
]);

/**
 * ★まだ できない こと。★`when` を 添えます。
 *
 *   ★★★「この方に 決める」を 置いて いません。
 *     ★★決めた あとの 姿（★成立後）が まだ ありません。
 *     ★★押せない 札を 置きません。★決めた つもりに させません。
 */
export const NOT_YET = Object.freeze([
  { key: "decide", label: tx("この方に 決める"),
    when: tx("「成立後」の 画面を 作る とき") },
  { key: "slots", label: tx("合う 空きコマ"),
    when: tx("時間割との 突き合わせを、端末の 中だけで 作る とき（§4b）") },
  { key: "photo", label: tx("写真"),
    when: tx("写真を 預かる ところを 決める とき") },
  { key: "done", label: tx("この学校で 何回"),
    when: tx("成立の あとの 姿を 作る とき") },
  { key: "sheet", label: tx("この人との やりとりについて"),
    when: tx("切る 道（3つ）を 作る とき") }
]);

/** ★経歴を 3つに 分けます（★`portfolio_entries.kind`）。 */
export function splitCareer(career) {
  const 並 = Array.isArray(career) ? career : [];
  return {
    school: 並.filter((e) => e && e.kind === "school"),
    teacher: 並.filter((e) => e && e.kind === "teacher"),
    award: 並.filter((e) => e && e.kind === "award")
  };
}

/** ★送られた ことばの 字。★「」で くくります。 */
export function wordOf(d) {
  const s = d && WORDS[d.template_key];
  return s ? `「${s}」` : "";
}

/** ★たずねられて いるか（★色を 変える 目じるし）。 */
export function isAsking(d) {
  return !!d && d.template_key === "kyokumoku_kikitai";
}

/**
 * ★録画の 行き先の 名（★§4f）。
 *
 *   ★★どこへ 行くかを、★押す 前に お見せします。
 *   ★★この 中で 再生しません。★預かって いません。
 */
export function hostOf(url) {
  const m = /^https?:\/\/([^/]+)/.exec(String(url || ""));
  return m ? m[1].replace(/^www\./, "") : "";
}
