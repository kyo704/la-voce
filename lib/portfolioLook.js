// ============================================================================
// ★見た目を 選ぶ（★2026-09-25・C群）
//
//   ★見本 `SC['見た目を選ぶ']`。★`経歴` から 開きます。
//   ★台帳 `public.portfolios.theme`（jsonb）。★列は 増やしません。
//
//   ★★★3つの 節 ── ★組み方（4つ）／録画の 並び（3つ）／ことば（2つ）。
//
//   ★★★お金の 門（★見本の `PAID`）──
//     ★★払って いない 方は **ひとつめ だけ** 使えます。
//     ★★残りは 隠しません。★出して、★右に「Woolsong」と 出します
//       （★お決め「有料の ものは 隠しません。見せて、押せなく します」）。
//     ★★★値段は `lib/plans.js` から 出します。★ここで 書きません。
//       ★★2026-09-25 に、★同じ 値段が 2か所に あって 片方だけ 古い ことが
//         ★起きて います。★書き写しません。
//
//   ★★★録画の 並びには 門を かけません（★見本の とおり）。
//     ★★見本は `PF_ORDER` の 3つを どれも 押せる 形で 出して います。
//
//   ★見張り components/tests/portfolio-look.test.js
// ============================================================================

import { tx } from "@/lib/t";
import { YEARLY_PRICE_155 } from "@/lib/plans";

/** ★戻る 先（★見本 `bk('経歴')`）。 */
export const BACK_TO = tx("経歴");

/** ★題。 */
export const TITLE = tx("見た目を 選ぶ");

/**
 * ★払って いない 方への 断り（★見本の `warn`）。
 *
 *   ★★値段は `lib/plans.js` から。★`toLocaleString` で 区切ります。
 */
export function lockLines() {
  return [
    `ここは つたえる（年${Number(YEARLY_PRICE_155.tsutaeru).toLocaleString("ja-JP")}円）の 中です。`,
    tx("いまは ひとつめだけ お使いいただけます。")
  ];
}

/** ★節の 題（★見本の `sh3`）。 */
export const HEAD_LOOK = tx("組み方");
export const HEAD_ORDER = tx("録画の 並び");
export const HEAD_LANG = tx("ことば");

/** ★組み方の 4つ（★見本 `PF_LOOK`）。 */
export const LOOKS = Object.freeze([tx("おちついた"), tx("あかるい"), tx("古典的な"), tx("そっけない")]);

/** ★録画の 並びの 3つ（★見本 `PF_ORDER`）。 */
export const ORDERS = Object.freeze([tx("本番の 順"), tx("曲目の 順"), tx("自分で 並べる")]);

/** ★ことばの 2つ（★見本）。 */
export const LANGS = Object.freeze([
  Object.freeze({ key: "ja", label: tx("日本語"), free: true }),
  Object.freeze({ key: "en", label: "English", free: false })
]);

/** ★払って いない 方の 右に 出る 字（★見本の `Woolsong`）。 */
export const LOCKED_WORD = "Woolsong";

/**
 * ★その 組み方を 使えるか。
 *
 *   ★★★払って いない 方は **ひとつめ だけ** です（★見本 `!PAID && k>0`）。
 */
export function mayUseLook(index, paid) {
  return !!paid || Number(index) === 0;
}

/** ★その ことばを 使えるか。★`free` の ものは いつでも。 */
export function mayUseLang(key, paid) {
  const l = LANGS.find((x) => x.key === key);
  return !!l && (l.free || !!paid);
}

/** ★英語の 1行（★見本の `usu`）。 */
export const EN_LINE =
  tx("英語の ページは、海外の オーディションに そのまま お使いいただけます。");

/** ★できあがりを 見る（★見本の 札）。 */
export const BTN_PREVIEW = tx("できあがりを 見る");

/** ★下の 断り（★約束）。 */
export const NOTES = Object.freeze([
  tx("紙に すると A4・1枚です。"),
  tx("録画は、選んだ 順に 並びます。")
]);

/** ★台帳から 読む 列。 */
export const COLS = "user_id, theme";

/** ★いまの 選び（★`theme` jsonb の 中）。★無ければ ひとつめ。 */
export function lookOf(theme) {
  const t = theme || {};
  return LOOKS.includes(t.look) ? t.look : LOOKS[0];
}
export function orderOf(theme) {
  const t = theme || {};
  return ORDERS.includes(t.order) ? t.order : ORDERS[0];
}
export function langOf(theme) {
  const t = theme || {};
  return LANGS.some((x) => x.key === t.lang) ? t.lang : "ja";
}

/**
 * ★台帳へ 入れる 形。
 *
 *   ★★★`theme` の ほかの 鍵を **消しません**。★上書きだけ します。
 *     ★★あそこには ほかの 決めも 入り得ます。★丸ごと 置き換えると 消えます。
 *   ★★払って いない 方の 選びは 通しません（★門は 1か所）。
 */
export function patchOf(theme, next, paid) {
  const いま = theme && typeof theme === "object" ? theme : {};
  const n = next || {};
  const out = { ...いま };
  if (n.look !== undefined) {
    const i = LOOKS.indexOf(n.look);
    if (i >= 0 && mayUseLook(i, paid)) out.look = n.look;
  }
  if (n.order !== undefined && ORDERS.includes(n.order)) out.order = n.order;
  if (n.lang !== undefined && mayUseLang(n.lang, paid)) out.lang = n.lang;
  return { theme: out };
}
