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

/** ★いま 誰の 分を 見て いるか の 1行。 */
export function whoseWord(name) {
  return name ? `${name} 先生の 分` : "ご自分の 分";
}
