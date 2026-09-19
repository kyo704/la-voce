// ============================================================================
// ★門下の ひと 1人（★見本 `P_monkaHito`）── ★決めごと 1か所
//
//   ★出どころ docs/opus/visual-*/pack/00-動く見本-PC・iPad（運営）.html `P_monkaHito`
//            docs/opus/visual-*/pack/ruling-90-attendance-count.md（★数え方）
//
//   ★★★この 画面が 答える のは 3つ だけ です ──
//     ①何回 出席したか（★回数 だけ。★率は 出しません）
//     ②いつ 来られるか（★空いて いるか どうか だけ。★中身は 見ません）
//     ③何が 見えないか（★見えない ことを、★隠さずに 書きます）
//
//   ★★★数え方は `lib/attendanceCount.js` が 持ちます。★ここで 数えません。
//     ★★同じ 決めを 2か所に 置きません。
//
//   ★★★「本番が 近い」を 出しません（★見本の 但し書き）。
//     ★★先生が 知らない 本番を、★生徒が 書けなく なります。
//   ★★★来られない 理由を 聞きません。★空いて いるか どうか だけ を 見ます。
//
//   ★見張り components/tests/ops-monka-hito.test.js
// ============================================================================

import { cameCount, heldCount, looksShort, progressWord, SHORT_WORD, NO_RATE_LINE }
  from "@/lib/attendanceCount";
import { lessonsOfStudent } from "@/lib/opsMonka";
// ★★鍵の 作り方は 1か所（★`lib/opsKumu.js`）。★ここで 組み直しません。
import { slotKey } from "@/lib/opsKumu";

export const BACK_LABEL = "門下";
export const ATT_HEAD = "出席";
export const FREE_HEAD = "来られる 時間";
export const CANNOT_HEAD = "見られない もの";

/** ★出席の 数が まだ 無い とき の 字（★作り物を 出しません）。 */
export const NO_COUNT = "—";
export const COUNT_UNIT = "回 出席";

/** ★空いて いる ところ ／ そうでない ところ の 字。 */
export const FREE_WORD = "来られる";
export const BUSY_WORD = "—";

export const FREE_NOTE =
  "何の 授業かは 分かりません。空いて いるか どうかだけです。";

/** ★率は 出しません（★裁定 その90 §4）。★字は あちらが 持ちます。 */
export const RATE_NOTE = NO_RATE_LINE;

/**
 * ★出席の 1枚ぶん。
 *
 *   ★★`型` …… ★授業の 型（`lesson_presets` の 1行）。★無ければ 分母を 出しません。
 *   ★★`行われた` …… ★門下 ぜんぶの 進み（★呼ぶ 側が 数えます・★裁定 その90 §2）。
 */
export function attendanceBlock(lessons, teacherId, studentId, 型, 行われた) {
  const みな = lessonsOfStudent(lessons, teacherId, studentId);
  const 出た = cameCount(みな);
  const 済 = heldCount(みな);
  const total = 型 && Number(型.total_count) > 0 ? Number(型.total_count) : null;
  const need = 型 && Number(型.need_count) > 0 ? Number(型.need_count) : null;
  return {
    name: (型 && 型.name) || "",
    came: 済 === 0 && 出た === 0 ? null : 出た,
    heldWord: progressWord(行われた == null ? 済 : 行われた, total),
    short: looksShort({ came: 出た, held: 行われた == null ? 済 : 行われた, total, need })
      ? SHORT_WORD : ""
  };
}

/**
 * ★来られる 時間の 表。
 *
 *   ★★`空き` …… ★`get_student_free_slots` が 返した 並び。
 *     ★★中身は 来ません。★曜日と コマと、★空いて いるか どうか だけ です。
 *   ★★★読めない ときは、★空の 表を 出しません。★`null` を 返します。
 *     ★★「空いて いない」と「読めて いない」を、★同じ 顔に しません。
 */
export function freeGrid(空き, studentId, 曜日, コマ) {
  if (!Array.isArray(空き)) return null;
  const 自分 = 空き.filter((s) => String(s.user_id) === String(studentId));
  if (自分.length === 0) return null;
  // ★★★鍵は `slot_key`（`"1-3"` ＝ 曜日-コマの 順）です。
  //   ★★台帳の 読み道が その 形で 返します（★`migration_free_slots_bulk.sql`）。
  //   ★★こちらで 組み直しません。★同じ 鍵を 2か所で 作らない ため です。
  const 表 = new Set(自分.filter((s) => s.is_free).map((s) => String(s.slot_key)));
  return (コマ || []).map((k) => ({
    period: k,
    cells: (曜日 || []).map((_, di) => 表.has(slotKey(di, k.ord)))
  }));
}

/** ★空いて いる コマの 数（★表が 読めなければ `null`）。 */
export function freeCount(表) {
  if (!表) return null;
  return 表.reduce((n, r) => n + r.cells.filter(Boolean).length, 0);
}

/**
 * ★見られない もの（★見本の 6行）。
 *
 *   ★★★隠しません。★「見えません」と 書きます。
 *     ★★書いて あれば、★生徒に「見られて いる かも」と 思わせずに 済みます。
 *   ★★字は「画面が ありません」── ★権限の 話に しません。
 *     ★★★そもそも 道が ありません。★作れば 見える、では ありません。
 */
export const CANNOT_SEE = Object.freeze([
  "声の 記録", "からだの 記録", "ノート",
  "授業の 名前・教室・備考", "本番の 予定", "来られない 理由"
]);
export const CANNOT_WORD = "画面が ありません";

/** ★右の 1枚（★学年・時間割・空き・枠）。 */
export const SIDE_LABELS = Object.freeze({
  grade: "学年",
  timetable: "時間割",
  free: "空いて いる コマ",
  slot: "レッスンの 枠"
});

/**
 * ★時間割が 出て いるか。
 *
 *   ★★★分かりません（★台帳 08-11）。★空きの 数からは 分けられません ──
 *     ★★1つも 決めて いない 方も 空き 0、★ぜんぶ 埋まった 方も 空き 0 です。
 *   ★★だから「分かりません」と 出します。★「まだ」と 言い切りません。
 */
export const TIMETABLE_UNKNOWN = "分かりません";

/** ★枠は まだ しまえません（★`lesson_slots` が ありません・★お決め D71 の D）。 */
export const SLOT_NOT_YET = "まだ できません。枠を しまう ところが ありません。";

export const NOTES = Object.freeze([
  "「本番が 近い」は 出しません。先生が 知らない 本番を、生徒が 書けなく なります。",
  "来られない 理由は 聞きません。空いて いるか どうかだけを 見ます。"
]);
