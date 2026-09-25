// ============================================================================
// ★ノートの 本文 ── ★2つの 画面（★2026-09-25・C群 束4）
//
//   ★見本 `SC['たぶん本文']`／`SC['ノート本文']`（★design-v51・iPhone で 開く用）。
//
//   ★★★2つは 同じ 形 です ── ★打つ ところ 1つ と、★下の 断り。
//     ★★けれど **約束が ちがいます**。★だから 字を 分けて 持ちます。
//       ★たぶん …「アプリは 1文字も 足しません。書いたものが そのまま 残ります。」
//       ★稽古　 …「「保存」を 押しません。打った そばから 保存します。」
//     ★★共通は「誰にも 送られません。」の 1行 だけ です。
//
//   ★★台帳（★2026-09-25・本番で 確かめました）──
//     ★`notes`（id, user_id, kind, body, …, deleted_at, lesson_on, teacher_label, …）
//     ★`notes.kind` は 5つ …… practice／repertoire／studio／clinic／**tabun**
//       ★★`tabun` は 2026-09-25 に 足しました（★移行 119本目）。
//     ★決まりは 本人だけ（`notes_select_own` ほか 4本）。
//
//   ★★★消すのは `deleted_at` を 入れる だけ です（★`lib/notes.js` の 決め）。
//     ★行は 消えません。★けれど **戻す 道が ありません**。
//     ★★だから 見本の「消したものは 5秒だけ 戻せます。」は 書きません（★下）。
//
//   ★★打った そばから 送ります ── ★`lib/notes.js` の `AUTOSAVE_MS`（900ms）。
//     ★★ここで 決めません。★あちらが 1か所 です。
// ============================================================================
import { AUTOSAVE_MS } from "@/lib/notes";

/** ★2つの 画面の 鍵（★`notes.kind` の 字）。 */
export const TABUN = "tabun";
export const PRACTICE = "practice";

/** ★題と 戻り先（★見本）。 */
export const TABUN_TITLE = "たぶん これかも";
export const TABUN_BACK = "たぶん これかも";
export const PRACTICE_BACK = "稽古";

/** ★打つ ところの 案（★見本の `placeholder`・1文字も 変えないこと）。 */
export const TABUN_PLACEHOLDER =
  "例：寝る時間が 遅い日は、朝の 入りが つらい かもしれない";

/** ★押しどころ（★見本）。 */
export const BTN_OK = "これで いい";
export const BTN_DELETE = "消す";
export const BTN_META = "日付と 先生";

/** ★消した ときの 1行（★見本の `toast`）。 */
export const DELETED_LINE = "消しました";

/**
 * ★★★たぶん の 断り（★見本の `.note`・1文字も 変えないこと）。
 *
 *   ★1行目が この 画面の 核 です ──「アプリは 1文字も 足しません」。
 *     ★★足さない、★直さない、★言い換えない。★候補も 出しません。
 *     ★★★`nTabun`（★一覧の ほう）も こう 言って います ──
 *       「アプリは 候補を 出しません。当たっているかも 言いません。」
 */
export const TABUN_NOTES = Object.freeze([
  "アプリは 1文字も 足しません。書いたものが そのまま 残ります。",
  "誰にも 送られません。"
]);

/**
 * ★★★稽古の 断り（★見本の `.note`）。
 *
 *   ★★★見本の 3行目は 書いて いません ──「消したものは 5秒だけ 戻せます。」
 *     ★★戻す 道が ありません。★`lib/notes.js` は `deleted_at` を 入れる だけ で、
 *       ★★戻す 関数も 画面も ありません（★探しました）。
 *     ★★★2026-09-24 に `lib/opsMisou.js` で 同じ 判断を して います ──
 *       「★戻す 道が ありません（★探しました。★1つも ありません）。
 *         ★書くと **嘘** に なります。★字だけ 先に 置きません。」
 *     ★★同じ 字 です。★同じ ように 置きません。★引き金も 同じ です。
 */
export const PRACTICE_NOTES = Object.freeze([
  "「保存」を 押しません。打った そばから 保存します。",
  "誰にも 送られません。"
]);

/** ★打った そばから ── ★`lib/notes.js` の 数を そのまま 使います。 */
export const SAVE_AFTER_MS = AUTOSAVE_MS;

/** ★引く 列 だけ。★`select('*')` を 書きません。 */
export const COLS_BODY = "id, kind, body, lesson_on, teacher_label, updated_at";

/**
 * ★題（★稽古の ほう）。★見本は 曲名などを 出します。
 *
 *   ★★空の ときは 題を 出しません ── ★「無題」と 書きません。
 *     ★★★「無題」は こちらが 付けた 名 です。★1文字も 足しません。
 */
export function bodyTitle(note) {
  const n = note || {};
  const t = String(n.teacher_label || "").trim();
  const d = String(n.lesson_on || "").trim();
  return [d, t].filter(Boolean).join("　");
}

/** ★新しく 書く ときか。 */
export function isNew(note) {
  return !note || !note.id;
}
