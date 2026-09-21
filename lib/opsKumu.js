// ============================================================================
// ★日程を 組む ── ★決めごと 1か所（★見本 `P_kumu`・裁定 その97 で 機能まで）
//
//   ★★★見えるのは「空いて いるか どうか」だけ です（★裁定 その98 ①）。
//     ★★授業の 名・教室・備考は 見えません。★読み道が 返しません。
//     ★★見本の 注 ──「見えるのは 空いて いるか どうかだけ」。
//
//   ★★★決めるのは 先生 です。★自動は 下書き です。
//     ★★いまは 自動を 作って いません（★下の `NOT_YET`）。
//
//   ★★行は **ご自分の コマ**（`my_periods`）です。★学校の コマは まだ ありません。
//     ★★だから 先生ごとに 行が ちがいます。★それで 正しい です ──
//       ★★その 先生が 動ける 時間の 割り方 だから です。
//
//   ★見張り components/tests/ops-kumu.test.js
// ============================================================================

export const HEAD = "日程を 組む";

/** ★曜日（★見本と 同じ 並び・日曜 はじまり）。 */
export const DAYS = Object.freeze(["日", "月", "火", "水", "木", "金", "土"]);

/** ★読み道が 返す 鍵（★「曜日-時限」）。★1か所で 作ります。 */
export function slotKey(weekday, ord) {
  return String(weekday) + "-" + String(ord);
}

/**
 * ★その 週の 日づけ（★端末の 時計の 日づけ から）。
 *
 *   ★★`todayISO` は「きょう」。★`offset` は 週の ずれ（0＝今週）。
 *   ★★返すのは 7つ の `YYYY-MM-DD` です。★日曜 はじまり です。
 */
export function weekDates(todayISO, offset) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(todayISO || ""))) return [];
  const t = new Date(todayISO + "T00:00:00Z");
  const 日 = t.getUTCDay();
  const 頭 = new Date(t.getTime() - 日 * 86400000 + (Number(offset) || 0) * 7 * 86400000);
  return Array.from({ length: 7 }, (_, i) =>
    new Date(頭.getTime() + i * 86400000).toISOString().slice(0, 10));
}

/** ★週の 言い方（★「今週」「1週 あと」）。★数だけ です。 */
export function weekWord(offset) {
  const n = Number(offset) || 0;
  if (n === 0) return "今週";
  return n > 0 ? `${n}週 あと` : `${-n}週 まえ`;
}

/** ★コマの 字（★「1限　9:00〜10:30」）。★分は lib が 直します。 */
export function periodWord(p) {
  if (!p) return "";
  const 分 = (m) => `${Math.floor(Number(m) / 60)}:${String(Number(m) % 60).padStart(2, "0")}`;
  return `${p.name || ""}　${分(p.start_min)}〜${分(p.end_min)}`;
}

/**
 * ★その マスに 来られる 方（★読み道の 答えから）。
 *
 *   ★★`slots` は `[{ user_id, slot_key, is_free }]`。
 *   ★★★書いて いない 方は、★答えに 出て きません。
 *     ★★その 方を「来られない」に しません。★「分からない」です。
 *     ★★見本 ──「空は『予定が ない』では なく『まだ 書いて いない』」。
 */
export function freeAt(slots, weekday, ord) {
  const k = slotKey(weekday, ord);
  return (slots || []).filter((s) => s && s.slot_key === k && s.is_free === true)
    .map((s) => s.user_id);
}

/** ★時間割を 書いて いる 方（★答えに 1つでも 出て くる 方）。 */
export function whoWrote(slots) {
  return [...new Set((slots || []).map((s) => s && s.user_id).filter(Boolean))];
}

/**
 * ★その マスに 置いて ある レッスン（★その 週の 日づけで 見ます）。
 *
 *   ★★`lessons` は `scheduled_at` を 持つ 行。
 *   ★★`dateISO` は その マスの 日づけ、★`startMin` は コマの はじまり。
 */
