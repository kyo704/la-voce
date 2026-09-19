// ============================================================================
// ★門下を 変える（★裁定 その104 Q1）── ★決めごと 1か所
//
//   ★★★坂本さんの お決め（★2026-09-19）──
//     「事務（`meibo`）が 変える。★名簿 → その人 → 門下を 変える。
//      ★いまの 先生 → 新しい 先生（一覧から 選ぶ）。
//      ★古い 行は 閉じる。★消さない。★履歴を 残す。」
//
//   ★★★書くのは 台帳の 読み道 1本 だけ です
//     （`supabase/migration_change_monka_teacher.sql`）。
//     ★★閉じる・作る・お知らせ の 3つを、★1つの 取引で します。
//     ★★画面から `assignments` を 直に 書きません。
//
//   ★★★過去の 記録（講評・連絡）は 残ります（★裁定 その72「取り上げない」）。
//     ★★ただし 古い 先生からは 見えなく なります（★`ended_at` で 閉じる ため）。
//     ★★その ことを、★変える 前に 画面で お伝えします。
//
//   ★見張り components/tests/ops-monka-change.test.js
// ============================================================================

import { can } from "@/lib/opsPerms";

export const HEAD = "門下を 変える";
export const BACK_LABEL = "その人";
export const NOW_LABEL = "いまの 先生";
export const NEW_LABEL = "新しい 先生";
export const NONE_WORD = "まだ 決まって いません";
export const PICK_LINE = "新しい 先生を 選んで ください。";
export const DO_LABEL = "門下を 変える";
/** ★名簿の「その人」に 置く 札（★入口）。 */
export const CHANGE_MONKA_LABEL = "門下を 変える";

/**
 * ★できこと ── ★名簿を 直せる 方 だけ（★役職の 名では 見ません）。
 *
 *   ★★★判じ方は `lib/opsPerms.js` の `can` に 任せます。
 *     ★★ここで 形を 見ません ── ★2か所で 判じると、★片方だけ 直る 日が 来ます。
 */
export function mayChange(perms) {
  return can(perms, "meibo");
}

/**
 * ★選べる 先生。
 *
 *   ★★いまの 先生は 選べません（★同じ 先生に 変えられません）。
 *   ★★学校の 方だけ です。★よその 学校の 方は 出ません。
 */
export function pickable(members, nowTeacherId) {
  return (members || [])
    .filter((m) => m && m.user_id && String(m.user_id) !== String(nowTeacherId));
}

/** ★押せるか ── ★選んで いない うちは 押せません。 */
export function mayDo({ nowTeacherId, newTeacherId }) {
  if (!newTeacherId) return false;
  return String(newTeacherId) !== String(nowTeacherId);
}

/** ★押せない わけ（★押す 前に 出します）。 */
export function whyCannotDo({ nowTeacherId, newTeacherId }) {
  if (!newTeacherId) return PICK_LINE;
  if (String(newTeacherId) === String(nowTeacherId)) {
    return "すでに その 先生が 担当です。";
  }
  return "";
}

/**
 * ★変える 前に お伝えする こと（★3行）。
 *
 *   ★★★「消える もの」を 先に 書きます。★あとから 驚かせません。
 */
export const BEFORE_NOTES = Object.freeze([
  "これまでの 講評・連絡は 残ります。消しません。",
  "ただし、古い 先生からは 見えなく なります。",
  "学生と、古い 先生に、1行ずつ お知らせが いきます。"
]);

/** ★終わった あとの 1行。 */
export function doneWord(newTeacherName) {
  return `担当を ${newTeacherName || "新しい 先生"} に 変えました。`;
}

/** ★書けなかった ときの 1行（★わけを 作りません）。 */
export const FAILED_LINE = "いま 変えられませんでした。もう一度 お試し ください。";
