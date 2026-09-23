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
/**
 * ★地図の 下の 但し書き（★見本の .note。★1字 も 足しません）。
 *
 *   ★★★3行 とも 約束 です ──
 *     ① 色は 1色の 濃さだけ（★信号の 色を 使いません ── ★台帳の「信号色を 出さない」）
 *     ② すでに 置いた方は、ほかの コマの 名前から 消えます
 *     ③ ◎の 多い方から 順に 並べる ことは しません（★順位を 作らない）
 *   ★★★③が いちばん 大事 です。★並べ替えると、★上に 出た 方が 先に 置かれます。
 */
export const MAP_NOTE_LINES = Object.freeze([
  "色は 1色の 濃さだけです（信号の 色は 使いません）。",
  "すでに 置いた方は、ほかの コマの 名前から 消えます。",
  "◎の 多い方から 順に 並べることは しません。置くのは 先生です。"
]);

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

// ============================================================================
// ★★★置ける 枠（★見本 `P_okeru`）── 2026-09-23
//
//   ★出どころ woolsong-2026-09-21_24（docs/opus/pack-2026-09-21_24）
//     ／ 00-動く見本-PC・iPad（運営）.html（md5 c19ce4d1）
//
//   ★★見本の しぼり方を、★そのまま 写します ──
//       if (isFree(i,K) && !PLACED[K] && !TBUSY[K]) ok.push(K)
//     ★① その方が **来られる**（◎ か △）
//     ★② まだ 誰も **置いて いない**
//     ★③ 先生の 予定が **入って いない**
//
//   ★★★3つ とも 満たす 枠 **だけ** を 出します。
//     ★見本の 但し書き …「あなたの 予定が 入っている 枠は 出しません」
//       　　　　　　　　「その 生徒が 来られない 枠も 出しません」
//     ★★出して から 押せなく する、では ありません。★はじめから 出しません。
//       ★押せない ものが 並ぶ 画面は、★不具合に 見えます。
// ============================================================================

/** ★その方が 来られる 枠か（◎ か △）。★× と 空は 来られません。 */
export function canCome(prefs, key) {
  const v = levelOf(prefs, key);
  return v === MARU || v === SANKAKU;
}

/**
 * ★置ける 枠を 並べます（★見本と 同じ 順 ── ★曜日の 外、コマの 内）。
 *
 * @param {object} p
 * @param {object} p.prefs   ★その方の 希望（★鍵 → 値）
 * @param {object} p.placed  ★もう 置いた 枠（★鍵 → 何か）
 * @param {object} p.busy    ★先生の 予定（★鍵 → 何か）
 * @param {Array}  p.periods ★コマ
 * @param {number} p.days    ★曜日の 数
 * @returns {Array<{key:string, weekday:number, period:object}>}
 */
export function placeableSlots({ prefs, placed, busy, periods, days, round } = {}) {
  const コマ = Array.isArray(periods) ? periods : [];
  const 日 = Number(days) || 0;
  const 置 = placed && typeof placed === "object" ? placed : {};
  const 塞 = busy && typeof busy === "object" ? busy : {};
  const 出 = [];
  for (let di = 0; di < 日; di += 1) {
    コマ.forEach((p) => {
      const k = slotKey(di, p.id);
      if (!canCome(prefs, k)) return;
      if (置[k]) return;
      if (塞[k]) return;
      // ★★★`OpsOkeru`（★前から ある 画面）が 受け取る 形に 合わせます。
      //   ★`dateISO` …… その 枠に あたる 回の 中の はじめの 日
      //   ★`weekday` …… 0 から（★`DAYS` と 同じ）
      //   ★★2026-09-24、★同じ 見本（`P_okeru`）の 画面を 2つ 作って いた ことに
      //     ★気づきました。★こちらの 決めを、★あちらの 画面に 渡します。
      出.push({ key: k, weekday: di, period: p, dateISO: null });
    });
  }
  // ★★日づけを 入れます（★`round` が 渡されて いる ときだけ）。
  //   ★★★日を 決めるのは `firstDateFor` です。★ここで 数えません。
  if (round) {
    出.forEach((x) => {
      const d = firstDateFor(x.key, round, コマ);
      x.dateISO = d ? String(d).slice(0, 10) : null;
    });
    return 出.filter((x) => x.dateISO);
  }
  return 出;
}

