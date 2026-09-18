// ============================================================================
// ★門下（★見本 `P_monka` ／ ★裁定 その90 §6-3・2026-09-18）
//
//   ★★★見えるのは **担当の 生徒だけ** です。★学校 全部の 名簿は 見えません。
//     ★★台帳も 同じ です（`assignments_select` ── 自分の `teacher_id` だけ）。
//
//   ★★★出席の 数は 出します（★裁定 その90）。★率（％）は 出しません。
//     ★★Opus の 記録 ──「情報を 奪う ことと、点数を 出さない ことは 別」。
//     ★★出席が 足りない 学生に 声を かけられるのは 先生 です。
//
//   ★★★並びは **名前順**（★学年 → 名前）。★出席の 多い順に しません。
//
//   ★見張り components/tests/ops-monka.test.js
// ============================================================================

import { can } from "@/lib/opsPerms";

/** ★題（★見本 `P_monka`）。 */
export const HEAD = "門下";

/** ★添え字（★見本 ──「○○ の 門下　N人　／　学年の 順に 並べています」）。 */
export function subLine(teacherName, count) {
  const 名 = teacherName ? `${teacherName} の 門下` : "門下";
  return `${名}　${Number(count) || 0}人　／　学年の 順に 並べています`;
}

/**
 * ★入れる か（★`monka_write` を 持つ 方）。
 *
 *   ★★`TAB_RULES` の「門下」と 同じ 決め です。★2つ 目の 決めを 作りません。
 */
export function mayOpen(perms) {
  return can(perms, "monka_write");
}

/**
 * ★自分の 門下の 生徒（★`assignments` から）。
 *
 *   ★★★終わった 受け持ちは 出しません（`ended_at`）。
 *     ★★見本 ──「担当を 外れると、その時点から 見えなく なります」。
 *   ★★並びは 学年 → 名前。★出席では 並べません（★裁定 その90 §4）。
 */
export function monkaRows(assignments, teacherId, { gradeOf, nameOf } = {}) {
  const 出 = (assignments || [])
    .filter((a) => a && a.teacher_id === teacherId && !a.ended_at)
    .map((a) => ({
      studentId: a.student_id,
      isRepresentative: !!a.is_representative,
      grade: (gradeOf && gradeOf(a.student_id)) || "",
      name: (nameOf && nameOf(a.student_id)) || ""
    }));
  return 出.sort((x, y) => {
    const g = String(x.grade).localeCompare(String(y.grade), "ja");
    return g || String(x.name).localeCompare(String(y.name), "ja");
  });
}

/**
 * ★空いて いる コマの 数（★2026-09-19・坂本さんの お決め Q2）。
 *
 *   ★★★返って くるのは **数 だけ** です。
 *     ★★どの 時間が 空いて いるかも、★中身も 来ません。
 *   ★★もとから ある 約束と 同じ です ──
 *     ★`lib/myTimetable.js` ──「先生に 見えるのは 空いている 時間だけです。
 *       ★授業の 名前・先生・教室・備考は 送られません。」
 *
 *   ★★まだ 尋ねて いない ときは null。★0 と 区別します。
 *     ★★★0 は「1つも 空いて いない」。★null は「まだ 分からない」。
 */
export const FREE_UNKNOWN = "—";
export function freeWord(n) {
  if (n === null || n === undefined) return FREE_UNKNOWN;
  const v = Number(n);
  return Number.isFinite(v) ? `${v}コマ` : FREE_UNKNOWN;
}

/** ★代表の 印（★見本の `tag`）。★色では なく 字 です。 */
export const REPRESENTATIVE_MARK = "代表";

/**
 * ★その方の レッスン（★出席を 数える もと）。
 *
 *   ★★自分が 担当した コマ だけ を 数えます。
 *     ★★★よその 先生の コマを 混ぜません。★門下の 数では なく なります。
 */
export function lessonsOfStudent(lessons, teacherId, studentId) {
  return (lessons || []).filter((l) =>
    l && l.teacher_id === teacherId && l.student_id === studentId);
}

/**
 * ★この 門下に 当てて いる 型（★裁定 その90 §5）。
 *
 *   ★★1つも 無ければ null。★分母を 出しません。
 *   ★★2つ 以上 当たって いる ときは、★はじめの 1つ を 使います。
 *     ★★★そう なる はず の もの では ありません。
 *       ★★見本は 1つの 門下に 1つ の 形 です。
 *       ★★数えて、★2つ 以上 なら 画面に 断りを 出します。
 */
