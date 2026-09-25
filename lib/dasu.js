// ============================================================================
// ★出す ── ★ポートフォリオを 外に 出す（★2026-09-25・C群 第1段・束5）
//
//   ★見本 `SC['出す']`（★design-v51・iPhone で 開く用）。
//   ★★Opus の 対応表（2026-09-24 訂正）──「ポートフォリオを 外に 出す
//     （★連絡では ありません）」。★前は「連絡を 出す」と 書かれて いました。
//
//   ★★★いちばん 大事な 1行（★束5_約束の文・★消さないで と 書かれて います）──
//     「体調の 記録は、1文字も 出ません」
//   ★★これは 列で 守られて います（★2026-09-25・本番で 数えました）──
//     ★`portfolios`・`portfolio_entries`・`portfolio_recordings` に
//       ★体・声・睡眠・症状の 列が **0件** です。
//     ★★出す 道が 無い のでは なく、★出す もとが ありません。
//
//   ★★範囲は `lib/portfolio.js` の `SCOPES` が 持ちます（★self／org／public）。
//     ★★ここで 並べません。★2026-09-25 に あちらを 台帳の 3つに 直しました。
//
//   ★★★18歳未満の 方に `public` を 出しません（★`scopesFor`）。
//     ★見本も「どなたでも」に「18歳以上」の 錠を かけて います。
//     ★★紙は 誰でも 出せます ── ★見本「紙に することは、どなたでも できます」。
//
//   ★★★「変えられるのは 年に2回まで」は **書きません**（★下）。
// ============================================================================

/** ★題（★見本の `<h2>`）。 */
export const TITLE = "出す";

/** ★18歳未満の 方への 2行（★見本の `.warn`）。★2行目を 消さないこと。 */
export const MINOR_LINES = Object.freeze([
  "18歳以上の方だけが、外に 出せます。",
  "紙に することは、どなたでも できます。"
]);

/** ★しるし（★見本 `woolsong.app/@`）。 */
export const SLUG_HEAD = "あなたの しるし";
export const SLUG_PREFIX = "woolsong.app/@";

/**
 * ★しるしの 形（★見本「英数字と −。3〜24文字。」）。
 *
 *   ★★★台帳に 形の 縛りが ありません（★2026-09-25 に 数えました）──
 *     ★`portfolios` の 縛りは `portfolios_public_slug_key`（UNIQUE）だけ です。
 *   ★★だから 画面の 側で 止めます。★止めないと、★空白や 記号が 住所に 入ります。
 *   ★★★台帳にも 足す べき です。★お尋ねして います。
 */
export const SLUG_MIN = 3;
export const SLUG_MAX = 24;
export const SLUG_RULE = "英数字と −。3〜24文字。";

export function slugOk(s) {
  const v = String(s || "");
  if (v.length < SLUG_MIN || v.length > SLUG_MAX) return false;
  return /^[a-zA-Z0-9-]+$/.test(v);
}

/** ★形が ちがう ときの 1行。★責めません。★何が よいかを 書きます。 */
export const SLUG_NG = "英数字と − だけ、3〜24文字に して ください。";

/**
 * ★★★書かない 1行 ──「変えられるのは 年に2回まで」。
 *
 *   ★台帳に 数える ところが ありません（★2026-09-25 に 数えました）──
 *     ★`portfolios` に 回数の 列が 無く、★履歴の 表も ありません。
 *   ★★★守れない 決めを 書くと、★3回目に 変えられて しまいます。
 *     ★そのとき、★書いて あった 約束が 嘘に なります。
 *   ★★`tools/excluded_by_design.json` に 引き金つきで 置いて います。
 */
export const SLUG_LIMIT_NOT_YET = true;

/** ★範囲の 見出し（★見本の `.sh3`）。 */
export const SCOPE_HEAD = "誰が 見られますか";

/** ★`public` の 下に 添える 1行（★見本の `.usu`）。 */
export const PUBLIC_SUB = "検索にも 出ます";

/** ★18歳未満の ときの 錠の 字（★見本 `<span class="usu">18歳以上</span>`）。 */
export const LOCK_WORD = "18歳以上";

/** ★検索に 出さない（★`portfolios.noindex`・★sql/78 で 足りました）。 */
export const NOINDEX_LABEL = "検索に 出さない";
export const NOINDEX_SUB = "Google などに 載りません";

/** ★押しどころ（★見本の `.btn`）。 */
export const BTN_PUBLISH = "この 形で 出す";
export const BTN_UNPUBLISH = "いったん 下げる";

/** ★出して いるか。★`published_at` が あれば 出て います。 */
export function isPublished(paper) {
  return !!(paper && paper.published_at);
}

/**
 * ★下の 4行（★見本の `.note`・1文字も 変えないこと）。
 *
 *   ★★1行目 ──「下げても、書いたものは 消えません」。★取り上げない 決め です。
 *   ★★2・3行目 ── ★お支払いが 止まった あとの 30日。
 *   ★★★4行目が この 画面の 核 です ──「体調の 記録は、1文字も 出ません」。
 */
export const NOTE_LINES = Object.freeze([
  "下げても、書いたものは 消えません。",
  "お支払いが 止まっても、30日は そのまま 出ます。",
  "そのあとは 見えなくなりますが、お手元には 残ります。",
  "体調の 記録は、1文字も 出ません。"
]);

/** ★引く 列 だけ。 */
export const COLS_DASU = "public_slug, visibility, published_at, noindex";
