// ============================================================================
// 「ならべる」── 書いたことを、日付の順に 並べ直す（2026-09-09・見本④）
//
//   ★出どころ Woolsong 画面の見本（2026年9月9日）④ ふりかえる／ならべる
//            「同じ日付軸に縦にならべる・一色の濃淡」
//
//   ★★見本の 但し書き（★1文字も 変えないこと）
//     「ここに出るのは、あなたが書いたことの並びです。
//      　原因かどうかは、分かりません。疑いながら 見てください。」
//
//   ★★だから、★ここには 統計が 1つも ありません。
//     ★相関も、★効果量も、★p値も、★FDR も、★1つも 計算しません。
//     ★★表示ゲート（lib/displayGates.js）を 通しません。
//       ★通す必要が ありません。★何も 言っていないからです。
//       ★「あなたは こうです」と 言い始めた 瞬間に、★ゲートが 要ります。
//
//   ★★よそと くらべません。★entries は、★その方のものだけです。
//
//   ★★「さかのぼる」は、★別に あります（★lib/lookBack.js の C1）。
//     ★あちらは 前からの もので、★作り直しません。★日の 選び方だけ 足しました。
//
//   ★見張り components/tests/line-up.test.js
// ============================================================================

import { addDaysISO } from "@/lib/lookBack";

/** ★見る 長さ（★見本④の 14日／4週／3か月）。 */
export const PERIODS = Object.freeze([
  { key: "14d", label: "14日", days: 14 },
  { key: "4w", label: "4週", days: 28 },
  { key: "3m", label: "3か月", days: 90 }
]);

/** ★見本④の 但し書き。★1文字も 変えないこと。 */
export const LINE_UP_NOTE =
  "ここに出るのは、あなたが書いたことの並びです。\n" +
  "原因かどうかは、分かりません。疑いながら 見てください。";

/** ★その日から さかのぼって n 日ぶんの 日付（★古い順）。 */
export function datesBack(todayISO, days) {
  const out = [];
  for (let i = (days || 0) - 1; i >= 0; i--) {
    const d = addDaysISO(todayISO, -i);
    if (d) out.push(d);
  }
  return out;
}

/** ★歌った 時間（分）。★活動の 合計です。★書いていなければ null。 */
export function sungMinutes(entry) {
  const acts = entry && entry.activities;
  if (!Array.isArray(acts) || acts.length === 0) return null;
  let total = 0, any = false;
  acts.forEach((a) => {
    const m = Number(a && a.minutes);
    if (Number.isFinite(m) && m > 0) { total += m; any = true; }
  });
  return any ? total : null;
}

/**
 * ★「3時間20分」。
 *
 *   ★★0分は null です。★「0分」と 書きません。
 *     ★書いていないことと、★0だったことを、★同じ形に しないためです。
 */
export function minutesWord(mins) {
  if (typeof mins !== "number" || !Number.isFinite(mins) || mins <= 0) return null;
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return h === 0 ? `${m}分` : `${h}時間${String(m).padStart(2, "0")}分`;
}

/**
 * ★ならべる の 1本（★見本④）。
 *
 *   ★★「一色の 濃淡」です。★色を 変えません。
 *     ★★値で 色を 変えると、★良し悪しを 言ったことに なります。
 *     ★赤くすれば「悪い日」です。★こちらが 決めることでは ありません。
 *   ★★返すのは 0〜1 の 濃さと、★元の値だけです。★点数を 作りません。
 *   ★★書いていない日は null。★0 に しません。
 *     ★★「書かなかった」と「0だった」は、★別のことです。
 *   ★1日も 書いていなければ null。★空の枠を 置きません。
 */
export function seriesOf(entries, dates, pick) {
  const raw = (dates || []).map((d) => {
    const e = entries && entries[d];
    const v = e ? pick(e) : null;
    return { date: d, value: typeof v === "number" && Number.isFinite(v) ? v : null };
  });
  const vals = raw.map((x) => x.value).filter((v) => v != null);
  if (vals.length === 0) return null;
  const max = Math.max(...vals);
  const min = Math.min(...vals);
  const span = max - min;
  return raw.map((x) => ({
    date: x.date,
    value: x.value,
    // ★★濃さは 0.25〜1。★書いた日を、★薄すぎて 見えなくしません。
    //   ★全部 同じ値の日々は 1（★span が 0 のとき）。
    density: x.value == null ? null : (span === 0 ? 1 : 0.25 + 0.75 * ((x.value - min) / span))
  }));
}
