// ============================================================================
// 生徒の 教室の 殻 ── 「きょう」に 足す 3つの 節（★読むだけ）
//
//   ★出どころ docs/opus/未決機能の設計書_第3版_2026-09-14.md §6
//   ★出どころ [ACTION] Opus → Code（★2026-09-15）
//     「BUILD ORDER: 次のレッスン -> 近い行事 -> 先生からの連絡
//       read-only. no read marks written in v1」
//   ★裁定 2026-09-15・坂本さん
//     「「次のレッスン」は 両方 拾う（★教室の レッスン・個人指導、
//       両方の lessons 行を 対象に する）」
//
//   ★★新しい タブを 作りません。★`/house` も 作りません。
//     ★「きょう」の 中の 3つの 節 です（★§6-2）。
//   ★★読むだけ です。★v1 では 既読も 書きません。
//
// ---------------------------------------------------------------------------
// ★★★なぜ「両方 拾う」が 要るのか（★これを 外すと 静かに 壊れます）
//
//   ★★`lessons` に 生徒が 届く 道は **2つ** あります
//     （★2026-09-15、★Opus が 本番の pg_policy を 直に 引いて 分かりました）。
//
//     ① `Ops-visible lessons (org-based)`
//          org_id is not null かつ auth.uid() = student_id
//     ② `Teacher and student can view lessons`
//          `teacher_student_links` 経由（★`link_id`）。★org_id の 条件 なし
//
//   ★★★そして 個人指導の レッスンは、★`student_id` を **持ちません**。
//     ★`handleCreateLesson`（`components/VocalTracker.jsx`）が 入れるのは
//       `{ link_id, scheduled_at, note, created_by }` ── ★student_id は ありません。
//     ★★だから `.eq("student_id", userId)` だけで 引くと、
//       ★個人指導の 方には **1件も 出ません**。★空の 画面に なります。
//     ★★そして 誰も 気づきません ── ★エラーに ならないから です。
//
//   ★★だから 引き方も 2つ 要ります。★混ぜて、★id で 重なりを 落とします。
//     ★教室にも 通い、★同じ 先生に 個人でも 習う 方が いれば、
//       ★同じ 行が 2度 返る ことが あります。
// ============================================================================

// ★出欠の 見分けは 1か所 です（★lib/lessonCounts.js）。★ここで 並べ直しません。
//   ★★"came" / "absent" / "canceled" / null ── ★値を 書き写すと、★また 2つに なります。
import { attendanceOf } from "@/lib/lessonCounts";

/**
 * ★どれだけ 先まで 見るか。
 *
 *   ★★「次の」なので、★1件 出せば 足ります。
 *     ★けれど 取り消された ものが 混ざるので、★少し 多めに 引きます。
 */
export const LESSON_FETCH_LIMIT = 20;

/** ★近い 行事を、★いくつまで 出すか（★§6-2「知らせるだけ」）。 */
export const EVENT_SHOW_LIMIT = 3;

/** ★何日 先までを「近い」と するか。 */
export const EVENT_WINDOW_DAYS = 30;

/** ★連絡を、★いくつまで 出すか。 */
export const MESSAGE_SHOW_LIMIT = 3;

/**
 * ★引く 列。★`select("*")` に しません。
 *
 *   ★★RLS は 行を 隠します。★列は 隠しません。
 *     ★`select("*")` は、★見せない はずの 列も 通信に 載せます。
 *     ★★画面に 出して いなくても、★通信を 見れば 読めます。
 *   ★★だから、★出す ものだけを 名前で 並べます。
 *
 *   ★★`teacher_note` を 入れて いません。★先生が 自分の ために 書いた もの です。
 *   ★★`attendance_by` も 入れて いません。★誰が 付けたかは、★生徒の 話では ありません。
 */
//   ★★★`held` を 入れて いました。★そんな 列は ありません（★2026-09-16）。
//     ★★400 が 返り、★2つの 読みが **両方** 落ちて いました。
//       ★★だから「次のレッスンは、いま 読めませんでした」が 出て いました。
//     ★★2026-09-08 に、★`lib/lessonCounts.js` が `held` から `attendance` へ
//       ★移って います。★その とき「`held` の 列は 一度も 作られて いない」と
//       ★書き残されて いました。★この ファイルは 9月15日に 書いた もので、
//       ★その 書き残しを 読まずに、★古い 名を 持って きて しまいました。
//     ★★出欠は `attendance` が 正 です（"came" / "absent" / "canceled" / null）。
export const LESSON_COLUMNS =
  "id, scheduled_at, note, org_id, link_id, teacher_id, attendance";

