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

/**
 * ★見本の 下の 3行（★narabe() の 最後の .note ／ 2026-09-11）。
 *
 *   ★★何を している 画面かを、★はっきり 言います。
 *     ★坂本さん経由の Opus の 指摘 ──「1本の 線では なく、
 *     ★複数の 項目を 上下に 並べる 形に」。
 *     ★★その とおりです。★この 3行が、★その 説明です。
 */
export const LINE_UP_STACK_NOTE = Object.freeze([
  "同じ 日付の 軸に、書いたことを 縦に 並べます（鏡です）。",
  "文章・判定・基準線・「良い/悪い」の色を 出しません。",
  "3か月にすると、日ごとを やめて 週ごとに します（つぶれるからです）。"
]);

/**
 * ★上下に 並べる 項目（★見本 narabe() の 順）。
 *
 *   ★★見本は 4つです。★この 順に、★同じ 日付の 軸で 並べます。
 *   ★★「歌った 時間」は 見本に ありません。
 *     ★★けれど ご本人が 書いた ものです。★消しません（★4分類の ②）。
 *     ★見本の 4つの あとに 置きます。★見本の 並びを 崩さない ためです。
 *
 *   ★★2026-09-11 の 点検で 見つけた こと。
 *     ★「こえの ちょうし」という 札で、★のどの 値（throatCondition）を
 *     ★★出していました。★名前と 中身が 食い違っていました。
 *     ★voiceQuality が「声の調子（5段階）」、
 *     ★throatCondition が「喉の状態」です（★lib/translations.js）。
 */
export const STACK_ROWS = Object.freeze([
  { key: "voice", title: "こえの ちょうし", field: "voiceQuality" },
  { key: "throat", title: "のどの 調子", field: "throatCondition" },
  { key: "sleep", title: "昨夜の 睡眠", field: "sleepHours", foot: "4〜9時間" },
  { key: "marks", title: "気になったこと" },
  { key: "sung", title: "歌った 時間" }
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
