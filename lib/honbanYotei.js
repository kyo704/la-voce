// ============================================================================
// ★本番の 予定（★2026-09-25・C群）
//
//   ★見本 `SC['本番の予定']`。
//   ★台帳 `public.performances`（★`performed_on` ／ `label` ／ `morning_words`）。
//
//   ★★★下の 4行は **約束** です。★1つずつ 確かめました ──
//     ①「本番の朝に「きょう」の 一番上に、書いた ことばが そのまま 出ます。」
//       ★★出す のは `lib/todayCard.js`（`morning_words`）。★この 画面は 書くだけ。
//     ②「アプリは 1文字も 足しません。要約も しません。」
//       ★★打った 字を そのまま 入れます。★整える 手を 1つも 通しません。
//     ③「知らせは 出しません。書いていない人には 何も 出ません。」
//       ★★空の ときは 行ごと 出しません（★`lib/todayCard.js` の 側）。
//     ④「書くように 誘いません。書く場所が あるだけです。」
//       ★★催促も、★「あと◯」も、★書いた 人数も 出しません。
//
//   ★★★見本に 「場所」の 欄が あります が、★台帳に 列が ありません。
//     ★★`performances` …… id／user_id／performed_on／kind／label／org_event_id／
//       created_at／updated_at／repertoire_name／morning_words。
//     ★★★置き場の 無い 欄を 出しません。★打てた ように 見えて 消えます。
//       ★★Opus へ 差し戻し（★`docs/ledgers/08-保留している決め.md`）。
//
//   ★見張り components/tests/honban-yotei.test.js
// ============================================================================

/** ★題。 */

import { tx } from "@/lib/t";
export const TITLE = tx("本番の 予定");

/**
 * ★書ける ところ。
 *
 *   ★★`place`（★見本の「場所」）は ありません ── ★上の 註の とおり です。
 */
export const FIELDS = Object.freeze([
  Object.freeze({ key: "performed_on", label: tx("日"), placeholder: "", kind: "date" }),
  Object.freeze({ key: "label", label: tx("名前"), placeholder: "", kind: "text" })
]);

/** ★ことばの 欄（★見本の `textarea`）。 */
export const WORDS_LABEL = tx("本番前の 自分への ことば");
export const WORDS_OPTIONAL = tx("（書かなくて かまいません）");
export const WORDS_PLACEHOLDER = tx("本番の朝の 自分に 言っておきたいこと");

/** ★札。 */
export const BTN_OK = tx("これで いい");

/** ★書けた とき の 一言（★見本の `toast`）。 */
export const SAVED = tx("書きました");

/** ★下の 断り（★約束。★消さないこと）。 */
export const NOTES = Object.freeze([
  tx("本番の朝に「きょう」の 一番上に、書いた ことばが そのまま 出ます。"),
  tx("アプリは 1文字も 足しません。要約も しません。"),
  tx("知らせは 出しません。書いていない人には 何も 出ません。"),
  tx("書くように 誘いません。書く場所が あるだけです。")
]);

/** ★太字に する 行（★見本の `<b>`）。 */
export const NOTES_STRONG = Object.freeze([0]);

/** ★台帳から 読む 列。 */
export const COLS = "id, user_id, performed_on, label, morning_words";

/**
 * ★台帳へ 入れる 形。
 *
 *   ★★★`morning_words` は **そのまま** 入れます。★整えません（★約束②）。
 *     ★★前後の 空白すら 落としません ── ★打った とおり です。
 *   ★★日が 無ければ 送りません（★日の 無い 本番は 置けません）。
 */
export function patchOf(v) {
  const o = v || {};
  const 日 = String(o.performed_on || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(日)) return null;
  return {
    performed_on: 日,
    label: String(o.label || "").trim() || null,
    // ★★空の ときは null。★空の 字を 置くと、★「書いた」と 数えられます。
    morning_words: o.morning_words ? String(o.morning_words) : null
  };
}

/** ★送れる か。 */
export function canSave(v) {
  return patchOf(v) !== null;
}
