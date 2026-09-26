// ============================================================================
// ★行事の 表（★見本 `P_gyoji` ／ ★2026-09-18・坂本さんの お決め Q4）
//
//   ★★★広い ときは 表、★狭い ときは 札。★名簿・役職と 同じ 形 です。
//     ★★どちらも 残します。★用が ちがいます ──
//       ★表 … ★同じ 日の 行事を 横に 並べて くらべる
//       ★札 … ★1つを 見る。★触って 直す
//
//   ★★★境目は **測って** 決めます。★書き写しません（★裁定 その81 §5-4）。
//     ★★`TABLE_AT = 表の 実の 幅 ＋ 殻の 左右の 余白`
//     ★★殻の 余白は `app/dashboard` の 12px … では なく、
//       ★`components/OpsShell.jsx` の `padding: "12px 14px 16px"` ── ★左右 14px。
//       ★★見張りが その 数を 読みます。★変えた 日に 気づきます。
//
//   ★見張り components/tests/ops-event-table.test.js
// ============================================================================

/**
 * ★列（★見本の `<tr><th>` の 並び・★7つ）。
 *
 *   ★★`min` は、★その 列が 潰れない 幅 です。
 *     ★★行事の 名前は 長く なります。★いちばん 広く 取ります。
 *   ★★`anchor` は 左に 貼りつく 列（★錨）。★見本の `class="stick"`。
 */
export const EVENT_COLUMNS = Object.freeze([
  { key: "title", label: "行事", min: 200, anchor: true },
  { key: "date", label: "日", min: 104 },
  { key: "time", label: "時間", min: 116 },
  { key: "place", label: "場所", min: 116 },
  { key: "target", label: "対象", min: 168 },
  { key: "reach", label: "届く人", min: 84, num: true },
  { key: "state", label: "ようす", min: 96 }
]);

/** ★表の 実の 幅（★`min` の 足し算。★書き写しません）。 */
export const TABLE_WIDTH = EVENT_COLUMNS.reduce((a, c) => a + c.min, 0);

/** ★殻の 左右の 余白（★`components/OpsShell.jsx` の `padding`）。 */
export const SHELL_PADDING_X = 14 * 2;

/** ★ここから 表（★測った 数 ＋ 余白）。 */
export const TABLE_AT = TABLE_WIDTH + SHELL_PADDING_X;

/**
 * ★表を 出すか。
 *
 *   ★★幅が 分からない うちは 出しません（★狭い ほうへ 倒します）。
 *     ★★出して から 縮めると、★一度 出た ものが 消えます。
 */
export function showEventTable(width) {
  const w = Number(width);
  if (!Number.isFinite(w) || w <= 0) return false;
  return w >= TABLE_AT;
}

/** ★錨の 列（★1つ だけ）。 */
export function anchorColumn() {
  return EVENT_COLUMNS.find((c) => c.anchor) || null;
}

/**
 * ★時間の 1行（★見本の `jspan`）。
 *
 *   ★★終わりが 無ければ「13:00〜」。★見本の「終わりは 未定」と 同じ 姿 です。
 *   ★★どちらも 無ければ「—」。★空の ますを 作りません。
 */
export const NO_VALUE = "—";
export function timeSpan(ev) {
  const a = ev && ev.start_time ? String(ev.start_time).slice(0, 5) : "";
  const b = ev && ev.end_time ? String(ev.end_time).slice(0, 5) : "";
  if (!a && !b) return NO_VALUE;
  if (!b) return `${a}〜`;
  return `${a}〜${b}`;
}

// ============================================================================
// ★★★行事の 画面の 字（★2026-09-26・D群・見本 `SC['行事']`）
//
//   ★★★裁定200 §0z ── ★スマホ用の 別の 画面を 作りません。
//     ★この 画面が 幅で 姿を 変えます。★字だけを ここに 足します。
//
//   ★★★「出欠は 集めません」は **約束** です。★2か所に 出ます ──
//     ★上の 1行（★題の 下）と、★下の 但し書き。
//     ★★どちらも 見本の まま です。★片方を 省きません。
//     ★★★これは 機能の 断り です ── ★行事に 出欠の 口を 作らない、という こと。
//       ★★`org_events` に 出欠の 列は ありません（★2026-09-26 に 数えました：15列）。
// ============================================================================

/** ★題の 下の 1行（★見本の `usu`）。 */
export const EVENT_LEAD = "日と 時間と 場所と 対象を 知らせます";

/** ★その 1行の 後半（★太字）。★下の 但し書きと 同じ 字 です。 */
export const EVENT_NO_ATTENDANCE = "出欠は 集めません";

/** ★下の 但し書き（★約束）。 */
export const EVENT_NOTE = "出欠は 集めません。日と 場所を お知らせするだけです。";
