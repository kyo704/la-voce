// ============================================================================
// ★よてい ── ★レッスン 1件の 中身（★2026-09-25・C群 束2）
//
//   ★見本 `SC_yotei`（★design-v51・PC・iPad 運営／★「きょう」から 押します）。
//
//   ★★★この 画面の 約束 3つ（★見本の `.note`・1文字も 変えないこと）──
//     ①「出席は 先生が つけます。あなたの 画面から つけません。」
//     ②「休む 理由は 聞きません。」
//     ③「体調は どこにも 送りません。」
//
//   ★★①は 決まり（RLS）で 守られて います（★2026-09-25・本番で 確かめました）──
//     ★`lessons` の update は 2種 だけ です ──
//       ★`Teacher can update or delete lessons` ／ `Teachers can update or delete org lessons`
//         …… ★先生・事務の 側
//       ★`lessons_student_notice` …… ★ご本人が 触れるのは `student_notice` だけ
//     ★★だから この 画面から `attendance` を 書く 道が ありません。
//       ★★★画面で 隠して いるのでは なく、★台帳が 受け取りません。
//
//   ★★②③は `lib/tellTeacher.js` に **似た** 行が あります が、★字が ちがいます ──
//     ★あちら …「理由の欄は ありません（体調を 書かせないためです）。」「書かなくて 構いません。」
//     ★こちら …「休む 理由は 聞きません。」「体調は どこにも 送りません。」
//   ★★★借りません。★約束は **その 字** です。★言い換えた ものは 別の 約束 です。
//     ★★「理由の 欄が ない」（あちら）と「理由を 聞かない」（こちら）は、
//       ★近いけれど 同じでは ありません。★片方は 形、★もう 片方は 約束 です。
//     ★★「体調は どこにも 送りません」は こちらに しか ありません ── ★消さないこと。
//
//   ★★引く 列 ── `lib/classroomShell.js` の `OPS_LESSON_COLUMNS` を 使います。
//     ★★あれも すでに ある もの です。★新しく 並べません。
//     ★★★体の 列は 1つも ありません。★`entries` に 触りません。
// ============================================================================
/** ★戻り先（★見本 `bk('きょう')`）。 */
export const BACK_TO = "きょう";

/**
 * ★4つの 行（★見本の `.li.plain`）。
 *
 *   ★★「出席」の 値は、★先生が いる ときだけ「先生が つけます」です。
 *     ★★いない ときは `—` です。★「未記入」と 書きません ── ★責める 語 です。
 */
export const ROW_LABELS = Object.freeze(["先生", "場所", "長さ", "出席"]);

/** ★無い ものは `—`（★見本の まま）。★「なし」「未設定」と 書きません。 */
export const DASH = "—";

/** ★出席の 欄の 字。★数も 印も 出しません。 */
export const ATTEND_BY_TEACHER = "先生が つけます";

/** ★長さ（★分）。★`0分` を 出しません。 */
export function lengthWord(minutes) {
  const n = Number(minutes);
  if (!Number.isFinite(n) || n <= 0) return DASH;
  return String(n) + "分";
}

/**
 * ★4行を 組みます。
 *
 *   ★★画面で 並べません。★ここが 並びの 1か所 です。
 */
export function rowsOf(lesson, { teacherName, placeName } = {}) {
  const l = lesson || {};
  return [
    { label: "先生", value: teacherName || DASH },
    { label: "場所", value: placeName || DASH },
    { label: "長さ", value: lengthWord(l.duration_minutes) },
    { label: "出席", value: l.teacher_id ? ATTEND_BY_TEACHER : DASH }
  ];
}

/** ★押しどころ（★見本の `.btn.g.sm`）。★先生が いる ときだけ 出します。 */
export const BTN_TELL = "休むことを 伝える";

/**
 * ★伝える ボタンを 出して よいか。
 *
 *   ★★先生が いない 回には 出しません ── ★届く 先が ありません。
 *   ★★すでに 伝えて ある ときも 出しません ── ★2度 送りません（★見本「1回だけ」）。
 */
export function mayTell(lesson) {
  const l = lesson || {};
  return !!l.teacher_id && !l.student_notice;
}

/** ★伝えた あとの 1行。★「ありがとう」と 書きません ── ★ただ 届いたと 言います。 */
export function toldWord(teacherName) {
  return (teacherName || "") + " 先生に 伝えました（1回だけ）";
}

/**
 * ★下の 3行（★見本の `.note`・1文字も 変えないこと）。
 *
 *   ★★3行目が いちばん 重い ── 「体調は どこにも 送りません」。
 *     ★★この 画面は `lessons` だけを 読みます。★`entries` に 触りません。
 *       ★`OPS_LESSON_COLUMNS` に 体の 列が 1つも ありません。
 */
export const NOTE_LINES = Object.freeze([
  "出席は 先生が つけます。あなたの 画面から つけません。",
  "休む 理由は 聞きません。",
  "体調は どこにも 送りません。"
]);
