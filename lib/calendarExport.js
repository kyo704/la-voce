// ============================================================================
// カレンダーに渡してよいもの（2026-09-03・Opus の裁定 §6）
//
//   ★これは「外へ出る道」の1本です（lib/outboundRoutes.js の google-calendar）。
//     ただし origin は "client" です。サーバは送りません。
//     ★利用者が「カレンダーに追加」を押したときだけ、その人の画面から飛びます。
//     ★fetch ではなく <a href> なので、通信の検索では出てきません。
//     見つけにくい道なので、渡すものを★1か所で決めます。
//
//   ★何が漏れていたか（直す前）
//     ・題名に先生のお名前が入っていました
//         VocalTracker.jsx:13261  `レッスン（${teacherWithHonorific(...)}）`
//         VocalTracker.jsx:2659   `レッスン（${withWhom}）`
//       ★利用者ご自身の Google の予定表に、先生のお名前が残ります。
//         先生は、それに同意していません。
//     ・説明欄に lesson.note がそのまま入っていました（.ics も同じ）。
//       ★note には、体調のことも、他の生徒さんのことも書けます。
//
//   ★直し方：題名を受け取らないようにしました。
//     buildGoogleCalendarUrl も downloadLessonICS も、
//     ★title を引数に取りません。呼ぶ側が名前を入れる余地がありません。
//     「入れないでください」と書くのではなく、★入れられない形にします。
//
//   ★場所は入れられません。
//     lessons に場所の列がありません（entries の location は別のもので、
//     ★先生には決して渡さない11列の1つです）。
//     裁定は「日付・時刻・場所・一般的な題名」でしたが、
//     ★渡せるのは日付・時刻・題名だけです。無い列は作りません。
// ============================================================================

/** カレンダーに渡してよいもの。★これで全部です。 */
export const CALENDAR_ALLOWED = ["start", "end", "title"];

/**
 * ★決して渡さないもの。
 *   検査（components/tests/calendar-export.test.js）が見張ります。
 */
export const CALENDAR_FORBIDDEN = [
  "note",              // レッスンのメモ。体調のことが書かれうる
  "teacher_note",      // 先生の覚え書き
  "teacherName",       // ★先生のお名前（本人の同意がありません）
  "studentName",       // ★他の生徒さんのお名前（合唱・グループのとき）
  "location",          // entries の location。先生にも渡さない11列の1つ
  "throat", "symptom", "health"
];

/**
 * 予定の題名。★誰の名前も入りません。
 *
 * ★言語ごとに訳します。t が無ければ日本語です。
 * ★「◯◯先生とのレッスン」にしません。相手が誰かは、
 *   利用者ご自身が覚えています。カレンダーに書き残す必要はありません。
 */
export function calendarTitle(t) {
  return (t && t("calendarEventTitle")) || "レッスン";
}

/**
 * レッスン1件から、カレンダーに渡す形を作る。
 *
 * ★ここが唯一の入口です。lesson をそのまま組み立て側へ渡しません。
 *   渡すと、あとで誰かが lesson.note を足してしまいます。
 *
 * @returns {{start: Date, end: Date, title: string}}
 */
export function buildCalendarEvent(lesson, t) {
  const start = new Date(lesson.scheduled_at);
  const end = new Date(start.getTime() + (lesson.duration_minutes || 60) * 60000);
  return { start, end, title: calendarTitle(t) };
}
