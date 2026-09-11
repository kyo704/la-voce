// ============================================================================
// きょうの よてい（★見本 S_kyou・594〜606行）
//
//   ★出どころ Opus の 裁定（★2026-09-11・その15）⑥⑦
//
//   ★★なぜ lib/todayBand.js から 分けたか
//     ★★あちらには「ありません」を 書かない、という 決まりが あります
//       （FORBIDDEN_WORDS ／ components/tests/today-band.test.js）。
//       ★★帯は「今日の レッスンは ありません」と 毎朝 言わない ため です。
//         ★無い ことを 毎朝 知らせるのは、★催促と 同じ だからです。
//     ★★けれど、★きょうの よてい は ちがいます。
//       ★★見本 600行は、★枠の 中に はっきり こう 書いて います ──
//         「この教室の よていは ありません」
//       ★★枠は いつも 出ます。★中が 空の ままだと、★何の 枠か 分かりません。
//       ★★枠が 消えると、★「時間割を 入れる」への 入口も 消えます。
//     ★★2つは 別の ものです。★だから、★別の 帳面に します。
//       ★1つに すると、★どちらかの 決まりを ゆるめる ことに なります。
//
//   ★見張り components/tests/today-plan.test.js
// ============================================================================

import { lessonsOn, timeOf } from "@/lib/todayBand";

/** ★見本の 字（★594〜606行）。★1文字も 変えないこと。 */
export const PLAN_COPY = Object.freeze({
  head: "きょうの よてい",
  none: "この教室の よていは ありません",
  timetable: "時間割を 入れる",
  note: "時間割の あいている ところが、先生に 伝わります（中身は 伝わりません）。"
});

/**
 * ★きょうの よていの 1行（★見本 lesTitle）。
 *
 *   ★見本 lesTitle(L) = L.t + '　' + L.n + (L.tea ? '　' + L.tea + ' 先生' : '')
 *     ★t 時刻／n 名前／tea 先生
 *
 *   ★★先生の 名前は、★入って いれば 出します。★作りません。
 */
export function planRowLabel(lesson, tz) {
  if (!lesson) return "";
  const t = timeOf(lesson.scheduled_at, tz);
  const name = lesson.title || lesson.label || "レッスン";
  const tea = lesson.teacher_name || "";
  return t + "　" + name + (tea ? "　" + tea + " 先生" : "");
}

/**
 * ★きょうの よてい（★個人ぶん）。
 *
 *   ★★教室の 札（★どの 教室の ぶんか）は 出しません。★後回しです。
 *     ★だから、★ご自分の レッスン ぜんぶを その日ぶん 出します。
 *
 *   @returns [{ id, label }]
 */
export function planToday(lessons, todayISO, tz) {
  return lessonsOn(lessons, todayISO, tz).map((l) => ({
    id: l.id,
    label: planRowLabel(l, tz)
  }));
}