export function placedAt(lessons, dateISO, startMin, timeOfMin) {
  return (lessons || []).filter((l) => {
    if (!l || !l.scheduled_at) return false;
    if (String(l.scheduled_at).slice(0, 10) !== dateISO) return false;
    const m = timeOfMin ? timeOfMin(l.scheduled_at) : null;
    return m === null ? true : m === Number(startMin);
  });
}

/** ★置いた 方（★門下の うち、★その 週に 置いて ある 方）。 */
export function placedStudents(lessons) {
  return [...new Set((lessons || []).map((l) => l && l.student_id).filter(Boolean))];
}

/** ★数の 言い方。★0なら 出しません（★見本は「—」）。 */
export function countWord(n) {
  return Number(n) > 0 ? `${Number(n)}人` : "—";
}

export const NOTES = Object.freeze([
  "決めるのは 先生です。押した あと、いくらでも 直せます。",
  "見えるのは 空いて いるか どうかだけで、授業の 名前・教室・備考は 見えません。",
  "「本番が 近い」の 印は 出しません。",
  "部屋の 予約は しません。"
]);

/** ★時間割を 書いて いない 方への 1行（★催促 しません）。 */
export const NOT_WRITTEN_LINE =
  "時間割を 書いて いない 方は、ここに 出ません。書くように お願いは しません。";

/**
 * ★まだ 作って いない もの（★名ざしで 出します。★押せる 札に しません）。
 */
export const NOT_YET = Object.freeze([
  { key: "auto", label: "全部 自動で 振り分ける",
    needs: "自動の 条件を しまう ところ（見本 `P_autoSet`）" },
  { key: "publish", label: "公開する",
    needs: "生徒に 1回だけ 知らせる 道（いまは 置いた その場で 見えます）" },
  { key: "mine", label: "自分の 予定（レッスン いがい）",
    needs: "先生ご自身の 予定の 表" },
  { key: "temp", label: "臨時（この週だけ）",
    needs: "毎週 と この週だけ を 分けて しまう ところ" }
]);


// ---------------------------------------------------------------------------
// ★誰の 分を 組むか（★裁定 その99 F1・2026-09-19）
// ---------------------------------------------------------------------------
//   ★★★学長・事務長に、★ご自分の 門下は ありません。★それで 正しい です。
//     ★★けれど「組む」のは 運営の 仕事 です。★門下の 有無と 関わりません。
//   ★★★`sched_all` を 持つ 方は、★**先生を 選んで から** 組みます。
//     ★★`sched_mine` だけ の 方は、★ご自分の 分 です。★選ぶ 画面を 出しません。

// ----------------------------------------------------------------------------
// ★入れられる 枠（★見本 `P_okeru`・裁定 その108・2026-09-20）
// ----------------------------------------------------------------------------
//   ★★★表を 作りません（★裁定 その108）。★その場で 数えます。
//     ★★空き枠は「授業が 入って いない 時間」です。★もとから 計算で 出ます。
//     ★★表に しまうと、★二重に 持つ ことに なります。
//
//   ★★★3つ とも 満たす 枠 だけ を 出します ──
//     ①その方が **来られる**（★`get_student_free_slots` が true）
//     ②まだ **空いて いる**（★その 週に レッスンが 置かれて いない）
//     ③先生の 予定が **入って いない**（★先生 ご自分の 時間割）
//   ★★★見本の 断り ──「あなたの 予定が 入って いる 枠は 出しません」
//     「その 生徒が 来られない 枠も 出しません」

export const OKERU_HEAD_SUB = "入れられる 枠";
export const OKERU_NOTE =
  "この方が 来られて、まだ 空いて いる 枠です。押すと、そこに 入ります。";
export const OKERU_EMPTY = "入れられる 枠が ありません。";
export const OKERU_EMPTY_HOW = "自分の 予定を 外すか、コマを 足すと 増えます。";
export const OKERU_NOTES = Object.freeze([
  "あなたの 予定が 入って いる 枠は 出しません。",
  "その 生徒が 来られない 枠も 出しません。"
]);
export const OKERU_PUT = "ここに 入れる";

