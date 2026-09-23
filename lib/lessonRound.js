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

// ---------------------------------------------------------------------------
// ★★★希望の 地図（★先生・事務）── ★見本 `P_wariMap`
//   ★出どころ woolsong-2026-09-21_7.zip ／ 00-動く見本-PC・iPad（運営）.html（md5 29e1d658）
//   ★★2026-09-23 に 展開・`docs/design/pack-final/` に 入れました。
// ---------------------------------------------------------------------------

/**
 * ★その 枠の 重み。★見本 …… `q[0].length*2 + q[1].length`
 *
 *   ★★◎ を 2、★△ を 1 と 数えます。★★人数では ありません。
 *   ★★★これは「★行ける 方が どれだけ いるか」の 濃さ です。
 *     ★良し悪しでは ありません。★順位でも ありません。
 */
export function prefWeight(maru, sankaku) {
  const m = Number(maru) || 0;
  const s = Number(sankaku) || 0;
  return m * 2 + s;
}

/**
 * ★濃さ（％）。★見本 …… `Math.round(v / max * 62)`
 *
 *   ★★62 までです。★真っ黒に しません。★字が 読めなく なります。
 *   ★★`max` が 0 の ときは 0 です（★割りません）。
 */
export function densityPercent(weight, max) {
  const w = Number(weight) || 0;
  const M = Number(max) || 0;
  if (M <= 0) return 0;
  return Math.round((w / M) * 62);
}

/** ★字を 白に するか（★見本 …… `pc > 38`）。 */
export function isDarkCell(pc) {
  return (Number(pc) || 0) > 38;
}

/** ★地図に 出す 字（★見本の .sub）。 */
export const MAP_NOTE = "◎ 行ける　△ できれば　／　濃いほど、行ける方が 多い";

/**
 * ★★★押す 前は、★名前を 出しません（★実行ルートの 決め）。
 *   「★学生の 名前は 地図に 出さない（★押したときだけ）」
 *   ★★地図は「いつ 空いて いるか」を 見る もの です。
 *     ★誰が いつ 空いて いるかを、★一覧で 見せる もの では ありません。
 */
export const MAP_EMPTY_HEAD = "コマを 押してください。";
export const MAP_EMPTY_HOW = "そこに 来られる方の 名前が 出ます。";

/** ★地図の 1マスの 字（★見本 …… `'◎ '+q[0].length+'　△ '+q[1].length`）。 */
export function cellWord(maru, sankaku) {
  const m = Number(maru) || 0;
  const s = Number(sankaku) || 0;
  if (m === 0 && s === 0) return "—";
  return "◎ " + m + "　△ " + s;
}

// ---------------------------------------------------------------------------
// ★★★確定して 配る（★先生・事務）── ★見本 `P_wariDone`
//   ★出どころ woolsong-2026-09-21_7.zip ／ 00-動く見本-PC・iPad（運営）.html（md5 29e1d658）
//   ★★2026-09-23 に 展開・`docs/design/pack-final/` に 反映。
// ---------------------------------------------------------------------------

/** ★届く ところ（★見本の 字。★1字も 変えません）。 */
export const DONE_REACH = "学生の きょう・日程・カレンダー";

/**
 * ★確定の 前に お見せする 字（★見本の askShow）。
 *
 *   ★★★「置けていない 方が いても、★確定できます」──
 *     ★これが この 画面の 芯 です。★全員 揃うまで 止めません。
 *     ★★止めると、★1人の ために 皆が 待ちます。
 */
export function confirmLines(placed) {
  const n = Number(placed) || 0;
  return Object.freeze([
    "置いた " + n + "人に、レッスンが 届きます。",
    "置けていない方は、あとから 置けます。",
    "確定したあと 動かしても、カレンダーに そのまま 反映されます。"
  ]);
}

/** ★下の 但し書き（★見本の .note）。★1字も 足しません。 */
export const DONE_NOTE = Object.freeze([
  "お知らせは 送りません。学生が 開いたときに 見えます。",
  "置けていない方が いても、確定できます。"
]);

/** ★確定した あとの 1行。 */
export const DONE_AFTER = "確定しました。";
export const DONE_AFTER_HOW = "学生は、それぞれ 自分の カレンダーの 住所を 持っています。";

/**
 * ★確定して よいか。
 *
 *   ★★★「置けていない 方が いても よい」ので、★人数では 止めません。
 *     ★止めるのは 1つ だけ ── ★もう 確定して いる とき。
 *   ★★`canEdit` と 逆 です。★`open` の あいだ だけ 確定できます。
 */
export function canConfirm(round) {
  return Boolean(round) && round.status === "open";
}

/** ★置いた 人 と まだの 人（★数えるのは ここ です）。 */
export function placedCount(placed, total) {
  const p = placed && typeof placed === "object" ? Object.keys(placed).length : 0;
  const t = Number(total) || 0;
  return { placed: p, total: t, left: Math.max(0, t - p) };
}
