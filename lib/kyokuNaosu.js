// ============================================================================
// ★曲を 直す（★2026-09-25・C群）
//
//   ★見本 `SC['曲を直す']`。★`SC['曲']`（★曲の 台帳）から 開きます。
//
//   ★★★ようすの 4つは **書き写しません** ── `lib/practiceNote.js` から 取ります。
//     ★★台帳の CHECK（`repertoire_status_check`）と 1文字ずつ 同じ です。
//     ★★★2026-09-25 に、★`lib/recordSheets.js` に もう 1つ 一覧が あり、
//       ★4つ目が「しばらく 置く」（★間に 空白）に なって いました。
//       ★★あれで 書いたら 台帳に 弾かれます。★どこからも 使われて いなかった ので
//         ★実害は ありませんでした。★同じ 日に 1つの もとへ 寄せました。
//
//   ★★★下の 断りは **約束** です ──
//     ★「記録した日数・本番の 回数は、記録から 数えているので 直せません。」
//     ★★数えるのは `lib/repertoireLog.js` です。★この 画面は 触りません。
//       ★★触れる 口を 作らない こと。★作った 時点で 嘘に なります。
//
//   ★見張り components/tests/kyoku-naosu.test.js
// ============================================================================

import { REPERTOIRE_STATUS } from "@/lib/practiceNote";

/** ★題。 */
export const TITLE = "曲を 直す";

/** ★書ける 4つ（★見本の `f(...)` と 札）。 */
export const FIELDS = Object.freeze([
  Object.freeze({ key: "repertoire_name", label: "曲名", placeholder: "曲名" }),
  Object.freeze({ key: "composer", label: "作曲家・役", placeholder: "れい：プッチーニ　ミミ" })
]);

/** ★ようすの 節。 */
export const STATUS_LABEL = "様子";

/** ★ようすの 4つ（★もとは 1つ）。 */
export const STATUS_CHOICES = REPERTOIRE_STATUS;

/**
 * ★はじめて 記録した日。
 *
 *   ★★★見本は 打ち込む 欄に して います が、★**読むだけ** に します。
 *     ★★記録から 数えて いる もの です（★下の 断りの とおり）。
 *     ★★打てる 欄を 置いたら、★その 断りが 嘘に なります。
 *   ★★無い ときは「—」。★きょうの 日を 入れません。
 */
export const FIRST_LABEL = "はじめて 記録した日";
export function firstDayWord(iso) {
  const s = String(iso || "");
  return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : "—";
}

/** ★札 2つ。 */
export const BTN_OK = "これでいい";
export const BTN_DELETE = "この曲を 消す";

/** ★下の 断り（★約束）。 */
export const NOTE =
  "打った そばから 残ります。記録した日数・本番の 回数は、記録から 数えているので 直せません。";

/** ★台帳から 読む 列（★`select('*')` を 書かない ため）。 */
export const COLS = "user_id, repertoire_name, composer, status, created_at";

/**
 * ★台帳へ 入れる 形。
 *
 *   ★★★`status` は 4つの どれか だけ です。★ほかは 入れません。
 *     ★★台帳の CHECK が 弾きます が、★弾かれる 前に こちらで 止めます。
 *   ★★曲名が 空の ものは 送りません（★名の 無い 行を 作らない）。
 */
export function patchOf(v) {
  const o = v || {};
  const 名 = String(o.repertoire_name || "").trim();
  if (!名) return null;
  const st = REPERTOIRE_STATUS.includes(o.status) ? o.status : REPERTOIRE_STATUS[0];
  return {
    repertoire_name: 名,
    composer: String(o.composer || "").trim() || null,
    status: st
  };
}

/** ★送れる か（★札を 押せる か）。 */
export function canSave(v) {
  return patchOf(v) !== null;
}