/** ★押す 前の 確かめ（★押しまちがいが 相手にも 及ぶ ため・裁定 その108）。 */
export function putAsk({ dateISO, period }) {
  const 日 = String(dateISO || "").slice(5).replace("-", "月") + "日";
  return `${日}　${(period && period.name) || ""}に 入れます。`;
}
export const PUT_ASK_NOTE = "相手の 予定にも 入ります。よろしければ 押して ください。";

/**
 * ★入れられる 枠を 数えます（★表を 使いません）。
 *
 *   ★★`days` …… その 週の 日づけ（★`weekDates` の 返し）
 *   ★★`periods` …… 先生の コマ（★`get_teacher_periods` の 返し）
 *   ★★`freeSlots` …… `get_student_free_slots` の 返し（★その 学生の ぶん）
 *   ★★`lessons` …… その 週の レッスン（★その 先生の ぶん）
 *   ★★`busy` …… 先生 ご自分の 時間割（★`my_timetable` の 行）
 *
 *   ★★★`freeSlots` が 空の ときは、★1つも 返しません。
 *     ★★「書いて いない」を「いつでも 来られる」に しません。
 */
//   ★★★`periods` には 番号（`id`）が 要ります（★2026-09-20）。
//     ★★`busy` の 鍵は `my_periods.id` です。★番号が 無いと 1度も 一致しません。
//     ★★`get_teacher_periods` は 2026-09-20 から 番号も 返します。
//   ★★★まだ 守れて いない ところ（★台帳 08-28）。
//     ★★事務が **よその 先生** の 分を 組む とき、★`busy` は
//       ★★事務 ご自身の 予定 です（`get_my_busy_slots` は auth.uid() です）。
//     ★★その 先生の 予定は、★どこからも 読めません（★わざと です）。
//     ★★★だから その ときだけ、★この 決めは はたらきません。
//       ★★引き金 ── ★よその 先生の ふさがりを 読む 道を 作る と 決めた 日。
export function openSlots({ days, periods, studentId, freeSlots, lessons, busy, timeOfMin }) {
  const 出 = [];
  const 空 = new Set((freeSlots || [])
    .filter((s) => s && s.is_free === true && String(s.user_id) === String(studentId))
    .map((s) => String(s.slot_key)));
  const 先生の予定 = new Set((busy || [])
    .filter((b) => b && b.unavailable !== false)
    .map((b) => `${b.weekday}-${b.period_id}`));

  (days || []).forEach((日, di) => {
    (periods || []).forEach((p) => {
      if (!空.has(slotKey(di, p.ord))) return;
      if (先生の予定.has(`${di}-${p.id}`)) return;
      const 置 = placedAt(lessons, 日, p.start_min, timeOfMin);
      if (置.length > 0) return;
      出.push({ dateISO: 日, weekday: di, period: p });
    });
  });
  return 出;
}

export const PICK_TEACHER_HEAD = "どの 先生の 分を 組みますか";
export const PICK_TEACHER_SUB = "選ぶと、その 先生の コマと 門下が 出ます。";
export const PICK_TEACHER_EMPTY = "受け持ちの ある 先生が いません。";
export const PICK_TEACHER_EMPTY_HOW = "名簿で 担当を 決めると、ここに 出ます。";

/** ★選ぶ 画面を 出すか（★決めは ここ 1か所）。 */
export function needsTeacherPick(perms) {
  const s = perms instanceof Set ? perms
    : new Set(Array.isArray(perms) ? perms.filter(Boolean)
      : (perms && typeof perms === "object"
        ? Object.keys(perms).filter((k) => perms[k] === true) : []));
  return s.has("sched_all");
}

/**
 * ★受け持ちの ある 先生（★渡された 順の まま）。
 *
 *   ★★`assignments` から 作ります。★新しい 表を 作りません。
 *   ★★終わった 受け持ちは 出しません。
 */
export function teachersWithMonka(assignments) {
  const 出 = [];
  (assignments || []).forEach((a) => {
    if (!a || a.ended_at || !a.teacher_id) return;
    if (!出.includes(a.teacher_id)) 出.push(a.teacher_id);
  });
  return 出;
}

