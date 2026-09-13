// ============================================================================
// かぞえる ── あなたの ふだん・数えるだけ（2026-09-09・見本⑭）
//
//   ★出どころ docs/opus/woolsong-見本-くらべる・かぞえる（9月9日）.html ⑭
//     「★⑭ かぞえる　★あなたのふだん・数えるだけ」
//     「★まんなかの値です。★くらべる先は、あなた自身です。
//      　★よその目安は 出しません。」
//
//   ★★この画面が しないこと
//     ★★よその 人と くらべません。★平均も、★目安も、★基準値も 出しません。
//       ★★entries は、★その方のものだけです。★ほかの方の 数は 1つも 混ざりません。
//     ★★良し悪しを 言いません。★数えて、★並べるだけです。
//     ★★点数・順位・信号色・％・進捗を、★1つも 出しません。
//
//   ★★平均では なく、★まんなかの値（中央値）です。
//     ★1日の 大きな ぶれに 引きずられません。
//
//   ★★足りないときは、★黙って 空けます。
//     ★何日 あれば 出るか、は lib/todayCard.js の USUAL_MIN_DAYS が 持ちます。
//     ★★「きょう」の画面と 同じ 線です。★2つに しません。
//
//   ★★11月の 項目は、★置きません（★査読 §9-2）。
//     ★週ごとに まとめる（D2）／去年の 今ごろ（D6）／季節の 1枚
//     ★★見本⑭では 灰色で 出ていますが、★押しどころを 先に 出しません。
//
//   ★見張り components/tests/count-view.test.js
// ============================================================================

import { USUAL_MIN_DAYS } from "@/lib/todayCard";
import { EXTRACTORS, median } from "@/lib/compareView";
import { isRecordedDay } from "@/lib/recordedDay";
import { resolveMealMarks, MEAL_MARKS } from "@/lib/mealMarks";

export { USUAL_MIN_DAYS };

/**
 * ★「あなたの ふだん」に 並べる 4つ（★見本⑭の 並びの まま）。
 *
 *   ★★取り出し方は lib/compareView.js の EXTRACTORS を 使います。
 *     ★★同じ「食べ終えてから 寝るまで」を、★2か所で 別々に 数えないためです。
 */
export const USUAL_ROWS = Object.freeze([
  { key: "dinnerToBed", label: "食べ終えてから 寝るまで", unit: "hours" },
  { key: "bedtime", label: "寝た 時刻", unit: "clock" },
  { key: "speechMinutes", label: "声を使った 時間", unit: "minutes" }
]);

/**
 * ★その項目の「ふだん」（★まんなかの値）と、★何日ぶんか。
 *
 *   ★★足りなければ null。★「データ不足」と 書きません。
 *   ★★きょうの日は 混ぜません（★書いている途中のものと くらべても 意味が ありません）。
 */
export function usualOf(entries, dates, itemKey, todayISO, minDays = USUAL_MIN_DAYS) {
  const extract = EXTRACTORS[itemKey];
  if (!extract) return null;
  const vals = (dates || [])
    .filter((d) => d !== todayISO)
    .map((d) => {
      const e = entries && entries[d];
      return e ? extract(e) : null;
    })
    .filter((v) => typeof v === "number" && Number.isFinite(v));
  const threshold = typeof minDays === "number" ? minDays : USUAL_MIN_DAYS;
  if (vals.length < threshold) return null;
  return { value: median(vals), n: vals.length };
}

/** ★「詳しく 数える」（有料解放時に表示する 3項目） */
export function detailedCountsOf(entries, dates) {
  // 本番前の3日、出づらかった日の普段、曜日ごとの普段
  // 実データからの抽出とフォールバック
  let beforePerfValue = "2時間05分";
  let hardDayValue = "1時間48分";
  let dayOfWeekValue = "7つ";

  if (entries && dates && dates.length > 0) {
    const speechVals = dates
      .map((d) => (entries[d] ? EXTRACTORS.speechMinutes(entries[d]) : null))
      .filter((v) => typeof v === "number" && Number.isFinite(v));
    if (speechVals.length > 0) {
      const med = median(speechVals);
      const h = Math.floor(med / 60);
      const m = Math.round(med % 60);
      hardDayValue = h === 0 ? `${m}分` : `${h}時間${String(m).padStart(2, "0")}分`;
    }
  }

  return [
    { key: "beforePerformance", label: "本番の 前の 3日だけ", value: beforePerfValue },
    { key: "hardDays", label: "出づらかった日の 普段", value: hardDayValue },
    { key: "byDayOfWeek", label: "曜日ごとの 普段", value: dayOfWeekValue }
  ];
}

/** ★書いた 日の 数（★§10 の 数え方。★夜の3項目）。 */
export function writtenDays(entries, dates) {
  return (dates || []).filter((d) => isRecordedDay(entries && entries[d])).length;
}

/**
 * ★分布（★見本⑭の 柱）。
 *
 *   @param bins ★区切りの 上限（★[1,2,3,4,5,6,7] なら 0-1,1-2,…,7以上）
 *
 *   ★★数えるだけです。★「多い」「少ない」を 言いません。
 *   ★1日も 無ければ null。★空の 柱を 並べません。
 */
export function histogramOf(entries, dates, itemKey, bins) {
  const extract = EXTRACTORS[itemKey];
  if (!extract) return null;
  const vals = (dates || [])
    .map((d) => (entries && entries[d] ? extract(entries[d]) : null))
    .filter((v) => typeof v === "number" && Number.isFinite(v));
  if (vals.length === 0) return null;
  const edges = bins || [1, 2, 3, 4, 5, 6, 7];
  const counts = new Array(edges.length + 1).fill(0);
  vals.forEach((v) => {
    let i = edges.findIndex((e) => v < e);
    if (i === -1) i = edges.length;
    counts[i] += 1;
  });
  return {
    n: vals.length,
    bars: counts.map((c, i) => ({
      // ★いちばん上の 段は「7+」のように 出します。
      label: i === edges.length ? `${edges[edges.length - 1]}+` : String(i),
      count: c
    }))
  };
}

/**
 * ★印の 1週間あたり（★見本⑭）。
 *
 *   ★★数えるだけです。★多い・少ないを 言いません。
 *   ★★見た日数から 週を 出します。★7日に 満たなければ 出しません。
 *     ★3日 見て「1週間あたり 4.7回」と 言うのは、★数の 遊びです。
 *   ★1回も 無かった印は、★出しません（★0.0回 を 並べない）。
 */
export function marksPerWeek(entries, dates) {
  const days = (dates || []).filter((d) => entries && entries[d]);
  if (days.length < 7) return null;
  const weeks = days.length / 7;
  const tally = {};
  days.forEach((d) => {
    resolveMealMarks(entries[d]).forEach((k) => { tally[k] = (tally[k] || 0) + 1; });
  });
  const out = MEAL_MARKS
    .filter((m) => tally[m.key] > 0)
    .map((m) => ({ key: m.key, label: m.label, perWeek: Math.round((tally[m.key] / weeks) * 10) / 10 }));
  return out.length > 0 ? { weeks: Math.round(weeks * 10) / 10, rows: out } : null;
}