/**
 * ★運営の 画面が 引く 列（★2026-09-20）。
 *
 *   ★★★`select("*")` を 使って いました。★それで 止まって いました。
 *     ★★`lessons` は **列ごと** に 渡して います（★table では なく column の grant）。
 *     ★★★渡して いない 列が 1つでも 混ざると、★**要求ごと** 落ちます。
 *       ★★0行では ありません。★`data` が null に なり、★画面は 空に なります。
 *     ★★`place_id` と `kind` を 足した 日（★2026-09-20・D93）に、
 *       ★★`created_by` と あわせて 3つが 渡して いない 列に なりました。
 *       ★★★その 日から、★日程の 表は「この 日に コマは ありません」でした。
 *
 *   ★★★だから 名前で 並べます。★`*` を 使いません。
 *     ★★足す ときは、★台帳の 渡し（grant）も 一緒に 足して ください。
 *   ★★`created_by` は 引きません。★画面で 使いません。
 */
export const OPS_LESSON_COLUMNS =
  "id, org_id, link_id, teacher_id, student_id, scheduled_at, duration_minutes, "
  + "note, attendance, attendance_at, attendance_by, student_notice, "
  + "student_notice_at, place_id, kind";

export const EVENT_COLUMNS =
  "id, org_id, event_date, start_time, end_time, kind, title, previous_date, withdrawn_at";

/**
 * ★行事の 列（★運営・個人 どちらも・2026-09-20）。
 *
 *   ★★★`select("*")` を 使って いました。★通って いません でした。
 *     ★★`org_events` も **列ごと** の 渡し です。
 *     ★★`created_by` は 渡して いません。★`*` は そこで 落ちます。
 *     ★★★落ちると 0行では なく `data` が null です。★行事が 消えます。
 *   ★★`created_by` は 引きません。★画面で 使いません。
 *   ★★足す ときは、★台帳の 渡し（grant）も 一緒に 足して ください。
 */
export const OPS_EVENT_COLUMNS =
  "id, org_id, event_date, start_time, end_time, kind, title, previous_date, "
  + "withdrawn_at, created_at, updated_at, place, target_grades, target_courses";

/** ★行事に 出る 方（★`org_event_participants`）。★`*` を 使いません。 */
export const EVENT_JOIN_COLUMNS = "id, user_id, org_event_id, joined_at, dismissed_at";

export const MESSAGE_COLUMNS =
  "id, org_id, teacher_id, body, created_at, withdrawn_at";

/**
 * ★2つの 道で 引いた レッスンを、★1つに します。
 *
 *   ★★同じ 行が 2度 来る ことが あります（★上の いきさつ）。
 *     ★id で 落とします。★先に 来た ほうを 残します。
 *   ★★null や 配列で ない ものが 来ても 落ちません。
 */
export function mergeLessons(...lists) {
  const seen = new Set();
  const out = [];
  lists.forEach((list) => {
    (Array.isArray(list) ? list : []).forEach((row) => {
      if (!row || !row.id || seen.has(row.id)) return;
      seen.add(row.id);
      out.push(row);
    });
  });
  return out;
}

/**
 * ★次の レッスン。★1つだけ 返します。
 *
 *   ★★これから の もの の うち、★いちばん 近い もの。
 *   ★★終わった ものは 出しません（★`attendance` に 答えが 入って いる もの）。
 *   ★★時刻の 無い 行は 出しません。★「次」が 決まらない から です。
 *   ★★1件も 無ければ null。★空の 札を 出すのは、★呼ぶ側の 仕事 です。
 *
 * @param {Array} rows   ★merge した あとの レッスン
 * @param {Date}  now    ★いま
 */