/** ★その 先生の 門下（★渡された 順の まま）。 */
export function monkaOf(assignments, teacherId) {
  const 出 = [];
  (assignments || []).forEach((a) => {
    if (!a || a.ended_at || a.teacher_id !== teacherId) return;
    if (!出.includes(a.student_id)) 出.push(a.student_id);
  });
  return 出;
}

// ---------------------------------------------------------------------------
// ★やり直す（★裁定 その142・2026-09-21）
// ---------------------------------------------------------------------------
//   ★★★その 週に 置いた ものを、★まとめて 外します。★1つずつ 外すのと
//     ★同じ こと を、★一度に します。★新しい 力では ありません。
//   ★★★出した あと は 出しません ── ★生徒が もう 見て います。
//     ★★いまは「出す」が まだ ありません（★上の `NOT_YET` の `publish`）。
//       ★★だから いまは いつでも 出ます。★門は 先に 置きます。
//       ★★★`publish` を 作る 日に、★`published` を 渡して ください。
//         ★★この 1行が、★その とき の 引き金 です。
//   ★★★たずねてから 外します。★戻せません。

export const REDO_LABEL = "やり直す";
export const REDO_ASK = "この 週に 置いた ものを、ぜんぶ 外しますか。";
export const REDO_NOTE = "外すのは この 週 だけ です。ほかの 週は そのままです。";
export const REDO_DONE_NONE = "この 週には、まだ 何も 置いて いません。";

/**
 * ★やり直せるか。
 *
 *   ★★出した あとは できません。★生徒が もう 見て います。
 *   ★★置いた ものが 無ければ、★外す ものが ありません。
 */
export function mayRedo({ published = false, placedCount = 0 } = {}) {
  if (published) return false;
  return placedCount > 0;
}

// ---------------------------------------------------------------------------
// ★自分の 予定だけ 全部 外す（★裁定 その142・2026-09-21）
// ---------------------------------------------------------------------------
//   ★★★外すのは **ご自分の** 「来られない」の 印 だけ です。
//     ★★よその 先生の 予定に 触れません。★台帳の 道が `auth.uid()` に
//       ★縛って います（`supabase/migration_clear_my_busy_slots.sql`）。
//   ★★★コマそのもの は 消しません。★時間割は 残ります。
//   ★★★「やり直す」とは 別の もの です ──
//     ★やり直す …… ★置いた **レッスン** を 外す
//     ★これ ……… ★ご自分の **来られない 印** を 外す
//     ★★混ぜると、★どちらを 押したのか 分からなく なります。
//   ★★★たずねてから 外します。★戻せません。

// ---------------------------------------------------------------------------
// ★「名前を覚える」は **作りません**（★裁定 その142・2026-09-21）
// ---------------------------------------------------------------------------
//   ★★見本に 札が あります。★実機には 置きません。★迷いでは ありません。
//   ★★★「一度 使った 名前を 自動で 候補に する」── ★これが 要らない もの です。
//     ★★次に 置く 人を、★前に 置いた ことで 先に 出す ── ★それは
//       ★★こちらが 順番を 決める こと に なります。★決めるのは 先生 です。
//   ★★★`NOT_YET` に 入れません。★`NOT_YET` は「まだ」です。★これは「しない」です。
//     ★★混ぜると、★いつか 作る もの に 見えます。
//   ★★★足したく なったら、★まず 裁定 その142 を 読み直して ください。

export const CLEAR_BUSY_LABEL = "自分の予定だけ 全部外す";
export const CLEAR_BUSY_ASK = "ご自分の「来られない」の 印を、ぜんぶ 外しますか。";
export const CLEAR_BUSY_NOTE =
  "外れるのは ご自分の 印 だけ です。ほかの 方の 予定は 変わりません。"
  + "コマ（時間割）は 消えません。";
export const CLEAR_BUSY_FAILED = "いま 外せませんでした。";

/** ★いま 誰の 分を 見て いるか の 1行。 */
export function whoseWord(name) {
  return name ? `${name} 先生の 分` : "ご自分の 分";
}
