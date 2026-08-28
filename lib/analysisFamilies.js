// ============================================================================
// 検定の族（分析の検出力と族の設計.md §1）
//
// ★BH-FDR は「族ごとに独立して」かけます。全部まとめてかけません。
//   いま全部を1つの族にしていたため、項目が増えるほど検出力が落ち、
//   何も出なくなる方向に働いていました。
//
// ★3ゲート（件数・効果量・FDR）は変えません。§6-1 のままです。
//   変えるのは「何を検定するか」と「どう説明するか」だけです。
//   探索族はそもそも文章を出さないので、ゲートの対象外になります。
//   だから族を分けても、ガードレールは1ミリも緩みません。
//
// ★族の定義を画面ごとに書かないこと。ここ1か所だけが持ちます。
//   同じ決定が2か所にあると片方だけ変わる、というのを繰り返しています。
// ============================================================================

/**
 * 中核5項目（全職業共通）。
 * 全員が毎日記録するものから選びます。一部の人しか使わない機能は入れません。
 *
 *   ① 睡眠時間               中央値で二分
 *   ② 本番外の発話時間        中央値で二分
 *   ③ 絶対湿度               中央値で二分
 *   ④ 本番・レッスンの翌日か   二値
 *   ⑤ 起きたときのむくみ      なし / あり（1以上）
 *
 * 選んだ理由: 機序がはっきりしている／全員が記録する（群が偏らない）／
 * 二分したときに両群が10日以上たまりやすい。
 * ★「絶対湿度」は、湿度そのものより機序に近い（既存の計算をそのまま使う）。
 */
export const CORE_FAMILY = [
  "sleepHours",
  "offStageVoiceMinutes",
  "absoluteHumidity",
  "dayAfterPerformance",
  "morningEdema"
];

/**
 * ★周期・食事と就寝を中核に混ぜないこと。
 *   使っている人だけの分析なので、中核族の検出力を下げてしまいます。
 *   それぞれ独立した小さな族として扱います。
 */
export const FAMILIES = {
  core: CORE_FAMILY,
  cycle: ["cyclePhase"],
  reflux: ["mealToBedGap", "refluxFlags"]
  // explore はここに列挙しません。上のどれにも入らないものが、すべて探索族です。
};

export const EXPLORE = "explore";

/** その項目がどの族か。★どこにも入っていなければ探索族。 */
export function familyOf(key) {
  for (const [name, keys] of Object.entries(FAMILIES)) {
    if (keys.includes(key)) return name;
  }
  return EXPLORE;
}

/**
 * 探索族は、文章も数字も出しません。図だけです。
 * ★「まだ調べています」とだけ表示します。
 *   120日を超えたら、中核への昇格を検討します（同書 §1）。
 */
export function mayStateFinding(key) {
  return familyOf(key) !== EXPLORE;
}

/**
 * 検定する項目を、族ごとに分けて返す。
 * ★探索族は検定しません。計算もしなくて構いません。
 *
 * @param rows 各行に key を持つ配列
 * @returns { core: [...], cycle: [...], reflux: [...] }  ★explore は含めません
 */
export function groupByFamily(rows) {
  const out = {};
  Object.keys(FAMILIES).forEach((name) => { out[name] = []; });
  (rows || []).forEach((r) => {
    const fam = familyOf(r && r.key);
    if (fam === EXPLORE) return;   // ★検定しない
    out[fam].push(r);
  });
  return out;
}

/** 探索族だと分かっているときに出す文言。★数字を添えないこと。 */
export const EXPLORE_NOTE = "まだ調べています。";

// ---------------------------------------------------------------------------
// 中核の値を、記録から取り出す
//
//   ★①〜④は、すでに記録しているものから導けます。新しい記録は要りません。
//   ★⑤ 起きたときのむくみ は、記録する場所がまだありません。
//     欄を1つ増やす話なので、坂本さんの判断待ちです
//     （作業中の状態 §5.14）。中核が4項目でも、15項目を1つの族に
//     していたこれまでより、BH-FDR の検出力はずっと高くなります。
//
//   ★取り出し方をここに集めるのは、画面ごとに書くと必ず食い違うためです。
// ---------------------------------------------------------------------------

