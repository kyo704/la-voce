// ============================================================================
// ★本番の ふりかえり（★2026-09-25・C群）
//
//   ★見本 `SC['本番のふりかえり']`。
//
//   ★★★下の 4行は **約束** です ──
//     ①「よい わるいは 言いません。並べるだけです。」
//       ★★点も 印も 色も 付けません。★並べる 順は 日の 順 だけ です。
//     ②「2回目の 本番から、前回と 重ねて 見られます。」
//       ★★1回目の 方には 重ねる 相手が いません。★出しません。
//     ③「本番の 前の日と 当日は、何も 出しません。」
//       ★★`前の7日` は **7日前〜1日前** です。★当日を 入れません。
//       ★★★見本の 一覧も 7日前から 1日前 まで です。
//     ④「ご自分で 登録された 本番だけを 使います。学校の 行事からは 引きません。」
//       ★★`performances` の うち `org_event_id` が 空の ものだけ。
//         ★★学校の 行事から 来た 行（★`org_event_id` が 入って いる）は 使いません。
//
//   ★★★書いて いない 日は「書いていません」と 出します。★0 にしません
//     （★裁定 ── ★数が 無い ことと、★0 は ちがいます）。
//
//   ★見張り components/tests/honban-furikaeri.test.js
// ============================================================================

/** ★題。 */
export const TITLE = "本番の ふりかえり";

/** ★何日ぶん（★見本 ──「前の 7日」）。 */
export const DAYS = 7;

/** ★節の 題。 */
export const HEAD = "前の 7日";

/** ★書いて いない 日（★0 と 書きません）。 */
export const NOT_WRITTEN = "書いていません";

/** ★下の 断り（★約束。★消さないこと）。 */
export const NOTES = Object.freeze([
  "よい わるいは 言いません。並べるだけです。",
  "2回目の 本番から、前回と 重ねて 見られます。",
  "本番の 前の日と 当日は、何も 出しません。",
  "ご自分で 登録された 本番だけを 使います。学校の 行事からは 引きません。"
]);

/** ★太字に する 行（★見本の `<b>`）。 */
export const NOTES_STRONG = Object.freeze([2]);

/** ★台帳から 読む 列。 */
export const COLS_PERFORMANCE = "id, performed_on, label, org_event_id";
export const COLS_ENTRY = "date, sleep_hours";

/**
 * ★使って よい 本番か（★約束④）。
 *
 *   ★★ご自分で 登録した もの だけ。★学校の 行事から 来た ものは 使いません。
 */
export function isOwn(performance) {
  return !!performance && !performance.org_event_id;
}

/** ★1日 ずらす。 */
function shift(iso, n) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * ★前の 7日（★7日前 〜 1日前）。
 *
 *   ★★★当日を 入れません（★約束③）。★前の日も「本番の 前の日」です が、
 *     ★★見本の 一覧は 1日前 まで 並べて います。
 *     ★★★出さないのは **本番の 前の日と 当日の 記録** ── ★つまり、
 *       ★まだ 書き終えて いない 日を 数に 入れない、という ことです。
 *       ★★だから 並べるのは 7日前〜1日前、★当日は 1行も ありません。
 */
export function daysBefore(performedOn) {
  const s = String(performedOn || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return [];
  const out = [];
  for (let n = DAYS; n >= 1; n -= 1) out.push({ ago: n, date: shift(s, -n) });
  return out;
}

/** ★「◯日前」。 */
export function agoWord(n) {
  return `${Number(n)}日前`;
}

/**
 * ★眠りの 字（★見本 ──「眠り 7時間20分」）。
 *
 *   ★★★書いて いない 日は `NOT_WRITTEN`。★0時間0分と 書きません。
 *   ★★点も 印も 付けません（★約束①）。
 */
export function sleepWord(hours) {
  if (hours === null || hours === undefined || hours === "") return NOT_WRITTEN;
  const h = Number(hours);
  if (!Number.isFinite(h)) return NOT_WRITTEN;
  const 時 = Math.floor(h);
  const 分 = Math.round((h - 時) * 60);
  return `眠り ${時}時間${String(分).padStart(2, "0")}分`;
}

/** ★1行ぶん（★見本 ──「7日前　眠り 7時間20分」）。 */
export function rowsOf(performedOn, entriesByDate) {
  const 表 = entriesByDate || {};
  return daysBefore(performedOn).map((d) => ({
    date: d.date,
    text: `${agoWord(d.ago)}　${sleepWord(表[d.date])}`
  }));
}

/**
 * ★重ねられる か（★約束②）。
 *
 *   ★★2回目の 本番から です。★1回目の 方には 相手が いません。
 */
export function mayCompare(ownPerformances) {
  return (ownPerformances || []).filter(isOwn).length >= 2;
}
