// ============================================================================
// ★紙を たしかめる ── ★A4 1枚の 見た目（★2026-09-25・C群 束2）
//
//   ★見本 `SC['紙をたしかめる']`（★design-v51・iPhone で 開く用）。
//
//   ★★★この 画面の 約束 3つ（★見本の `.note`・1文字も 変えないこと）──
//     ①「点は つけません。他の方と 比べません。」
//     ②「1枚に 収まらないときは、お知らせします。」
//     ③「書き出した 日を 右下に 入れます。古い 紙が 出回らないように。」
//
//   ★★①は この 家の 根の 決め です（★CLAUDE.md「点数・順位・平均との差を 出さない」）。
//     ★★だから この 画面は **数を 1つも 出しません** ── ★件数 だけ は 別 です（★下）。
//
//   ★★②は 親切では なく 守り です。
//     ★★★溢れた ぶんを 黙って 切ると、★その方は「載せた つもり」で 渡します。
//       ★載って いない ことに 気づくのは、★渡した あと です。
//     ★★だから 切る 前に 言います。★`OVERFLOW_LINE`。
//
//   ★★③も 守り です。★日付の 無い 紙は、★いつの もの か 分かりません。
//     ★古い 紙が 出回る と、★もう 正しく ない ことが 本人の 名前で 伝わります。
//
//   ★★★「少ないと 見えるかもしれません」（★見本の `.warn`）について
//     ★見本は 件数が 3件 未満の とき だけ 出します。
//     ★★これは **数えて 責める** もの では ありません ── ★逆 です。
//       ★「このまま 出すことも できます」と 続きます。★止めません。
//     ★★だから 件数は 出します が、★「あと◯件」は 出しません。
//
//   ★★台帳（★2026-09-25・本番で 確かめました）──
//     ★読む: `portfolios`（display_name, instrument, bio, paper_type, public_slug,
//            published_at, visibility, noindex …）／`portfolios_own` ＋ `portfolios_read_scope`
//     ★読む: `portfolio_entries`（id, user_id, kind, title, detail, sort_order, created_at）
//            ／`portfolio_entries_own` ＋ `portfolio_entries_read`（★sql/80）
//     ★★★体の 列は この 2表に 1つも ありません（★数えました・0件）。
//       ★「体調は 1文字も 出ません」は、★列が 無い こと で 守られて います。
// ============================================================================
import { ENTRY_KINDS } from "@/lib/portfolio";

/** ★引く 列 だけ。★`select('*')` を 書きません。 */
export const COLS_PAPER =
  "display_name, instrument, bio, paper_type, public_slug, published_at";
export const COLS_PAPER_ENTRY = "id, kind, title, detail, sort_order";

/** ★戻り先（★見本 `bk('紙の型')`）。 */
export const BACK_TO = "紙の型";

/** ★A4（★見本 `aspect-ratio:210/297`）。★ここが 1か所 です。 */
export const PAPER_RATIO = "210 / 297";

/** ★少ない ときの 下限（★見本 `n<3`）。 */
export const FEW_UNDER = 3;

/**
 * ★少ない と お伝えするか。
 *
 *   ★★件数が 0 でも 出します ── ★「1件も 無い」ことは 伝える 価値が あります。
 *   ★★★止めません。★下の `FEW_LINES` の 2行目が そう 言って います。
 */
export function isFew(n) {
  const v = Number(n);
  return Number.isFinite(v) && v < FEW_UNDER;
}

/** ★少ない ときの 2行（★見本の `.warn`）。★2行目を 消さないこと。 */
export function fewLines(n) {
  return [
    "出しているものが " + String(Number(n) || 0) + "件です。",
    "少ないと 見えるかもしれません。このまま 出すことも できます。"
  ];
}

/**
 * ★紙に 並べる 順（★見本の 並びの まま）。
 *
 *   ★★見本は 「紹介文 → 本番 → 経歴」の 順 です。
 *   ★★`ENTRY_KINDS` の 鍵で 書きます。★字を 書き写しません。
 */
export const PAPER_ORDER = Object.freeze(
  ENTRY_KINDS.map((k) => k.key));

/**
 * ★並べ替え。★`sort_order` の 昇り順。
 *
 *   ★★★賞の 有無で 並べ替えません（★`lib/portfolio.js` の 決め）。
 *     ★並べ替えると、★人の 間に 順位が できます。
 */
export function sortEntries(rows) {
  const list = Array.isArray(rows) ? rows.filter(Boolean) : [];
  return [...list].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
}

/** ★右下の 住所（★見本 `woolsong.app/p/7fk2m`）。★無い ときは 空 です。 */
export function paperUrl(slug) {
  const s = String(slug || "").trim();
  return s ? "woolsong.app/p/" + s : "";
}

/**
 * ★右下の 日付（★見本「2026年9月21日 現在」）。
 *
 *   ★★★出した 日 では なく、★**書き出した 日** です。
 *     ★見本の 字 ──「書き出した 日を 右下に 入れます。古い 紙が 出回らないように」
 *   ★★だから `published_at` を 使いません。★いま を 使います。
 */
export function paperDateWord(now) {
  const d = now instanceof Date ? now : new Date(now);
  if (Number.isNaN(d.getTime())) return "";
  return d.getFullYear() + "年" + (d.getMonth() + 1) + "月" + d.getDate() + "日 現在";
}

/** ★押しどころ（★見本の `.btn`）。 */
export const BTN_PDF = "PDF で 書き出す";
export const BTN_PRINT = "印刷する";

/** ★溢れた ときの 1行（★②の 約束）。★黙って 切りません。 */
export const OVERFLOW_LINE = "1枚に 収まりません。載せるものを 選び直せます。";

/** ★下の 3行（★見本の `.note`・1文字も 変えないこと）。 */
export const NOTE_LINES = Object.freeze([
  "点は つけません。他の方と 比べません。",
  "1枚に 収まらないときは、お知らせします。",
  "書き出した 日を 右下に 入れます。古い 紙が 出回らないように。"
]);
