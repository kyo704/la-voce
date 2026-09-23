// ============================================================================
// ★★★回を 始める ── ★決めを 持つのは この ファイル だけ です
//
//   ★出どころ  裁定185（回を 始める 画面）／ sql/69（同じ 先生に 開いて いる 回は 1つ）
//     ／ 見本 `SC['回を始める']`
//        woolsong-2026-09-21_1.zip ／ 00-動く見本-PC・iPad（運営）.html（md5 0132714e）
//        ★2026-09-24 に 確かめ
//
//   ★★★日づけは ここで **決めません**（★見本の 註）──
//     「日付は ここでは 決めません。学生の『出られない日』を
//       集める前に 決めたら、集める意味が ありません。」
//     ★★だから 曜日・時こくは **目安** です。★実際の 日は 確定の ときに 決まります。
//
//   ★★★止める のは 台帳 です（`start_lesson_round`）。
//     ★ここは 同じ 3つを 見て、★先に **読める 言葉** で お伝えする だけ です。
//     ★★2か所で 止めます。★画面が 抜けても 台帳が 止めます。
//
//   ★★★お知らせは 送りません。★催促も しません（★台帳の 決め）。
// ============================================================================

/** ★置き方（★見本の 2つ）。 */
export const MODES = Object.freeze([
  { key: "weekly", label: "毎週 同じ 曜日・時刻", hint: "学期の レッスンは ほとんど これです" },
  { key: "each", label: "1回ずつ 置く", hint: "不定期・隔週・本番の前だけ 詰める" }
]);
export const DEFAULT_MODE = "weekly";

/** ★回数の 型（★見本の 札）。★打ち込みも できます。 */
export const COUNT_PRESETS = Object.freeze([
  { n: 30, label: "年間 30回" },
  { n: 12, label: "前期 12回" },
  { n: 8, label: "月2回 8回" }
]);

/** ★回数の かぎり（★台帳の `start_lesson_round` と 同じ）。 */
export const MIN_COUNT = 1;
export const MAX_COUNT = 60;

/** ★曜日の 札（★`lib/myTimetable.js` の `DAYS` と 同じ 並び・★0 から）。 */
export const WEEKDAYS = Object.freeze(["月", "火", "水", "木", "金", "土"]);

