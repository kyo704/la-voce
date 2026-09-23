// ============================================================================
// ★★★半年の まとめ ／ はじめの 1週間 ── ★決めは ここ だけ です
//
//   ★出どころ  裁定183 P3（半年の まとめ）／ P4（はじめの 1週間）
//     ／ 見本 `SC['半年のまとめ']` `SC['はじめの1週間']`
//        woolsong-2026-09-21_1.zip ／ 00-動く見本-PC・iPad（運営）.html（md5 0132714e）
//        ★2026-09-24 に 確かめ
//
//   ★★★数だけ です。★体調の ことは 1つも 入りません。
//     ★学生の 順位・先生ごとの 比べ・点数は **出しません**（★見本の 註）。
//     ★★台帳の `org_monthly_stats` は 5つの 数 しか 持って いません。
//
//   ★★★5人 未満の 月は **伏せます**（`suppressed`）。
//     ★人が わかって しまう からです。★そのとき「―」と 書きます。
//     ★★★`0` と 書きません。★0 は「1人も いない」に 見えます。
//       ★伏せたのと、★いなかったのは、★ちがいます。
//
//   ★★★4つ 終わると、はじめの 1週間の 画面は 消えます。★急かしません。
//     ★お知らせも 送りません（★見本の 註・★台帳の「催促しない」）。
// ============================================================================

export const COLS_STATS = "org_id, ym, teachers, students, lessons_done, events_answer, ics_subs, suppressed, made_at";

/** ★見せる 列（★見本の 並びの まま）。 */
export const STAT_COLUMNS = Object.freeze([
  { key: "ym", label: "月" },
  { key: "teachers", label: "先生" },
  { key: "students", label: "学生" },
  { key: "lessons_done", label: "レッスンの 打刻" },
  { key: "events_answer", label: "行事" },
  { key: "ics_subs", label: "カレンダー" }
]);

/** ★伏せた ときの 字。★`0` では ありません。 */
export const HIDDEN_MARK = "―";

/**
 * ★1つの ます目の 字。
 *
 *   ★★★伏せた 月 ／ 入って いない 数 …… ★どちらも「―」。
 *     ★0 と 書くと、★「1人も いない」に 見えます。
 *   ★★これは 裁定183 P3 と 物差し M15 の 決め です。
 */
export function cellText(row, key) {
  if (!row) return HIDDEN_MARK;
  if (key === "ym") return monthLabel(row.ym);
  if (row.suppressed) return HIDDEN_MARK;
  const v = row[key];
  if (v === null || v === undefined) return HIDDEN_MARK;
  return String(v);
}

/** ★「2026-04-01」→「4月」。★読めなければ その まま。 */
export function monthLabel(ym) {
  const s = String(ym || "");
  const m = s.match(/^(\d{4})-(\d{2})/);
  return m ? String(Number(m[2])) + "月" : s;
}

/** ★期間の 見出し（★「2026年4月〜9月」）。★行が 無ければ 空。 */
export function periodLabel(rows) {
  const 並 = (Array.isArray(rows) ? rows : []).filter((r) => r && r.ym).slice()
    .sort((a, b) => String(a.ym).localeCompare(String(b.ym)));
  if (並.length === 0) return "";
  const 頭 = String(並[0].ym).match(/^(\d{4})-(\d{2})/);
  const 尻 = String(並[並.length - 1].ym).match(/^(\d{4})-(\d{2})/);
  if (!頭 || !尻) return "";
  return 頭[1] + "年" + Number(頭[2]) + "月〜" + Number(尻[2]) + "月";
}

/** ★新しい 月が 上に 来ない ように（★見本は 4月 → 9月 の 順）。 */
export function sortedRows(rows) {
  return (Array.isArray(rows) ? rows : []).slice()
    .sort((a, b) => String(a.ym || "").localeCompare(String(b.ym || "")));
}

/** ★見本の 言葉（★1字 も 足しません）。 */
export const SUM_HEAD = "半年の まとめ";
export const SUM_WARN = Object.freeze([
  "数だけです。体調の ことは 1つも 入りません。",
  "学生の 順位・先生ごとの 比べ・点数は 出しません。"
]);
export const SUM_SMALL_HEAD = "小さな 教室（5人 未満）";
export const SUM_SMALL_WHY = "人が わかってしまうので 出しません";
export const SUM_PAPER = "紙に 出す";
export const SUM_PAPER_WHY = "稟議に そのまま 使えます";
/**
 * ★下の 但し書き（★見本の .note。★1字 も 足しません）。
 *
 *   ★★★「学校の 手は かかりません」は 約束 です。
 *     ★毎月 1日に こちらで 作ります（`make_monthly_stats`・cron）。
 *     ★★学校に「作って ください」と 言いません。★押させません。
 */
export const SUM_NOTE = Object.freeze([
  "毎月 1日に、こちらで 作ります。学校の 手は かかりません。"
]);

// ---- はじめの 1週間 -------------------------------------------------------

/** ★台帳の 印（`onboarding_state`）を、★見本の 言葉に します。 */
export const ONBOARD_WORDS = Object.freeze({
  roster: { label: "名簿を 入れる", hint: "CSV でも 画面でも" },
  teacher_stamp: { label: "先生が レッスンを 1件 打刻する", hint: "だれか 1人で かまいません" },
  ics: { label: "カレンダーに つなぐ", hint: "先生か 事務の どなたか 1人" },
  event: { label: "行事を 1件 出す", hint: "練習で かまいません" }
});

/** ★4つを 見本の 順に 並べ、★言葉を つけます。 */
export function onboardItems(rows) {
  const 順 = ["roster", "teacher_stamp", "ics", "event"];
  const 済 = {};
  (Array.isArray(rows) ? rows : []).forEach((r) => { if (r) 済[r.item] = r.done === true; });
  return 順.map((k) => ({
    key: k,
    label: ONBOARD_WORDS[k].label,
    hint: ONBOARD_WORDS[k].hint,
    done: 済[k] === true
  }));
}

/** ★終わった 数。 */
export function doneCount(items) {
  return (Array.isArray(items) ? items : []).filter((x) => x && x.done).length;
}

/**
 * ★この 画面を もう 出さないか。
 *
 *   ★★★4つ 終わったら 消えます（★見本の 註）。
 *     ★「消える」であって、★「おめでとう」を 出すのでは ありません。
 */
export function isFinished(items) {
  const 全 = (Array.isArray(items) ? items : []).length;
  return 全 > 0 && doneCount(items) === 全;
}

export const ONBOARD_HEAD = "はじめの 1週間";
export const ONBOARD_DONE = "済み";
export const ONBOARD_YET = "まだ";
export const ONBOARD_COUNT = "終わりました";
export const ONBOARD_NOTE = Object.freeze([
  "4つ 終わると、この 画面は 消えます。",
  "急かしません。お知らせも 送りません。終わらなくても 使えます。"
]);
