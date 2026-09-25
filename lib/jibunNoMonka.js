// ============================================================================
// ★自分の 門下 ── ★先生が 門下に 書く（★2026-09-25・C群）
//
//   ★見本 `SC['自分の門下']`（★design-v75）。
//
//   ★★★4つの 約束（★見本の `.warn` と `.note`・1文字も 変えないこと）──
//     ①「ここは 運営モードです。個人の アプリには 移りません。」
//     ②「自分の 門下にだけ 書けます。ほかの 門下は 見えません。」
//     ③「添付は できません。90日で 消えます。」
//     ④「生徒からの 返信は ありません（連絡板では ありません）。」
//     ⑤「生徒の 記録の 中身には、ここからも たどりつけません。」
//
//   ★★★②は 決まりが 守って います（★2026-09-25・本番で 確かめました）──
//     ★`org_messages` は `teacher_id` を 持ちます。★決まりは 3本 ──
//       ★`org_messages_insert` ／ `_select` ／ `_withdraw`。
//     ★★ほかの 先生の 門下の 行は 返りません。
//
//   ★★★④は **欄が 無い** こと で 守ります ── ★返信の 欄を 置きません。
//     ★★「返信できません」と 書いて 欄を 置く のでは ありません。
//       ★欄が あれば、★いつか 誰かが つなぎます。
//
//   ★★★⑤は 道が 無い こと で 守ります ── ★この 画面から `entries` を 引きません。
//     ★`entries` の 決まりは 本人だけ です。★先生に 道が ありません。
//
//   ★★★③の「90日」は 書き写しません ── `lib/renraku.js` の `HIDE_AFTER_DAYS`。
//     ★★あちらを 変えた 日に、★この 字も 一緒に 変わります。
//
//   ★★★添付が できない ことは、★**欄が 無い** ことで 守ります。
//     ★★写真も 書類も 受け取る 口が ありません。
// ============================================================================
import { HIDE_AFTER_DAYS } from "@/lib/renraku";

/** ★引く 列 だけ。★`select('*')` を 書きません。 */
export const COLS_MESSAGE = "id, body, created_at, withdrawn_at";

/** ★題（★見本「◯◯ の 門下」）。★人の 名は 呼ぶ 側が 渡します。 */
export function titleOf(me) {
  return String(me || "") + " の 門下";
}

/** ★人数（★見本の `.role`）。★「◯人 しか いません」と 書きません。 */
export function countWord(n) {
  return String(Number(n) || 0) + "人";
}

/** ★戻り先（★見本 `bk('連絡')`）。 */
export const BACK_TO = "連絡";

/** ★上の 2行（★見本の `.warn`・1文字も 変えないこと）。 */
export const HEAD_LINES = Object.freeze([
  "ここは 運営モードです。個人の アプリには 移りません。",
  "自分の 門下にだけ 書けます。ほかの 門下は 見えません。"
]);

/** ★書く ところ（★見本の `.fl` と `placeholder`）。 */
export const WRITE_HEAD = "書く";
export const WRITE_PLACEHOLDER = "門下の みなさんへ";
export const BTN_POST = "出す";

/** ★出した あとの 1行（★見本の `toast`）。★「1回だけ」を 消さないこと。 */
export const POSTED_LINE = "門下に 出しました。1回だけ 届きます";

/** ★空では 出せません。★`body` は not null です。 */
export function mayPost(body) {
  return String(body || "").trim().length > 0;
}

/** ★1つも 無い とき。★責めません。 */
export const EMPTY_LINE = "まだ 何も 出して いません。";

/** ★取り消した もの（★`withdrawn_at`）。★消さずに 印を つけます。 */
export const WITHDRAWN_MARK = "取り消しました";
export function isWithdrawn(row) {
  return !!(row && row.withdrawn_at);
}

/**
 * ★下の 3行（★見本の `.note`・1文字も 変えないこと）。
 *
 *   ★★1行目の 日数は `lib/renraku.js` から 出します。★書き写しません。
 */
export function noteLines() {
  return [
    "添付は できません。" + String(HIDE_AFTER_DAYS) + "日で 消えます。",
    "生徒からの 返信は ありません（連絡板では ありません）。",
    "生徒の 記録の 中身には、ここからも たどりつけません。"
  ];
}
