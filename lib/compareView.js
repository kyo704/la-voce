// ============================================================================
// くらべる ── 2つの群を 並べて 見る（2026-09-09・見本⑫⑬）
//
//   ★出どころ docs/opus/woolsong-見本-くらべる・かぞえる（9月9日）.html ⑫⑬
//     「★点数・順位・信号色・％・進捗は 1つも出しません。色は えんじの濃淡だけです。」
//
//   ★★この帳面が 持つ 決めごと
//     ★どの日を「よく出た日」「出なかった日」と するか
//     ★その日から 見て、★いつの 値を 取るか（★§2 の 時間差）
//     ★どれを 判定に 数え、★どれを 目にだけ 見せるか（★§7 の 印）
//
//   ★★持たない もの
//     ★★門（3つの門）は lib/displayGates.js が 持ちます。★ここでは 決めません。
//     ★★群Bの 作り方（初日だけ）は lib/compareGroups.js が 持ちます。
//     ★★時間差の 既定は lib/lagChoice.js が 持ちます。
//     ★★1つの ことを 2か所に 書かない、が この repo の 決めです。
//
//   ★★いまは、★誰にも 1文が 出ません。
//     ★いちばん 書いている方で 21日です（★2026-09-09 の 実測）。
//     ★★だから ⑫「まだ 出ていません」が、★ふだんの 画面です。
//     ★見本⑫「★これが ふだんの画面です。消えません」
//
//   ★見張り components/tests/compare-view.test.js
// ============================================================================

import { addDaysISO } from "@/lib/lookBack";
import { timeGapHours } from "@/lib/timeGap";
import { groupBDates } from "@/lib/compareGroups";
import { judgingLagOf } from "@/lib/lagChoice";
import { countsForJudging, isLaterWritten } from "@/lib/entrySource";
import { resolveMealMarks } from "@/lib/mealMarks";

/** ★「よく出た日」。★ご本人が 書いた 3択の うえに 立ちます。 */
export function isGoodDay(entry) {
  const v = entry && entry.throatCondition;
  return typeof v === "number" && Number.isFinite(v) && v >= 4;
}

/** ★「出なかった日」。★conditionWord の 切り方と そろえます。 */
export function isHardDay(entry) {
  const v = entry && entry.throatCondition;
  return typeof v === "number" && Number.isFinite(v) && v <= 2;
}

/**
 * ★時間差から、★どの日を 見るか。
 *
 *   ★prevNight　… ★前の日（★その日の 夜に 書いたこと）
 *   ★prevDay　　… ★前の日（★その日の 昼の おこない）
 *   ★twoDaysAgo … ★2日まえ
 *   ★sameMorning… ★その日
 *
 *   ★★前の夜と 前の日は、★同じ日付です。★取る欄が ちがいます。
 *     ★見本⑫が 4つに 分けているのは、★見る人に とっての 意味が ちがうからです。
 */
export function sourceDateOf(dateISO, lag) {
  if (lag === "twoDaysAgo") return addDaysISO(dateISO, -2);
  if (lag === "sameMorning") return dateISO;
  return addDaysISO(dateISO, -1);
}

/**
 * ★しらべる 項目の 取り出し方。
 *
 *   ★★ここに 無い項目は、★くらべられません。★足すときは ここへ。
 *   ★返すのは 数だけです。★言葉には しません（★画面が します）。
 */
export const EXTRACTORS = Object.freeze({
  dinnerToBed: (e) => timeGapHours(e.dinnerTime, e.bedtime),
  bedtime: (e) => {
    // ★寝た時刻は「0時50分」のように 日を またぎます。
    //   ★★18時より 前なら、★翌日の 未明と 見なして 24を 足します。
    //     ★そうしないと、0時50分（0.83）と 23時（23.0）が 遠く 離れます。
    if (!e.bedtime) return null;
    const [h, m] = String(e.bedtime).split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    const v = h + m / 60;
    return v < 18 ? v + 24 : v;
  },
  sungMinutes: (e) => {
    const acts = e.activities;
    if (!Array.isArray(acts)) return null;
    let total = 0, any = false;
    acts.forEach((a) => {
      const n = Number(a && a.minutes);
      if (Number.isFinite(n) && n > 0) { total += n; any = true; }
    });
    return any ? total : null;
  },
  speechMinutes: (e) => (typeof e.nonPerformanceSpeechMinutes === "number"
    ? e.nonPerformanceSpeechMinutes : null),
  sleepHours: (e) => (typeof e.sleepHours === "number" ? e.sleepHours : null),
  humidity: (e) => (typeof e.humidity === "number" ? e.humidity : null),
  temperature: (e) => (typeof e.temperature === "number" ? e.temperature : null),
  // ★印は「あった／なかった」です。★1 と 0 に します。
  markFat: (e) => (resolveMealMarks(e).includes("fat") ? 1 : 0),
  markAlcohol: (e) => (resolveMealMarks(e).includes("alcohol") ? 1 : 0)
});

