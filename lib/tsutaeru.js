// ============================================================================
// ★つたえる ── ★買う前の 画面の 決めごと（★2026-09-25・C群 第1段）
//
//   ★見本 `SC['Woolsong']`（★design-v49・iPhone で 開く用）。
//   ★★見本の 中に 注記が あります ──
//     「★名前は『つたえる』（裁定155。製品名と 同じ 名前を やめた）。画面の 鍵は そのまま」
//     ★★だから 画面の 鍵の 名は `Woolsong` の まま、★題は「つたえる」です。
//
//   ★★★なぜ 第1段（10月13日まで）か
//     ★裁定196 §1c Q3 ──「お金が 動くか」。★これは 買う 前の 画面 です。
//     ★★値段と、★何が できるかと、★何を しないか を 言う 画面 です。
//
//   ★★★鍵 ── `pricing`。★いまは 切って あります。
//     ★裁定176 §3 の とおり、★入口 その ものを 出しません。
//     ★「準備中」も 書きません。★約束に 読めるから です。
//
//   ★★★値段を ここに 書きません。
//     ★`lib/plans.js` の `YEARLY_PRICE_155.tsutaeru` を 見ます。
//     ★その もとは `tools/prices.json`（`individual.tsutaeru.annual`）です。
//     ★★見張り `components/tests/price-four-places.test.js` が 突き合わせます。
//     ★★★2026-09-25 に、★同じ 値段が 2か所に あって 片方だけ 古い という
//       ★ことが 起きました。★数を 書き写さない のが その 答え です。
//
//   ★★★いちばん 大事な 6行 ── 下の `FREE_LINES`。
//     ★「さがす は、これからも 無料です」から「上に 出たりすることは ありません」まで。
//     ★★お金が、★人との 関わりで 有利を 買わない、という 決め です。
//       ★1文字も 変えないこと。
// ============================================================================
import { featureOn } from "@/lib/featureOn";
import { YEARLY_PRICE_155 } from "@/lib/plans";

/** ★機能の 鍵（★`feature_flags.key`）。★字は ここ 1か所 です。 */
export const PRICING_KEY = "pricing";

/**
 * ★この 画面を 出して よいか。
 *
 *   ★★`featureOn` が「無い 鍵は false」と します。
 *     ★★つながらない ときも false です ── ★迷ったら 閉じる。
 */
export function mayShowTsutaeru(features) {
  return featureOn(features, PRICING_KEY);
}

/** ★題（★見本の `<h2>`。★製品名では ありません）。 */
export const TITLE = "つたえる";

/** ★いちばん 上の 2行（★見本の `.card` の 太字）。 */
export const LEAD_LINES = Object.freeze([
  "できたものを、",
  "外に お見せできます。"
]);

/** ★できる こと（★見本の `.usu`・1文字も 変えないこと）。 */
export const CAN_LINES = Object.freeze([
  "公開ページ（ご自分の URL）",
  "紙・PDF に 出せます（A4・1枚）",
  "見た目を 選べます。英語にも できます",
  "いっしょに 演奏した 記録が、ずっと 残ります",
  "募集の 下書きを しまっておけます"
]);

/** ★値段の 行の 左（★見本 `<span>1年ぶん</span>`）。 */
export const PRICE_LABEL = "1年ぶん";

/**
 * ★値段の 字。★`tools/prices.json` が 正 です。
 *
 *   ★★`toLocaleString` を 使います ── ★6,000 の 区切りを 手で 書きません。
 */
export function priceWord() {
  return YEARLY_PRICE_155.tsutaeru.toLocaleString("ja-JP") + "円（税込）";
}

/**
 * ★★★お金で 人との 関わりを 買わない、という 決め（★見本の `.wl`）。
 *
 *   ★1文字も 変えないこと。★短く しないこと。
 */
export const FREE_LINES = Object.freeze([
  "さがす は、これからも 無料です。",
  "募集を 出すこと、応募すること、切ること、お知らせいただくこと。",
  "どれにも お金を いただきません。",
  "（お金を 払った方が、ほかの方より 先に 見られたり、上に 出たりすることは ありません）"
]);

/** ★押しどころ（★見本の `.btn`）。 */
export const BTN_START = "はじめる";
export const BTN_LATER = "いまは やめておく";

/** ★下の 2行（★見本の `.note`）。 */
export const NOTE_LINES = Object.freeze([
  "楽器は 問いません。歌う方も、弾く方も、同じです。",
  "声の 分析（しらべる）は 別の ものです。"
]);
