// ============================================================================
// ★先生が 退く とき（★裁定 その104 Q2）── ★決めごと 1か所
//
//   ★★★坂本さんの お決め（★2026-09-19）──
//     ★合言葉は 閉じる（★引き金では なく、★退職の 手順の 中で はっきり 呼ぶ）
//     ★学生は そのまま。★学校には 在籍。★門下だけ 未定に なる
//     ★事務が Q1 の 手順で、★新しい 先生を 決め直す
//
//   ★★★`memberships` は 触りません。★学校に 居る か どうかは 別の 話 です
//     （★台帳 08-19）。★ここで まとめて 決めません。
//
//   ★見張り components/tests/ops-retire-teacher.test.js
// ============================================================================

import { can } from "@/lib/opsPerms";

export const HEAD = "先生が 退く とき";
export const LABEL = "担当を 外す";
export const BACK_LABEL = "その人";

/** ★できこと ── ★名簿を 直せる 方 だけ。 */
export function mayRetire(perms) {
  return can(perms, "meibo");
}

/**
 * ★何が 起きるか（★押す 前に、★ぜんぶ 並べます）。
 *
 *   ★★★「消えない もの」も 書きます ── ★不安を 残さない ため です。
 */
export const WILL_DO = Object.freeze([
  { label: "まだ 使われて いない 合言葉が 閉じます", ok: true },
  { label: "その 先生の 担当が 閉じます（消しません）", ok: true },
  { label: "門下の 方は、担当が 未定に なります", ok: true },
  { label: "学校の 在籍は そのまま です", ok: false },
  { label: "これまでの 講評・連絡は 残ります", ok: false },
  { label: "学校の 名簿からは 外れません", ok: false }
]);
export const WILL_WORD = "変わります";
export const WONT_WORD = "変わりません";

export const AFTER_LINE =
  "担当が 未定に なった 方は、名簿の「門下を 変える」で 決め直せます。";

/** ★合言葉で 入ろうと した 方に 出る 字（★裁定 その77 と 同じ 1文）。 */
export const SAME_ANSWER_NOTE =
  "閉じた 合言葉で 入ろうと した 方には、「入れませんでした」とだけ 出ます。";

/** ★終わった あとの 1行（★数は 台帳が 返した もの）。 */
export function doneWord({ closedInvitations, closedAssignments, studentsWithoutTeacher }) {
  const 合 = Number(closedInvitations) || 0;
  const 担 = Number(closedAssignments) || 0;
  const 未 = Number(studentsWithoutTeacher) || 0;
  return `合言葉 ${合}件を 閉じ、担当 ${担}件を 閉じました。`
    + `担当が 未定の 方は ${未}人です。`;
}

export const FAILED_LINE = "いま 外せませんでした。もう一度 お試し ください。";

/** ★押せるか ── ★ご自分は 外せません（★誰も いなく なります）。 */
export function mayDo({ teacherId, myId }) {
  if (!teacherId) return false;
  return String(teacherId) !== String(myId);
}
export const SELF_LINE = "ご自分の 担当は、ここからは 外せません。";
export function whyCannotDo({ teacherId, myId }) {
  return mayDo({ teacherId, myId }) ? "" : SELF_LINE;
}