/** Magnus 式による絶対湿度（g/m³）。相対湿度は気温で意味が変わるため。 */
export function absoluteHumidityOf(tempC, rhPercent) {
  if (typeof tempC !== "number" || typeof rhPercent !== "number") return null;
  const es = 6.112 * Math.exp((17.67 * tempC) / (tempC + 243.5));
  return (216.7 * es * rhPercent / 100) / (273.15 + tempC);
}

/** 本番・レッスンをした日か（④の材料。前日を見るのは呼ぶ側） */
export function hadPerformanceOrLesson(entry) {
  const acts = (entry && entry.activities) || [];
  return acts.some((a) => a && (a.kind === "本番" || a.kind === "レッスン"));
}

/**
 * その日の中核の値。★足りないものは null にする（0 で埋めない）。
 * 0 で埋めると「記録していない」が「0だった」に化けます。
 *
 * @param entry     その日の記録
 * @param prevEntry 前日の記録（④に使う）。無ければ null。
 */
export function coreFactorValues(entry, prevEntry) {
  const e = entry || {};
  return {
    // ① 睡眠時間
    sleepHours: typeof e.sleepHours === "number" ? e.sleepHours : null,
    // ② 本番外の発話時間（分）
    offStageVoiceMinutes: typeof e.nonPerformanceSpeechMinutes === "number"
      ? e.nonPerformanceSpeechMinutes : null,
    // ③ 絶対湿度（気温と相対湿度から）
    absoluteHumidity: absoluteHumidityOf(e.temperature, e.humidity),
    // ④ 本番・レッスンの翌日か（二値）。★前日の記録が無ければ null。
    //   「前日の記録が無い」と「前日は何もしなかった」は別。
    dayAfterPerformance: prevEntry ? (hadPerformanceOrLesson(prevEntry) ? 1 : 0) : null,
    // ⑤ 起きたときのむくみ … 記録する場所がまだない（§5.14）
    morningEdema: null
  };
}

/** 中央値で二分する。★同値は下の群へ入れる（境目の扱いを1か所で決める）。 */
export function splitAtMedian(rows, valueOf, outcomeOf) {
  const usable = (rows || [])
    .map((r) => ({ v: valueOf(r), y: outcomeOf(r) }))
    .filter((x) => typeof x.v === "number" && typeof x.y === "number");
  if (usable.length < 4) return null;
  const sorted = usable.map((x) => x.v).sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  const high = usable.filter((x) => x.v > median).map((x) => x.y);
  const low = usable.filter((x) => x.v <= median).map((x) => x.y);
  return { median, high, low };
}

/** 二値の項目を分ける（④のように 0/1 のもの） */
export function splitAtBinary(rows, valueOf, outcomeOf) {
  const usable = (rows || [])
    .map((r) => ({ v: valueOf(r), y: outcomeOf(r) }))
    .filter((x) => (x.v === 0 || x.v === 1) && typeof x.y === "number");
  if (usable.length < 4) return null;
  return {
    median: null,
    high: usable.filter((x) => x.v === 1).map((x) => x.y),
    low: usable.filter((x) => x.v === 0).map((x) => x.y)
  };
}

/** その中核項目が、二分か二値か */
export const CORE_SPLIT = {
  sleepHours: "median",
  offStageVoiceMinutes: "median",
  absoluteHumidity: "median",
  dayAfterPerformance: "binary",
  morningEdema: "binary"
};

/** いま実際に検定できる中核項目（記録する場所があるものだけ） */
export function availableCoreFactors() {
  return CORE_FAMILY.filter((k) => k !== "morningEdema");
}