/**
 * ★通って いる 教室の レッスン だけを 残す（★Opus の 裁定・2026-09-16）。
 *
 *   ★★教室を やめた あと、★これからの レッスンが 残って いました。
 *     ★★行事は 消えます（`org_events_select_member` が 在籍を 見ます）。
 *     ★★連絡も 止まります（★受け持ちを 閉じる ため）。
 *     ★★予定だけ 残って いました。★見本は 3つ とも 消える と 書いて います。
 *
 *   ★★★台帳の 決まりは 変えません。
 *     ★★レッスンの 記録は **その方の もの**です ──
 *       「11月20日に 高橋先生と レッスンを 受けた」は、★担当の 話では ありません。
 *     ★★見本の 字 ──「あなたの 記録・ノート・レパートリー・ひつじは、1つも 消えません」。
 *     ★★だから 隠すのは **これからの 分**だけ、★それも **画面の 絞り**で します。
 *       ★★ふりかえる・記録の 側では、★そのまま 見えます。
 *
 *   ★★個人指導（`org_id` が null）は 残します。
 *     ★★教室と 先生は 別の つながり です。★教室を やめても 続きます。
 *
 *   ★★`activeOrgIds` が null／undefined の ときは、★何も 絞りません。
 *     ★★「まだ 分からない」を「在籍が 無い」に しない ため です。
 *     ★★分からない ときに 消すと、★通って いる方の 予定が 黙って 消えます。
 *     ★★呼ぶ 側が、★在籍を 読めたと 分かって から 渡します。
 *
 * @param {Array} rows          ★merge した あとの レッスン
 * @param {Array} activeOrgIds  ★いま 在籍して いる 教室の id
 */
export function lessonsInAttendingOrgs(rows, activeOrgIds) {
  const list = Array.isArray(rows) ? rows : [];
  if (!Array.isArray(activeOrgIds)) return list;
  const live = new Set(activeOrgIds.filter(Boolean));
  return list.filter((r) => {
    if (!r) return false;
    // ★個人指導 ── ★教室の 話では ありません。
    if (!r.org_id) return true;
    // ★通って いる 教室 ── ★そのまま。
    if (live.has(r.org_id)) return true;
    // ★やめた 教室 ── ★これからの 分だけ 出しません。
    //   ★★済んだ 分は 残します。★その方が 受けた ことの 記録 です。
    const at = Date.parse(r.scheduled_at || "");
    if (!Number.isFinite(at)) return true;
    return at < Date.now();
  });
}

export function nextLesson(rows, now) {
  const t = now instanceof Date ? now.getTime() : Date.now();
  const future = (Array.isArray(rows) ? rows : [])
    .filter((r) => r && r.scheduled_at)
    // ★★済んだ ものは 出しません。★答えが 入って いれば、★もう 済んで います。
    //   ★★`held` では ありません ── ★そんな 列は 台帳に ありません（★2026-09-16）。
    //   ★★見分けは `attendanceOf` 1つ が 持ちます。★ここで 値を 並べ直しません。
    .filter((r) => attendanceOf(r) === null)
    .map((r) => ({ row: r, at: Date.parse(r.scheduled_at) }))
    .filter((x) => Number.isFinite(x.at) && x.at >= t)
    .sort((a, b) => a.at - b.at);
  return future.length > 0 ? future[0].row : null;
}

/**
 * ★近い 行事。
 *
 *   ★★取り下げた ものは 出しません（★`withdrawn_at`）。
 *     ★行は 消えて いません。★出さないだけ です。
 *   ★★きょうを 含みます。★きょうの 行事が 消えるのは おかしい からです。
 *   ★★日づけ だけで 比べます。★`start_time` が 無い 行事が あります。
 *
 * @param {Array}  rows
 * @param {string} todayIso  ★"YYYY-MM-DD"（★日本時間の きょう）
 */
export function upcomingEvents(rows, todayIso, limit) {
  const today = String(todayIso || "");
  const end = addDaysIso(today, EVENT_WINDOW_DAYS);
  const n = Number.isInteger(limit) ? limit : EVENT_SHOW_LIMIT;
  return (Array.isArray(rows) ? rows : [])
    .filter((r) => r && r.event_date && !r.withdrawn_at)
    .filter((r) => String(r.event_date) >= today && String(r.event_date) <= end)
    .sort((a, b) => String(a.event_date).localeCompare(String(b.event_date)))
    .slice(0, n);
}

