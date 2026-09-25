// ============================================================================
// ★本番の 前後 ── ★−7日 から +3日（★2026-09-25・C群 束2）
//
//   ★見本 `SC['本番の前後']`（★design-v51・iPhone で 開く用）。
//
//   ★★★この 画面は「言う」画面では ありません。★「並べる」画面 です。
//     ★★だから `lib/displayGates.js` の 3つの 関門を 通しません。
//       ★★関門は「★統計として 言って よいか」を 決める もの です。
//         ★ここは ご本人の 記録を、★日付の 順に 並べる だけ です。
//       ★★★見本が そう 言って います ──「1回ずつでも 見られます」。
//         ★1回の 記録に 関門を かけると、★ご本人の 記録が 見られなく なります。
//         ★それは 守りでは なく、★取り上げ です。
//
//   ★★★重ねる ときは ちがいます ──「重ねるのは 3回から」。
//     ★2回を 重ねると、★たまたまが 形に 見えます。
//     ★`MIN_OVERLAY` が その 1か所 です。
//
//   ★★台帳（★2026-09-25・本番で 確かめました）──
//     ★読む: `performances`（id, user_id, performed_on, kind, label, org_event_id, created_at）
//       ★決まり `performances_own`。★ご本人だけ です。
//     ★読む: `entries`（★声の 出来）。★`readDekiValue` が 1つの 読み方 です。
//     ★★★`performances.kind` は **8つ だけ** です ──
//       ★honban ／ rehearsal ／ lesson_take ／ lesson_give ／
//       ★recording ／ audition ／ travel ／ rest
//       ★★`stage` は ありません。★入れると 縛りで 落ちます（★Opus の 申し送り・2026-09-24）。
//
//   ★★数を 出しません ── ★「◯％ 良い」「平均 ◯」を 書きません。
//     ★出すのは 棒の 長さ と、★日の 番号（−7 … 0 … +3）だけ です。
// ============================================================================

/** ★前後の 幅（★見本 `−7日 〜 +3日`）。 */
export const BEFORE_DAYS = 7;
export const AFTER_DAYS = 3;
export const SPAN_LABEL = "−7日 〜 +3日";

/** ★0の 説明（★見本の `.usu`）。 */
export const ZERO_LABEL = "0＝本番の日";

/** ★重ねる ときの 下限（★見本「重ねるのは 3回から」）。 */
export const MIN_OVERLAY = 3;

/** ★重ねて よいか。★2回では 重ねません。 */
export function mayOverlay(count) {
  const n = Number(count);
  return Number.isFinite(n) && n >= MIN_OVERLAY;
}

/** ★台帳が 受け取る 8つ（★字は ここ 1か所）。 */
export const KINDS = Object.freeze([
  "honban", "rehearsal", "lesson_take", "lesson_give",
  "recording", "audition", "travel", "rest"
]);

/** ★知らない 種は 送りません ── ★縛りで 落ちる 前に 止めます。 */
export function isKind(k) {
  return KINDS.includes(String(k || ""));
}

/** ★引く 列 だけ。 */
export const COLS_PERFORMANCE = "id, performed_on, kind, label";

/**
 * ★棒の 長さ（★見本の `[40,65,88][x.voice-1]`）。
 *
 *   ★★見本は 3段（1〜3）です。★この 家の 記録は 5段（1〜5）です。
 *     ★★★だから 見本の 3つの 数を そのまま 使えません。
 *       ★★1 を 40％、★5 を 88％に して、★あいだを 等分します。
 *         ★見本の 端（40／88）を 守り、★段の 数だけ 合わせます。
 *   ★★★書いて いない 日は `null` です。★0％に しません。
 *     ★0％は「いちばん 悪い」に 見えます。★書いて いない ことと ちがいます。
 */
export const BAR_MIN = 40;
export const BAR_MAX = 88;
export function barWidth(five) {
  const v = Number(five);
  if (!Number.isFinite(v) || v < 1 || v > 5) return null;
  return BAR_MIN + ((v - 1) / 4) * (BAR_MAX - BAR_MIN);
}

/** ★日の 番号（★見本 `(i-7>0?'+':'')+(i-7)`）。 */
export function dayLabel(offset) {
  const n = Number(offset);
  if (!Number.isFinite(n)) return "";
  return (n > 0 ? "+" : "") + String(n);
}

/**
 * ★−7 から +3 の 11日を 組みます。
 *
 *   ★★`entryOf(iso)` は その 日の 記録を 返す 関数 です。
 *     ★★画面が 持って いる 記録を 渡します。★ここでは 引きません。
 *   ★★`deki` は `readDekiValue` の 答え（★1〜5 か null）です。
 */
export function buildDays(performedOn, entryOf, readDeki) {
  const base = new Date(String(performedOn) + "T00:00:00");
  if (Number.isNaN(base.getTime())) return [];
  const out = [];
  for (let d = -BEFORE_DAYS; d <= AFTER_DAYS; d += 1) {
    const dt = new Date(base.getTime());
    dt.setDate(dt.getDate() + d);
    const iso = dt.toISOString().slice(0, 10);
    const e = entryOf ? entryOf(iso) : null;
    const five = e && readDeki ? readDeki(e) : null;
    out.push({ offset: d, date: iso, five, width: barWidth(five), isDay: d === 0 });
  }
  return out;
}

/** ★下の 1行（★見本の `.note`・1文字も 変えないこと）。 */
export const NOTE_LINE = "1回ずつでも 見られます。重ねるのは 3回から。";

/** ★書いて いない 日が 続いた とき。★責めません。 */
export const NO_RECORD_LINE = "この 前後に、書いた 日が ありません。";
