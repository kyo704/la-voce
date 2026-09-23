// ============================================================================
// ★★★レッスン割 ── ★決めを 持つのは この ファイル だけ です
//
//   ★出どころ  裁定139（レッスンの 割り当て）／ sql/10 ／
//              見本 `SC['レッスンの希望']`（★スマホ）・`SC['希望の地図']`（★運営）
//
//   ★★★この 家の くり返す 不具合は、★同じ 決めが 2か所に ある ことです。
//     ★「◎は 2」「押すと 次は △」「授業の コマは ×」──
//       ★★画面ごとに 書くと、★必ず どこかで ずれます。
//     ★★だから ここに 置き、★画面は **呼ぶだけ** に します。
//
//   ★★台帳と 合わせて ある もの（★本番で 読んで 確かめました・2026-09-23）
//     `lesson_prefs.level`  … 2＝◎ ／ 1＝△ ／ 0＝× ／ 行が 無い＝空
//     `lesson_prefs.slot_key` … `"<weekday>-<period_id>"`（★weekday は 数・period_id は uuid）
//       ★★`seed_prefs_from_timetable` が この 形で 入れます。★字を 変えると 合わなく なります。
//
//   ★★★「理由は うかがいません」（見本の 註）。
//     ★だから ここには 理由の 欄が ありません。★作らないで ください。
// ============================================================================

import { cellKey } from "@/lib/myTimetable";

/** ★◎△× の 数（★台帳の `level` そのもの）。 */
export const MARU = 2;
export const SANKAKU = 1;
export const BATSU = 0;

/**
 * ★押した ときの 次の 値（★見本 …「押すたびに ◎ → △ → × → 空 と 変わります」）。
 *
 *   ★★空（null / undefined）から 押すと ◎ です。★見本の 並びの 頭 です。
 *   ★★× の 次は **空** です。★× と 空を 分けます ──
 *     ★「無理だと 言った」と「まだ 答えて いない」は、★別の こと です。
 */
export function nextLevel(v) {
  if (v === MARU) return SANKAKU;
  if (v === SANKAKU) return BATSU;
  if (v === BATSU) return null;
  return MARU;
}

/** ★画面に 出す 印。★空は 何も 出しません（★見本の とおり）。 */
export function markOf(v) {
  if (v === MARU) return "◎";
  if (v === SANKAKU) return "△";
  if (v === BATSU) return "×";
  return "";
}

/** ★印の 意味（★見本の 上の 1行）。 */
export const LEVEL_WORDS = Object.freeze([
  { mark: "◎", word: "行ける" },
  { mark: "△", word: "できれば" },
  { mark: "×", word: "無理" }
]);

/**
 * ★枠の 合言葉（★台帳の `slot_key`）。
 *
 *   ★★`seed_prefs_from_timetable` が 作る 形と、★1字 も ちがえられません。
 *     ★あちらは `t.weekday::text || '-' || t.period_id::text` です。
 */
export function slotKey(weekday, periodId) {
  if (weekday === null || weekday === undefined || !periodId) return null;
  // ★★★2026-09-23 ── ★自分で 組み立てるのを やめました。
  //   ★★`lib/myTimetable.js` の `cellKey` が **同じ 形**を すでに 持って います
  //     （★"曜-コマ"）。★2か所で 同じ 決めを 持つと、★片方だけ 動きます。
  //   ★★★ここでは「空の ときは 作らない」だけ を 足します。
  //     ★`cellKey` は `"1-"` を 返します。★台帳に その 鍵は ありません。
  return cellKey(weekday, periodId);
}

/**
 * ★その 枠は 授業で 埋まって いるか（★見本 …「授業の コマは、はじめから × に しています」）。
 *
 *   ★★★授業の **名前**は 返しません。★見本の 註 ──
 *     「授業の 名前は 先生に 伝わりません」
 *   ★★だから ここでは 真偽 だけ を 返します。★名前を 受け取る 引数も 作りません。
 */
export function isClassSlot(timetable, weekday, periodId) {
  if (!Array.isArray(timetable)) return false;
  return timetable.some((t) => t
    && String(t.weekday) === String(weekday)
    && String(t.period_id) === String(periodId)
    && (t.unavailable === undefined || t.unavailable === null || t.unavailable === true));
}

/** ★いまの 値（★行が 無ければ null ＝ 空）。 */
export function levelOf(prefs, key) {
  if (!prefs || !key) return null;
  const v = prefs[key];
  return v === MARU || v === SANKAKU || v === BATSU ? v : null;
}

/** ★◎ と △ の 数（★見本 …「◎ 3　△ 5」）。 */
export function countLevels(prefs) {
  const out = { maru: 0, sankaku: 0, batsu: 0 };
  if (!prefs) return out;
  Object.keys(prefs).forEach((k) => {
    if (prefs[k] === MARU) out.maru += 1;
    else if (prefs[k] === SANKAKU) out.sankaku += 1;
    else if (prefs[k] === BATSU) out.batsu += 1;
  });
  return out;
}

// ★★★列は 名指しで 選びます（★`select('*')` を 書かない・CLAUDE.md）。
export const COLS_ROUND =
  "id, org_id, teacher_id, name, period_from, period_to, due_on, status, confirmed_at";
export const COLS_PREF = "round_id, user_id, slot_key, level, updated_at";
export const COLS_NG = "round_id, user_id, ng_on";
export const COLS_TIMETABLE = "id, weekday, period_id, unavailable";

/** ★出せる あいだ か（★しめきりの あとでも `status` が open なら 出せます）。 */
export function canEdit(round) {
  return Boolean(round) && round.status === "open";
}

/**
 * ★しめきりの 言葉。
 *
 *   ★★★残りの 日数を 数えません（★台帳 …「あと n 日」を 出さない）。
 *     ★日づけ だけ を 書きます。★急かしません。
 */
export const DUE_NOTE = "それまで 何度でも 直せます";

/** ★下の 但し書き（★見本の .note。★1字 も 足しません）。 */
export const PREFS_NOTE = Object.freeze([
  "理由は うかがいません。",
  "見るのは、担当の 先生と、日程を 組む 方だけです。ほかの 学生には 見えません。",
  "授業の コマは、はじめから × に しています。授業の 名前は 先生に 伝わりません。",
  "決まったら、きょうと 日程に 出ます。カレンダーにも 入れられます。"
]);
