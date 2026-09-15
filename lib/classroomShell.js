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
export const LESSON_COLUMNS =
  "id, scheduled_at, note, org_id, link_id, teacher_id, attendance, held";

export const EVENT_COLUMNS =
  "id, org_id, event_date, start_time, end_time, kind, title, previous_date, withdrawn_at";

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
 *   ★★終わった ものは 出しません（★`held` が 付いて いる もの）。
 *   ★★時刻の 無い 行は 出しません。★「次」が 決まらない から です。
 *   ★★1件も 無ければ null。★空の 札を 出すのは、★呼ぶ側の 仕事 です。
 *
 * @param {Array} rows   ★merge した あとの レッスン
 * @param {Date}  now    ★いま
 */
export function nextLesson(rows, now) {
  const t = now instanceof Date ? now.getTime() : Date.now();
  const future = (Array.isArray(rows) ? rows : [])
    .filter((r) => r && r.scheduled_at)
    // ★★済んだ ものは 出しません。★`held` は 実施の 記録 です。
    .filter((r) => !r.held)
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
 *   ★★「出欠は 集めません」── ★これは 約束 です。
 *     ★★`org_event_participants` という 表は あります。
 *       ★けれど この 節は 触れません。★知らせるだけ です。
 *     ★★見張り `classroom-shell.test.js` が、★書かない ことを 数えます。
 */
export const EVENT_NOTE = "行事の 出欠は 集めません。知らせるだけです。";

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