/** ★締切の 既定（★期間の はじまりでは なく、★いまから 2週間後）。 */
export function defaultDue(today) {
  const d = new Date(String(today || "") + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return "";
  d.setUTCDate(d.getUTCDate() + 14);
  return d.toISOString().slice(0, 10);
}

/**
 * ★形が 正しいか。★正しく なければ **読める 言葉** を 返します。
 *
 *   ★★★台帳の `start_lesson_round` と 同じ 3つ です ──
 *     `DUE_AFTER_START` ／ `BAD_PERIOD` ／ `BAD_COUNT`
 *   ★★★字も 見本の まま です。★台帳の 字を 画面に 出しません。
 */
export function checkForm({ from, to, due, count } = {}) {
  if (!from || !to || !due) return "期間と 締切を 入れて ください";
  if (String(due) >= String(from)) return "締切は、期間の はじまりより 前に してください";
  if (String(to) <= String(from)) return "期間の 終わりが、はじまりより 前です";
  const n = Number(count);
  if (!(n >= MIN_COUNT && n <= MAX_COUNT)) return "回数は 1〜60 の あいだで";
  return "";
}

/** ★始められるか（★形が 正しく、★先生が 1人 以上）。 */
export function canStart({ teachers, from, to, due, count } = {}) {
  if (!Array.isArray(teachers) || teachers.length === 0) return false;
  return checkForm({ from, to, due, count }) === "";
}

/**
 * ★台帳が 返した わけを、★読める 言葉に します。
 *
 *   ★★`start_lesson_rounds`（まとめて）は、★止まった 人 だけ `skipped` に 入れます。
 *     ★★★ほかの 先生は 始まって います。★「ぜんぶ 失敗」では ありません。
 */
export function skipReason(skipped) {
  const s = String(skipped || "");
  if (s.includes("ALREADY_OPEN")) return "開いている 回が あります。先に 確定して ください";
  if (s.includes("DUE_AFTER_START")) return "締切は、期間の はじまりより 前に してください";
  if (s.includes("BAD_PERIOD")) return "期間の 終わりが、はじまりより 前です";
  if (s.includes("BAD_COUNT")) return "回数は 1〜60 の あいだで";
  if (s.includes("NOT_ALLOWED")) return "この 先生の 回を 始められません";
  return "始められませんでした";
}

/** ★始めた あとの 数（★始まった／止まった）。 */
export function startResult(rows) {
  const 並 = Array.isArray(rows) ? rows : [];
  const 始 = 並.filter((r) => r && r.round_id);
  const 止 = 並.filter((r) => r && !r.round_id);
  return { started: 始.length, skipped: 止.length, skippedRows: 止 };
}

/** ★見本の 言葉（★1字 も 足しません）。 */
export const RS_HEAD = "回を 始める";
export const RS_SUB = "希望を 集めて、レッスンを 置く 1回ぶんの まとまりです";
export const RS_OPEN_WARN = "この先生には、開いている 回が あります。先に 確定するか、閉じてください。";
export const RS_DECIDE_HEAD = "決めること";
export const RS_WHOSE = "だれの 回";
export const RS_ALL = "ぜんぶ";
export const RS_WHOSE_NOTE_1 = "いくつでも 選べます";
export const RS_WHOSE_NOTE_2 = "期間・締切・回数は 同じで、先生ごとに 回が 1つずつ できます。";
export const RS_WHOSE_NOTE_3 = "回数が 先生で 違うときは、始めたあと 一覧で 直せます。";
export const RS_NAME = "名前";
export const RS_NAME_EX = "れい：2026年度 後期";
export const RS_PERIOD = "レッスンを 置く 期間";
export const RS_DUE = "希望の 締切";
export const RS_DUE_NOTE = "期間の はじまりより 前に。既定は 2週間後です";
export const RS_COUNT = "回数";
export const RS_COUNT_UNIT = "回";
export const RS_COUNT_NOTE = "型から 選ぶか、打ち込みます";
export const RS_MODE_HEAD = "置き方";
export const RS_WHEN_HINT = "目安の 曜日・時刻";
export const RS_WHEN_NOTE = "目安です。実際の日は 希望を 見てから 決めます";
export const RS_START = "この形で 始める";
export const RS_ASK_HEAD = "始めますか";
export const RS_ASK_1 = "それぞれの 門下に、希望を 聞きます。";
export const RS_ASK_2 = "締切は ";
export const RS_ASK_3 = " です。";
export const RS_ASK_4 = "お知らせは 送りません（学生が 開いたときに 見えます）。";
export const RS_NEED_TEACHER = "先生を 選んでください";

/**
 * ★置き方の 但し書き（★見本の .note。★1字 も 足しません）。
 *
 *   ★★★これが 裁定185 の かなめ です。★日づけを 先に 決めません。
 */
export const RS_MODE_NOTE = Object.freeze([
  "日付は ここでは 決めません。",
  "学生の「出られない日」を 集める前に 決めたら、集める意味が ありません。"
]);

/**
 * ★下の 但し書き（★見本の .note。★1字 も 足しません）。
 *
 *   ★★★2行目・4行目は 約束 です ──
 *     ★お知らせを 送りません。★締切を 過ぎても 自動では 閉じません。
 */
/**
 * ★1行目（★門下の 人数が 入ります）。
 *
 *   ★★見本は `門下の {MONKA.length}人の 画面に` です。★数を 出します。
 *   ★★★数が 分からない ときは「方」と 書きます。★`0人` と 書きません ──
 *     ★0 は「誰も いない」に 見えます。★分からないのと、★いないのは ちがいます。
 */
export function startedLine(monkaCount) {
  const n = Number(monkaCount);
  const 誰 = Number.isFinite(n) && n > 0 ? n + "人" : "方";
  return "始めると、門下の " + 誰 + "の 画面に「希望を 出してください」が 出ます。";
}

export const RS_NOTE = Object.freeze([
  "お知らせは 送りません。催促も しません。",
  "希望が 1件も 入っていない あいだは、この回を 消せます。1件でも 入ったら 消せません。",
  "締切を 過ぎても 自動では 閉じません（集まらないまま 閉じると 困るのは 先生です）。"
]);

// ============================================================================
// ★★★学校の 札（★裁定140 ／ 裁定73 ／ design-v42・2026-09-24）
//
//   ★出どころ  見本 `orgTabs()` ／ `orgOne()` ／ `orgName()`
//     woolsong-2026-09-21_4.zip ／ 00-動く見本-PC・iPad（運営）.html
//
//   ★★★1校 だけの 方には、★札も 註も 出しません（★裁定73）。
//     ★1つしか 無い ものを 選ばせません。
//   ★★★2校 以上の 方には、★札を 並べ、★どの 学校の 回かを 書きます。
//     ★★「はじめの 1つ」を こちらで 選びません ── ★台帳が 名前の 順で 返します。
// ============================================================================

/** ★学校の 行（★`my_orgs()` の 答え）。★並べ替えません。 */
export function orgRows(rows) {
  return (Array.isArray(rows) ? rows : []).map((r) => ({
    id: r.org_id,
    name: r.name || "（名前なし）",
    isStudent: r.is_student === true
  }));
}

/** ★札を 出すか（★2校 以上の ときだけ・★裁定73）。 */
export function showsOrgTabs(rows) {
  return (Array.isArray(rows) ? rows : []).length >= 2;
}

/** ★選ばれて いる 学校（★選んで いなければ はじめの 1つ）。 */
export function selectedOrg(rows, selectedId) {
  const 並 = orgRows(rows);
  if (並.length === 0) return null;
  return 並.find((o) => o.id === selectedId) || 並[0];
}

/** ★どの 学校の 回か（★見本の 字。★1字 も 足しません）。 */
export const RS_ORG_1 = "この回は ";
export const RS_ORG_2 = " の ものに なります。ほかの 学校で 始めるときは、上の 札を 押してから。";
