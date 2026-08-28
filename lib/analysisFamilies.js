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
