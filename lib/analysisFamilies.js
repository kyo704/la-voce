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
/**
 * 嗜好品の族（用語辞書の拡張と嗜好品の記録.md §7-4）。
 *
 * ★中核5項目に入れないこと（憲章 §3-1「任意項目は必ず別の族」）。
 *   任意の項目を中核に混ぜると、答えた人と答えない人で分母が変わります。
 *
 * ★この2つの中だけで BH-FDR を掛けます。3ゲートは例外なく適用します。
 *
 * ★飲酒は、食事のタグ「遅い時間にお酒」と★別の族です（§7-3）。
 *   こちらは脱水・粘膜への影響、あちらは逆流への影響を見ています。
 *   二重に数えないため、族を分けます。既存のタグは消しません。
 */
export const LUXURY_FAMILY = ["smokedToday", "drankToday"];

export const LUXURY_LABELS = {
  smokedToday: "たばこを吸った日",
  drankToday: "お酒を飲んだ日"
};

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
  // ★周期は「在周期中かどうか」の二値で見ます。位相（何日目か）で区切りません。
  //   区切り方そのものが結論を作ってしまうためです。分析画面の描画仕様 §3-G で、
  //   1〜7/8〜14/15〜21/22〜 の4分割をやめたのと同じ理由です。
  //   二値なら、どこで切るかを決める必要がありません。
  cycle: ["inCycle"],
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
  // ★同じ理由で、片方が空なら出しません（全部が同じ値だったとき）。
  if (high.length === 0 || low.length === 0) return null;
  return { median, high, low };
}

/** 二値の項目を分ける（④のように 0/1 のもの） */
export function splitAtBinary(rows, valueOf, outcomeOf) {
  const usable = (rows || [])
    .map((r) => ({ v: valueOf(r), y: outcomeOf(r) }))
    .filter((x) => (x.v === 0 || x.v === 1) && typeof x.y === "number");
  if (usable.length < 4) return null;
  const high = usable.filter((x) => x.v === 1).map((x) => x.y);
  const low = usable.filter((x) => x.v === 0).map((x) => x.y);
  // ★片方の群にしかデータが無ければ、結果を出しません。
  //   比べる相手がいない状態で効果量を出すと、意味の無い数字が出ます。
  //   周期でいえば「記録した期間しか記録が無い日々」がこれにあたります。
  if (high.length === 0 || low.length === 0) return null;
  return { median: null, high, low };
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

// ---------------------------------------------------------------------------
// 中核の群間比較を組み立てる
//
//   ★何日ずらすかは項目ごとに違います。ここで宣言し、画面に書かせません。
//
//     ① 睡眠時間        … その日の朝までの睡眠なので、ずらさない
//     ② 本番外の発話時間 … 前日に話した分が翌日に出るので、1日ずらす
//     ③ 絶対湿度        … その日の環境なので、ずらさない
//     ④ 本番の翌日か     … 「前日が本番だったか」なので、作り方の中で既にずれている
//
//   ★②だけ1日ずらすのは、既存の「効いた習慣ランキング」（前日の行動→翌日の声）と
//     同じ考え方です。同じ決まりを2つの場所で別々に決めないこと。
// ---------------------------------------------------------------------------
export const CORE_LAG_DAYS = {
  sleepHours: 0,
  offStageVoiceMinutes: 1,
  absoluteHumidity: 0,
  dayAfterPerformance: 0,
  morningEdema: 0
};

function shiftDate(dateISO, days) {
  const d = new Date(`${dateISO}T00:00:00`);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${da}`;
}

/**
 * 中核の各項目について、2つの群を作る。
 * ★検定そのものはここでしません。群を作るところまでです。
 *   効果量の計算は画面側の computeHedgesG が持っており、
 *   計算式を2か所に置かないためです。
 *
 * @param entriesByDate  { "YYYY-MM-DD": entry }
 * @param outcomeOf      その日の記録から、見たい値を取り出す関数
 * @returns [{ key, split: { median, high[], low[] } }]  ★群が作れなかった項目は落とす
 */
export function buildCoreGroups(entriesByDate, outcomeOf) {
  const dates = Object.keys(entriesByDate || {}).sort();
  const out = [];
  availableCoreFactors().forEach((key) => {
    const lag = CORE_LAG_DAYS[key] || 0;
    // 「その日の結果」と「原因の日の値」を組にする
    const rows = dates.map((d) => {
      const outcome = outcomeOf(entriesByDate[d]);
      const causeDate = lag === 0 ? d : shiftDate(d, -lag);
      const causeEntry = entriesByDate[causeDate];
      if (!causeEntry) return null;   // ★原因の日の記録が無ければ、その日は使わない
      const prev = entriesByDate[shiftDate(causeDate, -1)] || null;
      const values = coreFactorValues(causeEntry, prev);
      return { v: values[key], y: outcome };
    }).filter(Boolean);
    const split = CORE_SPLIT[key] === "binary"
      ? splitAtBinary(rows, (r) => r.v, (r) => r.y)
      : splitAtMedian(rows, (r) => r.v, (r) => r.y);
    if (split) out.push({ key, split });
  });
  return out;
}

/** 中核項目の、画面に出す名前。★族の定義と同じ場所で持つ。 */
export const CORE_LABELS = {
  sleepHours: "睡眠時間",
  offStageVoiceMinutes: "本番外の発話時間",
  absoluteHumidity: "絶対湿度",
  dayAfterPerformance: "本番・レッスンの翌日",
  morningEdema: "起きたときのむくみ"
};

/** 群の名前（高いほう／低いほう）。★二値のときは意味が変わる。 */
export function groupLabelsFor(key) {
  if (CORE_SPLIT[key] === "binary") return { high: "その翌日", low: "それ以外の日" };
  return { high: `${CORE_LABELS[key]}が多い日`, low: `${CORE_LABELS[key]}が少ない日` };
}

// ---------------------------------------------------------------------------
// 周期の族（分析の検出力と族の設計.md §1-2）
//
//   ★中核に混ぜません。使っている人だけの分析なので、混ぜると
//     全員が記録する4項目の検出力まで下げてしまいます。
//     独立した小さな族として、この中だけで BH-FDR をかけます。
//
//   ★「在周期中かどうか」だけを見ます。位相の呼び名は使いません
//     （周期記録の設計.md §2）。日数も保存しません。導出するだけです。
//
//   ★在周期中かどうかの判定は lib/cyclePeriods.js の buildBleedingDayset に
//     任せます。終了日の押し忘れの扱いと上限が、あちらに書いてあるためです。
//     ここで数え直すと、同じ決定が2か所になります。
// ---------------------------------------------------------------------------
export const CYCLE_FACTOR = "inCycle";
export const CYCLE_LABEL = "周期の記録がある日";

export function cycleGroupLabels() {
  return { high: "記録した期間の中の日", low: "それ以外の日" };
}

/**
 * 周期の族の群を作る。
 * @param entriesByDate  { "YYYY-MM-DD": entry }
 * @param bleedingDays   buildBleedingDayset() が返す Set
 * @param outcomeOf      その日の記録から、見たい値を取り出す関数
 */
export function buildCycleGroups(entriesByDate, bleedingDays, outcomeOf) {
  if (!bleedingDays || bleedingDays.size === 0) return null;
  const rows = Object.keys(entriesByDate || {}).map((d) => ({
    v: bleedingDays.has(d) ? 1 : 0,
    y: outcomeOf(entriesByDate[d])
  }));
  return splitAtBinary(rows, (r) => r.v, (r) => r.y);
}