/** ★まんなかの値。★平均では ありません。 */
export function median(xs) {
  const a = (xs || []).filter((v) => typeof v === "number" && Number.isFinite(v)).sort((x, y) => x - y);
  if (a.length === 0) return null;
  const mid = Math.floor(a.length / 2);
  return a.length % 2 === 0 ? (a[mid - 1] + a[mid]) / 2 : a[mid];
}

/**
 * ★くらべる の 中身を 組み立てます（★見本⑫）。
 *
 *   @param entries      ★{ 日付: 記録 }
 *   @param dates        ★見ている 日（★古い順）
 *   @param itemKey      ★しらべる 項目
 *   @param chosenLag    ★選んだ 時間差（★無ければ 既定）
 *   @param opts.firstDayOnly ★既定 true（★§1）
 *   @param opts.includeLater ★既定 false（★§7）
 *
 *   ★★点を 1つずつ 返します。★judged が false の 点は、★○で 描きます。
 *   ★★まんなかは、★judged の 点だけから 出します。
 *     ★見本⑫「○は…目では見えますが、★判定には 入れていません。」
 */
export function buildCompare(entries, dates, itemKey, chosenLag, opts = {}) {
  const firstDayOnly = opts.firstDayOnly !== false;
  const includeLater = opts.includeLater === true;
  const extract = EXTRACTORS[itemKey];
  if (!extract) return null;
  const lag = judgingLagOf(itemKey, chosenLag);
  const all = (dates || []).filter((d) => entries && entries[d]);

  const goodAll = all.filter((d) => isGoodDay(entries[d]));
  const hardAll = all.filter((d) => isHardDay(entries[d]));
  // ★★群Bだけ、★つづいた日を まとめます（★§1）。
  //   ★★群Aは まとめません。★「よく出た日」が つづくのは、ふつうのことです。
  const hardPicked = groupBDates(hardAll, firstDayOnly);

  const pointsOf = (days) => days.map((d) => {
    const src = sourceDateOf(d, lag);
    const e = src && entries ? entries[src] : null;
    if (!e) return null;
    const value = extract(e);
    if (typeof value !== "number" || !Number.isFinite(value)) return null;
    // ★★判定に 入れるかは、★2つの日の どちらも 見ます。
    //   ★★はじめ、★値を 取った日の 印だけで 決めていました。★足りません。
    //   ★思い出しの 偏りは、★おこないの ほうにも、
    //     ★★「その日 声が 出たか」の ほうにも かかります。
    //     ★あとから 書くとき、★人は 出なかった日を よく 覚えています。
    //   ★★どちらか 片方でも あとから書いたなら、★判定から 外します。
    //     ★きつい ほうへ 倒します。★間違った1文より、遅い1文の ほうが よい（★§1）。
    const out = entries[d];
    return {
      date: d, sourceDate: src, value,
      judged: countsForJudging(e.source, includeLater)
        && countsForJudging(out && out.source, includeLater),
      later: isLaterWritten(e.source) || isLaterWritten(out && out.source)
    };
  }).filter(Boolean);

  const good = pointsOf(goodAll);
  const hard = pointsOf(hardPicked);
  const judgedOf = (ps) => ps.filter((p) => p.judged).map((p) => p.value);

  return {
    itemKey, lag,
    good, hard,
    goodMedian: median(judgedOf(good)),
    hardMedian: median(judgedOf(hard)),
    // ★★数えた日は、★判定に 入れた ぶんだけ です。
    n: judgedOf(good).length + judgedOf(hard).length,
    nGood: judgedOf(good).length,
    nHard: judgedOf(hard).length,
    // ★目には 見えるが、★判定に 入れていない 点が あるか（★凡例を 出すため）
    anyLater: good.concat(hard).some((p) => p.later)
  };
}
