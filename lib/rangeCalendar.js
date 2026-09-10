// ============================================================================
// ★期間を えらぶ カレンダー ── ★数だけ（★2026-09-11）
//
//   ★出どころ docs/design/pack-final/裁定-9月10日夜の7点（役職名…）.md §2
//     「★はじめの日 → おわりの日 の 順に 押す
//       ★途中の日は うすい色で つながる
//       ★もう一度 押すと やり直せる
//       ★『先月』『今月』『先週』の 早押しも 置いた」
//     「★選んだ期間が、受診用の 画面に そのまま 出ます。
//       ★行事の『日』からも、同じ カレンダーを 使います」
//
//   ★★時計を 見ません。★きょうを 外から 受け取ります。
//     ★見ると、★端末の 時差で ずれます。★見張りも 書けなく なります。
//
//   ★見張り components/tests/range-calendar.test.js
// ============================================================================

const WEEK = ["日", "月", "火", "水", "木", "金", "土"];
export const WEEK_LABELS = Object.freeze(WEEK);

function ymd(y, m, d) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** ★ISO を { y, m, d } に。★読めなければ null。 */
export function partsOf(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ""));
  if (!m) return null;
  return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
}

/** ★その月の 日数。 */
export function daysInMonth(y, m) {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** ★その月の 1日は 何曜日か（★0＝日）。 */
export function firstWeekday(y, m) {
  return new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
}

/**
 * ★1か月ぶんの 升目。
 *
 *   ★★前の月・次の月の ぶんは 入れません。★空の 升目に します。
 *     ★入れると、★押せてしまいます。★別の月を 選んだことに なります。
 */
export function monthGrid(y, m) {
  const pad = firstWeekday(y, m);
  const n = daysInMonth(y, m);
  const cells = [];
  for (let i = 0; i < pad; i++) cells.push(null);
  for (let d = 1; d <= n; d++) cells.push(ymd(y, m, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/** ★月を ずらします。 */
export function shiftMonth(y, m, by) {
  const t = new Date(Date.UTC(y, m - 1 + by, 1));
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1 };
}

/**
 * ★押したときの、★次の 期間。
 *
 *   ★★決まり（★見本のとおり）
 *     ・何も 選んでいない → ★はじめの日
 *     ・はじめだけ ある → ★おわりの日（★前を 押したら、入れ替える）
 *     ・両方 ある → ★やり直し（★押した日を はじめに する）
 */
export function pickDay(range, iso) {
  const r = range || {};
  if (!r.start || (r.start && r.end)) return { start: iso, end: null };
  if (iso < r.start) return { start: iso, end: r.start };
  return { start: r.start, end: iso };
}

/** ★その日は 期間の 中か。 */
export function inRange(range, iso) {
  const r = range || {};
  if (!r.start) return false;
  if (!r.end) return iso === r.start;
  return iso >= r.start && iso <= r.end;
}

/** ★その日は 端か（★はじめ・おわり）。 */
export function isEdge(range, iso) {
  const r = range || {};
  return iso === r.start || iso === r.end;
}

/** ★日を ずらします（★時計を 見ません）。 */
export function shiftDay(iso, by) {
  const p = partsOf(iso);
  if (!p) return null;
  const t = new Date(Date.UTC(p.y, p.m - 1, p.d + by));
  return t.toISOString().slice(0, 10);
}

/**
 * ★早押し（★見本「先月」「今月」「先週」）。
 *
 *   ★★きょうを 外から 受け取ります。★時計を 見ません。
 */
export const QUICK_RANGES = Object.freeze(["先週", "今月", "先月"]);

export function quickRange(name, todayISO) {
  const p = partsOf(todayISO);
  if (!p) return null;
  if (name === "先週") {
    // ★★きょうから さかのぼって 7日（★きょうを 含みます）。
    return { start: shiftDay(todayISO, -6), end: todayISO };
  }
  if (name === "今月") {
    return { start: ymd(p.y, p.m, 1), end: todayISO };
  }
  if (name === "先月") {
    const q = shiftMonth(p.y, p.m, -1);
    return { start: ymd(q.y, q.m, 1), end: ymd(q.y, q.m, daysInMonth(q.y, q.m)) };
  }
  return null;
}

/** ★「9月6日（金）」の 形。 */
export function dayLabel(iso) {
  const p = partsOf(iso);
  if (!p) return "";
  const w = new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay();
  return `${p.m}月${p.d}日（${WEEK[w]}）`;
}

/** ★「9月6日 〜 9月12日」の 形。★片方だけなら、そこまで。 */
export function rangeLabel(range) {
  const r = range || {};
  if (!r.start) return "";
  if (!r.end) return dayLabel(r.start) + " 〜";
  return dayLabel(r.start) + " 〜 " + dayLabel(r.end);
}