/** ★"YYYY-MM-DD" に 日を 足します。★時差を またぎません。 */
export function addDaysIso(iso, days) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ""));
  if (!m) return "";
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  d.setUTCDate(d.getUTCDate() + (Number(days) || 0));
  return d.toISOString().slice(0, 10);
}

/**
 * ★行事の 1行の 日づけ。
 *
 *   ★★日づけを、★日づけの まま 出します。
 *     ★★「あと3日」と 書きません（★裁定 2026-09-15「no countdown」）。
 *       ★★この 家には、★残りを 数えて 見せる ものが 1つも ありません。
 *         ★ごほうびでも、★記録でも、★行事でも 同じ です。
 *   ★★年は 出しません。★近い ものしか 出さない から です。
 *   ★★時刻は、★入って いる ときだけ 添えます。
 *     ★`start_time` が 無い 行事が あります（★列は null を 許します）。
 */
export function eventDateLabel(row) {
  if (!row || !row.event_date) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(row.event_date));
  if (!m) return "";
  const date = Number(m[2]) + "月" + Number(m[3]) + "日";
  const t = String(row.start_time || "").slice(0, 5);
  return /^\d{2}:\d{2}$/.test(t) ? date + "　" + t : date;
}

/**
 * ★日づけが 変わった 行事か。
 *
 *   ★★`previous_date` は「前は いつ だったか」です。★繰り返しでは ありません
 *     （★2026-09-15、★本番の 列で 確かめました ── ★繰り返しの 列は ありません）。
 *   ★★変わった ことを 黙って いると、★前の 日で 覚えて いる 方が 困ります。
 */
export function eventMoved(row) {
  if (!row || !row.previous_date || !row.event_date) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(row.previous_date));
  if (!m) return "";
  return Number(m[2]) + "月" + Number(m[3]) + "日 から 変わりました";
}

/**
 * ★先生からの 連絡。
 *
 *   ★★取り消された ものは 出しません（★`withdrawn_at`）。
 *     ★★行は 残って います（★見本② ──「静かに 1行 残ります」）。
 *     ★★v1 では、★その 1行を まだ 出しません。★読むだけ の 節 だから です。
 *   ★★新しい 順。
 *   ★★★既読を 書きません（★v1）。`org_message_reads` に 触れません。
 */
export function recentMessages(rows, limit) {
  const n = Number.isInteger(limit) ? limit : MESSAGE_SHOW_LIMIT;
  return (Array.isArray(rows) ? rows : [])
    .filter((r) => r && r.body && !r.withdrawn_at)
    .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")))
    .slice(0, n);
}

// ---------------------------------------------------------------------------
// ★字（★1か所に まとめます）
// ---------------------------------------------------------------------------

export const SECTION_TITLES = Object.freeze({
  lesson: "次の レッスン",
  event: "近い 行事",
  message: "先生からの 連絡"
});

/**
 * ★行事の 節に 添える 1行（★§6-2 が 文言まで 決めて います）。
 *
 *   ★★「出欠を 集めません」── ★これは 約束 です。
 *     ★★`org_event_participants` という 表は あります。
 *       ★けれど この 節は 触れません。★知らせるだけ です。
 *     ★★見張り `classroom-shell.test.js` が、★書かない ことを 数えます。
 */
// ★★★「は」→「を」（★裁定 その120 Q2・2026-09-21）。
//   ★★「出欠は 集めません」── ★ほかは 集めるかも、と 読めます（★「は」は 対比）。
//   ★★「出欠を 集めません」── ★この 節が 集めません。★範囲が 決まります。
//   ★★★見張りで 留めて ある ものこそ、★正しく なければ なりません。
//     ★★見張りの 期待値も 同じ 回で 直して あります。
export const EVENT_NOTE = "行事の 出欠を 集めません。知らせるだけです。";

/** ★1件も 無い ときの 字。★「ありません」で 終わらせません。 */
export const EMPTY_TEXT = Object.freeze({
  lesson: "次の レッスンは、まだ 決まって いません。",
  event: "近い 行事は ありません。",
  message: "新しい 連絡は ありません。"
});

/**
 * ★教室を 1つも 持って いない 方への 字（★§6-3）。
 *
 *   ★★「入れません」と 書きません。★無料枠が あるので、★事実 です。
 */
export const NO_CLASSROOM_TEXT = "まだ 教室は ありません。先生として はじめますか";
