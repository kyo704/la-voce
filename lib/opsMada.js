// ============================================================================
// ★時間割が まだの方（★見本 `P_mada`・お決め D78）── ★決めごと 1か所
//
//   ★★★読むのは 真偽 1つ だけ です（`get_timetable_submitted`）。
//     ★★曜日も、授業の 名も、場所も 来ません。★「出したか どうか」だけ です。
//     ★★★台帳 08-11 の 線を 越えて いません。
//
//   ★★★知らせは **1回だけ** です（`nudge_timetable`）。
//     ★★2度目は 台帳が 弾きます（★同じ 組み合わせは 1行 だけ）。
//     ★★★画面だけで 守りません。★催促を 重ねません（★見本の 字）。
//
//   ★★★出さなかった 方を、★こちらで 動かしません。
//     ★★見本の 字 ──「去年と 同じ枠の ままに します（勝手に 動かしません）」。
//
//   ★見張り components/tests/ops-mada.test.js
// ============================================================================

import { can } from "@/lib/opsPerms";

export const HEAD = "時間割が まだの方";
export const BACK_LABEL = "戻る";
export const NUDGE_LABEL = "知らせる（1回だけ）";

/** ★人数の 1行（★率は 出しません）。 */
export function countWord(rows) {
  return `${(rows || []).length}人`;
}

/** ★できこと ── ★知らせられる のは 名簿を 直せる 方 だけ。 */
export function mayNudge(perms) {
  return can(perms, "meibo");
}

/**
 * ★まだの方 だけ を 残します。
 *
 *   ★★★読めて いない ときは `null` を 返します。★空と 分けます。
 *     ★★「みんな 出して いる」と「まだ 読めて いない」は ちがいます。
 */
export function notSubmitted(submitted, nameOf, gradeOf) {
  if (!Array.isArray(submitted)) return null;
  return submitted
    .filter((r) => r && r.submitted === false)
    .map((r) => ({
      studentId: r.student_id,
      name: (nameOf && nameOf(r.student_id)) || "",
      grade: (gradeOf && gradeOf(r.student_id)) || ""
    }));
}

/** ★すでに 知らせた 方か。 */
export function alreadyNudged(nudges, studentId) {
  return (nudges || []).some((n) => n && String(n.student_id) === String(studentId));
}

/** ★まだ 知らせて いない 方 だけ（★2度目を 送らない）。 */
export function nudgeTargets(rows, nudges) {
  return (rows || [])
    .filter((r) => !alreadyNudged(nudges, r.studentId))
    .map((r) => r.studentId);
}

export const SENT_WORD = "知らせました";
export const EMPTY_HEAD = "みなさん 出して います。";
export const NOT_READ = "いま 読めませんでした。";

/** ★押せない ときの わけ。 */
export function whyCannotNudge(rows, nudges) {
  if (!rows || rows.length === 0) return EMPTY_HEAD;
  if (nudgeTargets(rows, nudges).length === 0) {
    return "みなさんに もう 知らせて います。2度目は 送れません。";
  }
  return "";
}

export const NOTES = Object.freeze([
  "1回だけ 知らせが 行きます。それ以上は 送れません。催促を 重ねません。",
  "出さなかった 方は、去年と 同じ枠の ままに します（勝手に 動かしません）。",
  "見えるのは「出したか どうか」だけ です。中身は 見えません。"
]);

export function doneWord({ sent, skipped }) {
  const s = Number(sent) || 0;
  const k = Number(skipped) || 0;
  return k > 0
    ? `${s}人に 知らせました。${k}人は もう 知らせて います。`
    : `${s}人に 知らせました。`;
}

export const FAILED_LINE = "いま 知らせられませんでした。もう一度 お試し ください。";