/** ★置ける 枠の 画面の 言葉（★見本の まま。★1字 も 足しません）。 */
export const OKERU_NOTE = "この方が 来られて、まだ 空いている 枠です。押すと、そこに 入ります。";
export const OKERU_EMPTY_HEAD = "入れられる 枠が ありません。";
export const OKERU_EMPTY_HOW = "自分の 予定を 外すか、コマを 足すと 増えます。";
export const OKERU_FOOT = Object.freeze([
  "あなたの 予定が 入っている 枠は 出しません。（そこには レッスンを 入れられません）",
  "その 生徒が 来られない 枠も 出しません。"
]);

// ============================================================================
// ★★★機能の 鍵 ── ★字を 2か所に 書かない
//
//   ★★裁定176 §1 …「判定は 1か所: feature_on(鍵)」。
//     ★★鍵の **字** も 同じ です。★画面ごとに "lesson_rounds" と 打つと、
//       ★打ちまちがいが **開いて しまう** 側に 倒れます（★無い 鍵は false ＝ 閉じる）。
//       ★★閉じる 側に 倒れる なら まだ 良い ── ★けれど 気づけません。
// ============================================================================
export const LESSON_ROUND_KEY = "lesson_rounds";

// ============================================================================
// ★★★枠 ⇄ 日づけ ── 2026-09-23
//
//   ★★★`lessons` に 枠の 鍵を しまう 列は **ありません**。
//     ★`place_id` は **部屋** です（org_places への 縁）。★枠では ありません。
//     ★★だから「置く」は、★その 枠に あたる **実際の 日と 時こく** を 作る ことです。
//
//   ★★★どの 日に するか ── ★裁定139 に 書いて ありません。
//     ★ここでは **回の はじめから 数えて、★はじめに 当たる 日** 1回 だけ に します。
//     ★★毎週 くり返す 形には しません ── ★書いて いない ことを 勝手に 増やしません。
//     ★★★これは 決め打ち です。★裁定が 出たら ここ **だけ** を 直します。
//       ★画面には 書きません。★`docs/ledgers/08-保留している決め.md` に 載せます。
//
//   ★★時こくは 日本の 時間で 組み立てます（★台帳の ほかの 決めと 同じ）。
// ============================================================================

/** ★分 → "09:00"。 */
function 時(min) {
  const m = Number(min) || 0;
  return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
}

/**
 * ★その 枠に あたる、★回の 中で いちばん はじめの 日。
 *
 * @returns {string|null} ★"2026-10-05T09:00:00+09:00"
 */
export function firstDateFor(key, round, periods) {
  if (!key || !round || !round.period_from || !round.period_to) return null;
  const [wdS, pidS] = String(key).split("-");
  const wd = Number(wdS);
  if (!Number.isInteger(wd)) return null;
  const p = (Array.isArray(periods) ? periods : []).find((x) => String(x.id) === pidS);
  if (!p) return null;
  const 終 = new Date(round.period_to + "T00:00:00Z");
  const d = new Date(round.period_from + "T00:00:00Z");
  // ★★`DAYS` は 月曜 はじまり（0＝月）。★`getUTCDay()` は 日曜 はじまり（0＝日）。
  //   ★★★ここで 1度 だけ 合わせます。★2か所で ずらすと、また ずれます。
  for (let i = 0; i < 400 && d <= 終; i += 1) {
    if ((d.getUTCDay() + 6) % 7 === wd) {
      return d.toISOString().slice(0, 10) + "T" + 時(p.start_min) + ":00+09:00";
    }
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return null;
}

/**
 * ★置いた レッスン → ★枠の 鍵。
 *
 *   ★★始まりの 時こく が いちばん 近い コマ を 選びます。
 *   ★★読めなければ null。★勝手に いちばん はじめの コマに しません。
 */
export function slotOfLesson(scheduledAt, periods) {
  if (!scheduledAt) return null;
  const d = new Date(scheduledAt);
  if (Number.isNaN(d.getTime())) return null;
  // ★★日本の 時間で 見ます（★台帳は どの 国の 時計でも 同じ 瞬間を 持って います）。
  const 日 = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const wd = (日.getUTCDay() + 6) % 7;
  const 分 = 日.getUTCHours() * 60 + 日.getUTCMinutes();
  let 近 = null, 差 = Infinity;
  (Array.isArray(periods) ? periods : []).forEach((p) => {
    const e = Math.abs((Number(p.start_min) || 0) - 分);
    if (e < 差) { 差 = e; 近 = p; }
  });
  if (!近 || 差 > 60) return null;
  return slotKey(wd, 近.id);
}
