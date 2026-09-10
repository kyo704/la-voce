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
 * ★上下に 並べる もの（★レーン）。
 *
 *   ★出どころ 動く見本-PC・iPad（個人）.html の var ITEMS
 *            ＋ 裁定-ふりかえる・とだな・もっと（9月10日 その7）§1-2
 *   ★★見本の 5本 ──
 *     声の 出来／のどの 調子／起きたときの むくみ／声を 使った 時間／昨夜の 睡眠
 *
 *   ★★これに 2本 足しました（★坂本さんの お決め・2026-09-11 ①）。
 *     ★営業資料 v5 の 1ページ目が、こう 言っているためです ──
 *       「Woolsong は、声の調子と、★眠りと、★夕食の時刻と、★湿度を、
 *         同じ日付の軸に上下に並べます」
 *     ★★見本の 5本に、★夕食の時刻と 湿度が ありませんでした。
 *       ★売り文句と 見本が 食い違っていました。★両方 満たします。
 *
 *   ★★同時に 出せるのは 5本までです（★裁定 §1-2「レーンは 5本まで」）。
 *   ★★1つは 残します（★同「1つは 残します」）。★空の 図を 出さない ため。
 *
 *   ★★色は 2系統だけです（★裁定 §1-3）。
 *     ★◎○△ の もの … えんじの 濃淡（.95 / .66 / .42）
 *     ★量の もの　　 … みどりの 濃淡（.95 / .75 / .60 / .45）
 *   ★★系列ごとに 別の 色相を 使いません（★tokens.md）。
 *     ★見本は いちど 5色に していて、★信号色に 見えると 直されました。
 */
export const LANES = Object.freeze([
  { key: "voice", label: "声の 出来", tone: "enji", opacity: 0.95, scale: "three", field: "voiceQuality" },
  { key: "nodo", label: "のどの 調子", tone: "enji", opacity: 0.66, scale: "three", field: "throatCondition" },
  { key: "muku", label: "起きたときの むくみ", tone: "enji", opacity: 0.42, scale: "three", field: "morningEdema" },
  { key: "sing", label: "声を 使った 時間", tone: "midori", opacity: 0.95, scale: "n", unit: "分", field: "nonPerformanceSpeechMinutes" },
  { key: "sleep", label: "昨夜の 睡眠", tone: "midori", opacity: 0.60, scale: "n", unit: "時間", field: "sleepHours", decimals: 1 },
  // ★★下の 2つが、★営業資料の 売り文句の ぶんです。
  { key: "yuu", label: "食べ終えてから 寝るまで", tone: "midori", opacity: 0.75, scale: "n", unit: "時間", decimals: 1 },
  { key: "shitsu", label: "湿度", tone: "midori", opacity: 0.45, scale: "n", unit: "%", field: "humidity" }
]);

/** ★同時に 出せる 数（★裁定 §1-2）。 */
export const LANE_MAX = 5;
/** ★いちばん 少ないとき（★1つは 残します）。 */
export const LANE_MIN = 1;

/** ★はじめに 出ている もの。★見本の 5本です。 */
export const LANE_DEFAULT = Object.freeze(["voice", "nodo", "muku", "sing", "sleep"]);

export function laneOf(key) {
  return LANES.find((l) => l.key === key) || null;
}

/**
 * ★その日の、その レーンの 値。
 *
 *   ★★書いていない 日は null です。★0 で 埋めません。
 *   ★★「食べ終えてから 寝るまで」だけ、★2つの 欄から 出します。
 *     ★夕食の 時刻と 就寝の 時刻の 差です。★日を またぎます。
 */
export function laneValue(entry, key) {
  if (!entry) return null;
  const lane = laneOf(key);
  if (!lane) return null;
  if (key === "yuu") {
    const d = hourOfClock(entry.dinnerTime);
    const b = hourOfClock(entry.bedtime);
    if (d == null || b == null) return null;
    let gap = b - d;
    if (gap < 0) gap += 24;
    // ★★12時間を 超えるのは、★書き間違いか、★昼に 食べて 夜 寝た 日です。
    //   ★どちらも「食べ終えてから 寝るまで」では ありません。★出しません。
    return gap > 12 ? null : gap;
  }
  const v = entry[lane.field];
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/** ★「23:30」を 0時からの 時間に。★読めなければ null。 */
export function hourOfClock(hhmm) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || ""));
  if (!m) return null;
  const h = Number(m[1]), mi = Number(m[2]);
  if (h > 23 || mi > 59) return null;
  return h + mi / 60;
}

/**
 * ★レーンを 出し入れします。
 *
 *   @returns {string[]|null}  ★変えられない ときは null（★理由は 呼ぶ側が 出します）
 */
export function toggleLane(keys, key) {
  const cur = Array.isArray(keys) ? keys.filter((k) => laneOf(k)) : [];
  if (!laneOf(key)) return null;
  if (cur.includes(key)) {
    // ★★1つは 残します。★空の 図を 出さない ため。
    if (cur.length <= LANE_MIN) return null;
    return cur.filter((k) => k !== key);
  }
  // ★★5本まで。★増やしすぎると、★1本ずつが つぶれて 読めません。
  if (cur.length >= LANE_MAX) return null;
  // ★並びは LANES の 順に そろえます。★押した 順に しません。
  return LANES.filter((l) => cur.includes(l.key) || l.key === key).map((l) => l.key);
}

/** ★出し入れできない ときの わけ。★1文字も 変えないこと。 */
export const LANE_MIN_REASON = "1つは 残します";
export const LANE_MAX_REASON = "同時に 出せるのは 5つまでです";

/**
 * ★数えたもの（★見本の 表）。
 *
 *   ★★いちばん 多い日／いちばん 少ない日／まんなか の 3つだけです。
 *   ★★平均を 出しません（★裁定 §1-2「★平均を 出しません（合成した 数だからです）」）。
 *   ★★書いていない 日は 数に 入れません。★0 として 数えません。
 */
export function laneSummary(entries, dates, key) {
  const vals = (dates || [])
    .map((d) => laneValue((entries || {})[d], key))
    .filter((v) => v != null)
    .sort((a, b) => a - b);
  if (vals.length === 0) return null;
  return {
    most: vals[vals.length - 1],
    least: vals[0],
    middle: vals[Math.floor(vals.length / 2)],
    days: vals.length
  };
}

/** ★◎○△ の 言葉（★見本の itVal）。★3段の ものだけです。 */
export const THREE_MARKS = Object.freeze(["", "△", "○", "◎"]);

/** ★値を、★画面の 言葉に します。 */
export function laneWord(key, v) {
  const lane = laneOf(key);
  if (!lane || v == null) return "";
  if (lane.scale === "three") return THREE_MARKS[Math.max(1, Math.min(3, Math.round(v)))];
  const n = lane.decimals ? Number(v).toFixed(lane.decimals) : String(Math.round(v));
  return n + (lane.unit || "");
}

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
