// ============================================================================
// ★さがす（★見本 `SC['伴奏をさがす']`）── ★決めごと 1か所
//   ★裁定 その94 §3「L1_SCOPE」・§4d「PLACEMENT」・§4f／★裁定 その121〜123
//
//   ★★★字も 決めも ここに 置きます。★画面に 書き写しません。
//
//   ★★★出す 順は **新しい順** です。★おすすめ順に しません（★見本の 下の 断り）。
//     ★★順を 私たちが 決めると、★お金で 順が 買える 形に 近づきます。
//     ★★裁定 その95 ──「課金の 有無で 人間関係上 有利に なる 設計は 一切 禁止」。
//
//   ★★★こちらから 人を さがす ことは できません。
//     ★★募集を 見る だけ です。★人の 一覧を 作りません。
//
//   ★見張り components/tests/matching-search.test.js
// ============================================================================
import { tx } from "@/lib/t";

/** ★題（★見本の `h2`）。★「伴奏をさがす」では ありません。 */
export const HEAD = tx("さがす");

/** ★上の 断り（★見本の `.warn`）。★3行 とも 減らしません。 */
export const TOP_LINES = Object.freeze([
  tx("この学校の 方だけが 見えます。"),
  tx("ことばは 決まった 言い方から 選びます（自由には 書けません）。"),
  tx("合わないと 思ったら、いつでも 切れます。理由は 要りません。")
]);
export const TOP_BOLDS = Object.freeze([
  tx("決まった 言い方から 選びます"),
  tx("いつでも 切れます")
]);

/**
 * ★絞り（★見本の `.pills`）。
 *
 *   ★★★台帳に 列が ありません。★いまは 画面の 中だけ の 絞り です。
 *     ★★`postings` に「だれを さがしますか」の 列を まだ 作って いません
 *       （★裁定 その94 §4g に 入って いない ため・migration_postings.sql の NOT_YET）。
 *   ★★★だから、★いまは `ぜんぶ` しか 効きません。
 *     ★★効かない 札を 3つ 並べません（★§8⑤「押せない 札を 置かない」）。
 *     ★★列が できた 日に、★ここへ 戻します。
 */
export const KIND_PILLS = Object.freeze([tx("ぜんぶ")]);
export const KIND_NOT_YET = Object.freeze({
  key: "who",
  label: tx("伴奏者・歌い手・楽器奏者で 絞る"),
  say: tx("まだ できません"),
  when: tx("募集に「だれを さがしますか」の 列を 作る とき")
});

/** ★経歴の 帯（★§4f `portfolio_access_from_matching` place_1）。 */
export const PF_HEAD = tx("あなたの 経歴");
export const PF_DONE = tx("整っています");
export const PF_EMPTY = tx("まだ 書いていません");
export const PF_GO_DONE = tx("なおす");
export const PF_GO_EMPTY = tx("書く");

/** ★節の 題。 */
export const SECTION_OPEN = tx("出ている 募集");
export const SECTION_MINE = tx("自分が 出した 募集");
export const SECTION_CUT = tx("見えなくした 方");

/**
 * ★学校に 在籍して いない とき（★2026-09-21・実機で 分かりました）。
 *
 *   ★★★「さがす」は 学校の 中だけ です（★裁定 その94 §3「L1_SCOPE」）。
 *     ★★在籍（`enrollments` の active）が 無い 方は、★誰の 募集も 見えません。
 *     ★★出す ことも できません。★台帳の 門が 在籍を 見ます。
 *   ★★★きょうまで、★空の 一覧と 押せる 札を 出して いました。
 *     ★★押すと「いま 出せませんでした。」だけ が 出ます。
 *     ★★★出せない のは「いま」では ありません。★仕組み です。
 *       ★★そう 書かないと、★もう一度 押して しまいます。
 */
export const NO_ENROLL = tx("さがすは、学校に 在籍して いる 方が 使えます。");
export const NO_ENROLL_SUB = tx("学校の 中だけの 仕組みです。よそには 出ません。");

/** ★1件も 無い とき（★見本の `.empty`）。 */
export const EMPTY_HEAD = tx("まだ 募集は ありません。");
export const EMPTY_SUB = tx("最初の 1つを 出してみませんか。");
export const EMPTY_NOTES = Object.freeze([
  tx("この学校の 方だけが ご覧に なれます。"),
  tx("出しても、すぐに 応募が 来るとは かぎりません。"),
  tx("期限を 決めておくと、そのまま 残りつづけません。")
]);

/** ★札。 */
export const GO_NEW = tx("募集を 出す");
export const GO_NEW_MINE = tx("＋ 自分も 募集を 出す");
export const GO_APPLIED = tx("応募した 募集を 見る");
export const CUT_UNDO = tx("もどす");
export const CUT_EMPTY = tx("まだ ありません");

/** ★見えなくした 方の 下の 断り。 */
export const CUT_NOTES = Object.freeze([
  tx("ここは あなただけが 見られます。相手には 知らせません。"),
  tx("こちらも 見ません。")
]);
export const CUT_NOTES_BOLD = tx("あなただけが 見られます");

/** ★いちばん 下の 断り（★見本の `.note` 4行）。 */
export const NOTES = Object.freeze([
  tx("同じ 学校・教室の 中だけです。"),
  tx("出している 方の お名前は、決まるまで 出ません。"),
  tx("こちらから 人を さがすことは できません。"),
  tx("新しい順に 並べています。おすすめ順には しません。")
]);

/**
 * ★応募の 数の 字（★見本「応募 #件」）。
 *
 *   ★★0件の ときは 出しません。★「0件 です」と 言いません。
 *     ★★★裁定 その95 ── ★新しい 方が 不利に ならない ように します。
 *       ★★§4e `done_count` と 同じ 考え です。
 */
export function applicationWord(n) {
  const x = Number(n);
  if (!Number.isFinite(x) || x <= 0) return "";
  return tx("応募 {n}件").replace("{n}", String(x));
}

/**
 * ★募集の 1行に 出す 字。
 *
 *   ★★★時間・会場・合わせの 場所は 出しません（★§4g `never_show`）。
 *     ★★台帳にも 列が ありません。★ここでも 作りません。
 */
export function postingLine(p) {
  const 日 = Array.isArray(p && p.days) ? p.days : [];
  const お礼 = p && p.fee_amount ? String(p.fee_amount) : "";
  return {
    head: (p && p.title) || (p && p.kind) || "",
    when: 日.join("　"),
    fee: お礼 ? (p.fee_unit ? `${お礼}円（${p.fee_unit}）` : `${お礼}円`) : "",
    sodan: !!(p && p.sodan)
  };
}

/** ★「相談に 応じます」の 1行。★募集に 印が ある ときだけ。 */
export const SODAN_LINE = tx("相談に 応じます");

/**
 * ★経歴が 整って いるか（★帯の 出し分け）。
 *
 *   ★★★「読めなかった」を「空」に しません（★2026-09-16 の 学び）。
 *     ★★`null` を 渡された ときは、★何も 言いません（`null` を 返します）。
 */
export function portfolioState(pf) {
  if (pf === null || pf === undefined) return null;
  const 何か = (pf.bio && String(pf.bio).trim())
    || (Array.isArray(pf.entries) && pf.entries.length > 0);
  return 何か ? "done" : "empty";
}