export function presetOf(presets, teacherId) {
  const 当 = (presets || []).filter((p) =>
    (p.teachers || []).includes(teacherId));
  return 当.length > 0 ? 当[0] : null;
}

export function presetCount(presets, teacherId) {
  return (presets || []).filter((p) => (p.teachers || []).includes(teacherId)).length;
}

export const MANY_PRESETS_LINE =
  "この 門下に、授業の 型が いくつも 当たって います。設定で ご確認ください。";

/** ★型が 無い ときの 断り（★分母を 出しません）。 */
export const NO_PRESET_LINE =
  "授業の 型が まだ ありません。回数の 目安は 出ません。";

/**
 * ★注（★見本の `.note`。★1行も 減らしません）。
 *
 *   ★★★どれも 約束の 字 です。
 */
export const NOTES = Object.freeze([
  "出席の 数は、担当の 門下だけ 見えます。率（％）は 出しません。",
  "並びは 名前順です。出席の 多い順には しません。",
  "「足りない見込み」は、責める ものでは ありません。",
  "見えるのは 担当の生徒だけ。学校全部の 名簿は 見えません。",
  "担当を 外れると、その時点から 見えなくなります。"
]);

export const NOTES_BOLD = Object.freeze([
  "出席の 数は、担当の 門下だけ",
  "名前順",
  "責める ものでは ありません",
  "担当の生徒だけ"
]);

/** ★何も 無い ときの 字（★見本の `stBlock`）。 */
export const EMPTY_HEAD = "まだ、門下に 誰も いません。";
export const EMPTY_HOW = "名簿から 担当を 決めると、ここに 出ます。";

/**
 * ★見本に ある のに、★置いて いない もの。
 *
 *   ★★★3つの 列（時間割／空いて いる コマ／レッスンの 枠）と、
 *     ★★3つの 札（日程を 組む／代表を 決める／時間割が まだの方）。
 *
 *   ★★★時間割は `my_timetable` に あります。★決まりは **自分の ぶん だけ** です
 *     （`my_timetable_own` ── `auth.uid() = user_id`）。
 *     ★★先生は、★生徒の 時間割を **1行も 読めません**。
 *     ★★★「出して いるか どうか」すら 読めません。★行の 有無も 見えません。
 *   ★★見本は「見えるのは 学年と、空いて いるか どうかだけ」と 書いて います。
 *     ★★その「空いて いるか」を 出すには、★新しい 読み道が 要ります。
 *     ★★★それは 見える 範囲の 話 です。★こちらでは 決めません。
 *
 *   ★★引き金 ── ★生徒の 時間割を 先生に 見せる、と 決まった 日。
 *     ★★台帳 docs/ledgers/08-保留している決め.md 08-11
 */
export const NOT_YET = Object.freeze([
  {
    key: "timetable",
    label: "時間割 が 出て いるか ／ レッスンの 枠",
    // ★★★2026-09-19、★「空いて いる コマ」だけ **通りました**（★お決め Q2）。
    //   ★★`get_monka_free_counts()` が、★数 だけ を 返します。
    //   ★★★残りの 2つは、★まだ です ──
    //     ★「時間割が 出て いるか」…… ★行の 有無 は、★空きの 数からは 分かりません
    //       ★★★時限を 1つも 決めて いない 方も、★空き 0 です。
    //         ★★「出して いない」と「ぜんぶ 埋まって いる」が 同じ 顔に なります。
    //     ★「レッスンの 枠」…… ★どこに 入れたか を しまう ところが ありません
    why: "空きの 数だけでは、時間割を 出して いない 方と、ぜんぶ 埋まって いる 方を 分けられない",
    needs: "「出して いるか どうか」だけ を 返す 道（中身は 返さない）と、レッスンの 枠の しまい場所"
  },
  {
    key: "kumu",
    label: "レッスンの 日程を 組む ／ 代表を 決める ／ 時間割が まだの方",
    why: "行き先の 画面が ありません（P_kumu / P_daihyo / P_mada）",
    needs: "その 3枚を 作る こと"
  }
]);
