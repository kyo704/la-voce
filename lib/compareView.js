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
import { judgingLagOf, wordOfItem } from "@/lib/lagChoice";
import { computeHedgesG, tDistPValue } from "@/lib/analysisCore";
import {
  NARRATIVE_MIN_N_PER_GROUP, NARRATIVE_FDR_Q, minEffectSizeFor
} from "@/lib/displayGates";
import { countsForJudging, isLaterWritten } from "@/lib/entrySource";
import { resolveMealMarks } from "@/lib/mealMarks";

// ★★2026-09-11、★読む列を 直しました。
//   ★★動く見本の 図の 名前は「よく出た日」「出なかった日」です。
//     ★★これは 声の 出来（出た／ふつう／出づらい）の ことです。
//   ★★前は throatCondition（★のどの 身体感覚）を 読んでいました。
//     ★9月9日の 古い見本は 3択が 1つだけで、★2つが 同じ列に 乗っていました。
//   ★★正しい 見本は 3択が 2つです ──
//     ★のどの 調子（よい／ふつう／わるい）→ throat_condition
//     ★声の 出来（出た／ふつう／出づらい）→ voice_quality
//   ★★のどの調子で 群を 分けると、★図の 名前と 中身が ずれます。

/** ★「よく出た日」。★ご本人が 書いた 3択（★声の 出来）の うえに 立ちます。 */
export function isGoodDay(entry) {
  const v = entry && entry.voiceQuality;
  return typeof v === "number" && Number.isFinite(v) && v >= 4;
}

