// ============================================================================
// ★日を 選ぶ（★2026-09-25・C群）
//
//   ★見本 `SC['日を選ぶ']`。★3つの 使い方が あります ──
//     ★`range` …… ★はじめの日 → 終わりの日（★受診用の 1枚）
//     ★`one`   …… ★1日 だけ（★コマの中身の「いつまで」）
//     ★`multi` …… ★いくつでも（★無理な 日）
//
//   ★★★台帳を 1つも 触りません。★選んだ 日を 呼ぶ 側に 返すだけ です。
//     ★★だから この 画面には 決まりも 列も ありません。
//
//   ★★★戻る 先は 呼ぶ 側が 名のります（★見本の `o.from`）。
//     ★★「戻ると、◯◯ に 帰ります」と 書く 以上、★そこへ 帰らねば なりません。
//       ★★`components/tests/back-label-truth.test.js` が 見ています。
//
//   ★見張り components/tests/day-pick.test.js
// ============================================================================

/** ★題。 */
export const TITLE = "日を 選ぶ";

/** ★曜日（★見本の `日月火水木金土`）。 */
export const WEEK = Object.freeze(["日", "月", "火", "水", "木", "金", "土"]);

/** ★月の 名（★見本の 一覧）。 */
export const MONTHS = Object.freeze([
  "1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"
]);

/** ★3つの 使い方。 */
export const MODES = Object.freeze(["range", "one", "multi"]);
export function normalizeMode(m) {
  return MODES.includes(String(m || "")) ? String(m) : "range";
}

/** ★前の月・次の月（★見本の `‹ 前の月` ／ `次の月 ›`）。 */
export const PREV = "‹ 前の月";
export const NEXT = "次の月 ›";

/** ★上の 1行（★いま 何を 選んで いるか）。 */
export const ASK_RANGE_A = "はじめの日を 選んでください";
export const ASK_ONE = "日を 選んでください";
export const ASK_MULTI = "無理な日を 選んでください（いくつでも）";
export const ASK_RANGE_B = "（終わりの日を 選んでください）";

/** ★早く 選ぶ 札（★`range` の ときだけ）。 */
export const QUICK = Object.freeze(["先月", "今月", "この3か月"]);

/** ★下の 札。 */
export const BTN_ONE = "この日に する";
export const BTN_MULTI = "これで いい";
export function btnOf(mode) {
  return normalizeMode(mode) === "multi" ? BTN_MULTI : BTN_ONE;
}

/** ★下の 断り（★使い方で 変わります）。 */
export const NOTE_RANGE = "はじめの日 → 終わりの日 の 順に 押します。もう一度 押すと やり直せます。";
export const NOTE_OTHER = "押すと 選べます。もう一度 押すと 外れます。";
export function noteOf(mode) {
  return normalizeMode(mode) === "range" ? NOTE_RANGE : NOTE_OTHER;
}

/**
 * ★戻る 先の 1行（★見本 ──「戻ると、**◯◯** に 帰ります。」）。
 *
 *   ★★★名を 受け取らない ときは、★この 行を **出しません**。
 *     ★★「戻ると、 に 帰ります」は 意味に なりません。
 */
export function backLineOf(from) {
  const s = String(from || "").trim();
  return s ? `戻ると、${s} に 帰ります。` : "";
}

/** ★その 月の 日数。 */
export function daysInMonth(year, month0) {
  return new Date(Number(year), Number(month0) + 1, 0).getDate();
}

/** ★その 月の 1日が 何曜か（★0＝日）。 */
export function firstWeekday(year, month0) {
  return new Date(Number(year), Number(month0), 1).getDay();
}

/** ★ひと月ぶんの 枡（★空の 枡は `null`）。 */
export function cellsOf(year, month0) {
  const 空 = firstWeekday(year, month0);
  const 数 = daysInMonth(year, month0);
  const out = [];
  for (let i = 0; i < 空; i += 1) out.push(null);
  for (let d = 1; d <= 数; d += 1) out.push(d);
  return out;
}

/** ★`YYYY-MM-DD`。 */
export function isoOf(year, month0, day) {
  const m = String(Number(month0) + 1).padStart(2, "0");
  const d = String(Number(day)).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

/** ★前の月・次の月（★年を またぎます）。 */
export function stepMonth(year, month0, n) {
  const t = Number(month0) + Number(n);
  return { year: Number(year) + Math.floor(t / 12), month0: ((t % 12) + 12) % 12 };
}

/**
 * ★押した ときの 次の 姿。
 *
 *   ★★`range` …… ★1つ目 → 2つ目。★2つ 揃って いれば やり直し。
 *   ★★`one`   …… ★同じ 日を もう一度 押すと 外れます。
 *   ★★`multi` …… ★あれば 外し、★無ければ 足します。
 */
export function tap(mode, sel, iso) {
  const m = normalizeMode(mode);
  const s = sel || {};
  if (m === "one") return { one: s.one === iso ? null : iso };
  if (m === "multi") {
    const a = Array.isArray(s.many) ? s.many : [];
    return { many: a.includes(iso) ? a.filter((x) => x !== iso) : a.concat([iso]).sort() };
  }
  if (!s.from || (s.from && s.to)) return { from: iso, to: null };
  return s.from <= iso ? { from: s.from, to: iso } : { from: iso, to: s.from };
}

/** ★その 日が 選ばれて いるか（★`"on"` ／ `"mid"` ／ `""`）。 */
export function markOf(mode, sel, iso) {
  const m = normalizeMode(mode);
  const s = sel || {};
  if (m === "one") return s.one === iso ? "on" : "";
  if (m === "multi") return (s.many || []).includes(iso) ? "on" : "";
  if (s.from === iso || s.to === iso) return "on";
  if (s.from && s.to && iso > s.from && iso < s.to) return "mid";
  return "";
}

/** ★上の 1行（★いま 何を 選んで いるか）。 */
export function labelOf(mode, sel) {
  const m = normalizeMode(mode);
  const s = sel || {};
  if (m === "one") return s.one || ASK_ONE;
  if (m === "multi") return (s.many || []).length ? (s.many || []).join("　") : ASK_MULTI;
  if (s.from && s.to) return `${s.from} 〜 ${s.to}`;
  if (s.from) return `${s.from} 〜　${ASK_RANGE_B}`;
  return ASK_RANGE_A;
}

/** ★送れる か。 */
export function canOk(mode, sel) {
  const m = normalizeMode(mode);
  const s = sel || {};
  if (m === "one") return !!s.one;
  if (m === "multi") return true;
  return !!(s.from && s.to);
}
