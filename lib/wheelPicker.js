// ============================================================================
// ★スワイプの ホイール ── ★数だけ（★2026-09-11）
//
//   ★出どころ docs/design/pack-final/裁定-9月11日の12点… §9
//     「★±ボタンは 数が 多いと つらい。
//       ★上下に スワイプして 合わせる 従来の 形（時 ／ 分）
//       ★上に いまの 時間が 大きく 出ます
//       ★『未定に する』で おわりを 空に できます」
//   ★出どころ docs/design/pack-final/裁定-9月10日夜（役職への一本化…）.md §2
//     「★長さ　★スワイプの ホイール（時間 0〜4 ／ 分 0〜59）
//       ★1分きざみ。上に いまの 長さが 大きく 出ます
//       ★『30分／45分／60分』の 決め打ちボタンは やめました」
//
//   ★★決め打ちの ボタンを 作りません。
//     ★★学校ごとに 時間の わり方が ちがいます（★9/10深夜 §6「1分きざみに」）。
//     ★「45分」を 置いた とたん、★それが ふつうに なります。
//
//   ★★時計を 見ません。★いまの 値を 受け取ります。
//
//   ★見張り components/tests/wheel-picker.test.js
// ============================================================================

/** ★1つの 段の 高さ（画素）。★真ん中が 選ばれた 値です。 */
export const ROW_H = 40;

/** ★上下に 見せる 段の 数（★真ん中の 上下に いくつ 見えるか）。 */
export const VISIBLE_PAD = 1;

/** ★入れ物の 高さ。★真ん中 1つ ＋ 上下 それぞれ VISIBLE_PAD。 */
export const WHEEL_H = ROW_H * (VISIBLE_PAD * 2 + 1);

/** ★0〜max の 並び（★1きざみ）。 */
export function rangeOf(max) {
  const n = Math.max(0, Math.floor(max));
  return Array.from({ length: n + 1 }, (_, i) => i);
}

/** ★時計の 時（0〜23）と 分（0〜59）。 */
export const HOURS_OF_DAY = Object.freeze(rangeOf(23));
export const MINUTES = Object.freeze(rangeOf(59));

/** ★長さの 時間（0〜4）。★裁定の とおりです。 */
export const LENGTH_HOURS = Object.freeze(rangeOf(4));

/** ★スクロールの 位置から、★どの 段かを 出します。 */
export function indexAt(scrollTop) {
  const n = Math.round(Number(scrollTop || 0) / ROW_H);
  return n < 0 ? 0 : n;
}

/** ★その 段の、★スクロールの 位置。 */
export function topOf(index) {
  return Math.max(0, Math.floor(index)) * ROW_H;
}

/** ★"19:00" を { h, m } に。★読めなければ null。 */
export function parseTime(v) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(v || ""));
  if (!m) return null;
  const h = Number(m[1]);
  const mi = Number(m[2]);
  if (h < 0 || h > 23 || mi < 0 || mi > 59) return null;
  return { h, m: mi };
}

/** ★{ h, m } を "19:00" に。 */
export function formatTime(h, m) {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * ★長さを 言葉に します。
 *
 *   ★★0分でも「0分」と 出します。★空に しません。
 *     ★空に すると、★決めていないのか 0なのか 分かりません。
 */
export function lengthWord(h, m) {
  if (h === 0) return `${m}分`;
  if (m === 0) return `${h}時間`;
  return `${h}時間${m}分`;
}

/** ★分の 数に します（★保存は 分の 整数。★裁定 §Code 6）。 */
export function toMinutes(h, m) {
  return Math.max(0, Math.floor(h)) * 60 + Math.max(0, Math.floor(m));
}

/** ★分の 数から { h, m } に。 */
export function fromMinutes(total) {
  const n = Math.max(0, Math.floor(Number(total) || 0));
  return { h: Math.floor(n / 60), m: n % 60 };
}