/** ★「出なかった日」。★conditionWord の 切り方と そろえます。 */
export function isHardDay(entry) {
  const v = entry && entry.voiceQuality;
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
  speechMinutes: (e) => {
    if (!e) return null;
    if (typeof e.nonPerformanceSpeechMinutes === "number" && Number.isFinite(e.nonPerformanceSpeechMinutes)) {
      return e.nonPerformanceSpeechMinutes;
    }
    if (typeof e.speechMinutes === "number" && Number.isFinite(e.speechMinutes)) {
      return e.speechMinutes;
    }
    if (typeof e.speech_minutes === "number" && Number.isFinite(e.speech_minutes)) {
      return e.speech_minutes;
    }
    if (typeof e.offStageVoiceMinutes === "number" && Number.isFinite(e.offStageVoiceMinutes)) {
      return e.offStageVoiceMinutes;
    }
    if (typeof e.voiceMinutes === "number" && Number.isFinite(e.voiceMinutes)) {
      return e.voiceMinutes;
    }
    if (typeof e.activityDuration === "number" && Number.isFinite(e.activityDuration)) {
      return e.activityDuration;
    }
    if (typeof e.activity_duration === "number" && Number.isFinite(e.activity_duration)) {
      return e.activity_duration;
    }
    if (Array.isArray(e.activities)) {
      let sum = 0, found = false;
      e.activities.forEach((a) => {
        const m = Number(a && (a.minutes || a.duration));
        if (Number.isFinite(m) && m > 0) {
          sum += m;
          found = true;
        }
      });
      if (found) return sum;
    }
    return null;
  },
  sleepHours: (e) => (typeof e.sleepHours === "number" ? e.sleepHours : null),
  // ★★2026-09-11、★足しました。★0／1／2 の 3段です。
  //   ★毎朝 聞いているのに、★調べる 側に 取り出し方が ありませんでした。
  morningEdema: (e) => (typeof e.morningEdema === "number" ? e.morningEdema : null),
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


// ============================================================================
// 3つの門 ── 1文を 出してよいか
//
//   ★出どころ 動く見本 kuraberu()
//     「1文は、3つの門（10日以上／差の大きさ／q）を 通ったときだけ 出ます。」
//     「2番目から先の 結果は 出しません。止まった理由だけ 出します。」
//
//   ★★門の 数そのものは lib/displayGates.js が 持ちます。★ここでは 決めません。
//     ★① 群ごとに 10日以上　　NARRATIVE_MIN_N_PER_GROUP
//     ★② 差の 大きさ　　　　　minEffectSizeFor(調べた数)
//     ★③ q < 0.10　　　　　　 NARRATIVE_FDR_Q
//
//   ★★調べるのは 1番目だけです（★固定順序）。★だから 調べた数は 1、
//     ★上のせは 0 で、★しきい値は 0.50 の ままです
//     （★見本「1番目だけ、補正なしで 見ます」）。
//     ★★2番目から先を 調べないので、★q は そのまま p です（★BH は m=1）。
//
//   ★★この帳面は、★「出す／出さない」と「止まった理由」しか 返しません。
//     ★言葉の 組み立ては 画面が します。★数は ここで 決めます。
// ============================================================================

/** ★止まった 理由。★どれで 止まったかを、★1つだけ 返します。 */
export const STOP_DAYS = "days";        // ★① 日数が 足りない
export const STOP_EFFECT = "effect";    // ★② 差が 小さい
export const STOP_Q = "q";              // ★③ たまたまと 見分けられない
export const STOP_NO_DATA = "noData";   // ★点が 無い

/**
 * ★2つの群の 差を 調べます。
 *
 *   @param data     buildCompare が 返したもの
 *   @param chosen   ★調べた 数（★固定順序なので ふつう 1）
 *
 *   @returns { shown, stop, n, nGood, nHard, g, q, minG, direction }
 *     ★shown … ★1文を 出してよいか
 *     ★stop　… ★出さないとき、★どの門で 止まったか
 *     ★direction … ★"high" なら 出なかった日の ほうが 値が 大きい
 *
 *   ★★確率を 画面に 出しません（★見本の 但し書き）。
 *     ★q は 出します。★「確率」とは 別のものです。
 */
export function compareVerdict(data, chosen = 1) {
  const base = {
    shown: false, stop: STOP_NO_DATA,
    n: 0, nGood: 0, nHard: 0, g: null, q: null,
    minG: minEffectSizeFor(chosen), direction: null
  };
  if (!data) return base;
  const goodVals = data.good.filter((p) => p.judged).map((p) => p.value);
  const hardVals = data.hard.filter((p) => p.judged).map((p) => p.value);
  const out = { ...base, n: data.n, nGood: goodVals.length, nHard: hardVals.length };
  if (goodVals.length === 0 && hardVals.length === 0) return out;

  // ★① 群ごとに 10日以上。★片方だけ 多くても 通しません。
  if (goodVals.length < NARRATIVE_MIN_N_PER_GROUP
    || hardVals.length < NARRATIVE_MIN_N_PER_GROUP) {
    return { ...out, stop: STOP_DAYS };
  }

  // ★出なかった日を 群1に します。★向きが そのまま 文の 向きに なります。
  const res = computeHedgesG(hardVals, goodVals);
  if (!res) return { ...out, stop: STOP_EFFECT };
  const g = res.g;
  const direction = g >= 0 ? "high" : "low";

  // ★② 差の 大きさ
  if (!(Math.abs(g) >= out.minG)) {
    return { ...out, g, direction, stop: STOP_EFFECT };
  }

  // ★③ q。★調べたのは 1つなので、★BH の 補正は かかりません（m = 1）。
  const n1 = hardVals.length, n0 = goodVals.length;
  const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  const varOf = (a, m) => a.reduce((s, v) => s + (v - m) * (v - m), 0) / (a.length - 1);
  const m1 = mean(hardVals), m0 = mean(goodVals);
  const sp = Math.sqrt(((n1 - 1) * varOf(hardVals, m1) + (n0 - 1) * varOf(goodVals, m0))
    / (n1 + n0 - 2));
  if (!(sp > 0)) return { ...out, g, direction, stop: STOP_EFFECT };
  const tStat = (m1 - m0) / (sp * Math.sqrt(1 / n1 + 1 / n0));
  const q = tDistPValue(tStat, n1 + n0 - 2);
  if (!(q < NARRATIVE_FDR_Q)) {
    return { ...out, g, q, direction, stop: STOP_Q };
  }
  return { ...out, shown: true, stop: null, g, q, direction };
}

/**
 * ★1文（★見本の ピンクの 1枚）。
 *
 *   ★★「〜の あと、声が 出づらいことが 多いようです。」
 *     ★★原因とは 言いません。★「多いようです」で 止めます。
 *   ★★通っていない ときは null。★画面が 但し書きを 出します。
 */
export function compareSentence(itemKey, verdict) {
  if (!verdict || !verdict.shown) return null;
  const word = wordOfItem(itemKey, verdict.direction);
  if (!word) return null;
  return `${word}日の あと、声が 出づらいことが 多いようです。`;
}
