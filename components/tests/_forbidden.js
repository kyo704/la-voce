// ============================================================================
// ★他人に渡してはいけない領域の名前（守りのテスト3本.md §2）
//
//   ここに足すことはあっても、消すことはありません。
//   消したくなったら、それは「渡してよくなった」のではなく、
//   「渡してしまう実装を通したい」だけのことが多いためです。
// ============================================================================

// 周期・食事と就寝・振り返りに属するキー。
// ★startDate / endDate のような一般的な名前が入っているのは意図的です。
//   周期のテーブルをそのまま join して返す事故が、いちばん起きやすい形だからです。
//   このリポジトリでは他の用途で使っていないことを確認済み（lib/ 内は
//   cyclePeriods.js のみ。start_date / end_date の列を持つ表も cycle_periods だけ）。
const FORBIDDEN_KEYS = [
  // 周期（周期記録の設計.md §2）
  "cyclePeriod", "cyclePeriods", "cycleSetting", "cycleSettings",
  "cycle_periods", "cycle_start", "cycle_show_on_home",
  "startDate", "endDate", "start_date", "end_date",
  "bleedingDays", "cycleLength", "dayIndex", "phase", "cyclePhase",
  "hormonalTreatment", "trackCycle", "track_cycle",
  // 食事と就寝（食事と就寝の設計.md §2）
  "mealSleepLog", "mealSleepLogs", "refluxSetting", "refluxMarker",
  "meal_sleep_logs", "reflux_settings", "reflux_markers",
  "lastMealAt", "bedAt", "gapMinutes", "refluxFlags",
  "last_meal_at", "bed_at", "gap_minutes",
  // 振り返り（レッスンモードの解体.md §5-5）
  "feel", "reflectionFeel",
  // 記述式の答え（問いの形を記事ごとに分ける.md §5）
  // ★「音楽家の商い」の記述は、本人が自分の考えの変化を見るためのものです。
  //   分析にも統計にもAIにも渡しません。同期・共有・集計のどのペイロードにも
  //   本文が乗らないこと。書き出し（法定エクスポート）にだけ含めます。
  "reflectAnswer", "reflectAnswers", "promptIndex",
  "reflect_answer", "reflect_answers", "prompt_index"
];

// 値の中に紛れ込んだら困る語（日本語UIの文字列が混ざる事故を拾う）
const FORBIDDEN_SUBSTRINGS = [
  "生理", "月経", "周期日目", "逆流", "就寝時刻", "最後に食べた"
];

// ★本人には返さなければいけないもの（守りすぎの検査に使う）。
//   「全部返さない」実装にすると、テストは通っても製品が壊れます。
const OWNER_MUST_HAVE_KEYS = ["cycle_periods", "start_date"];

/** JSON のどの深さにあるキーでも、全部集める */
function collectKeys(value, out = new Set()) {
  if (Array.isArray(value)) {
    for (const v of value) collectKeys(v, out);
  } else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) { out.add(k); collectKeys(v, out); }
  }
  return out;
}

/** JSON の中の文字列を全部集める（値の中に混ざる事故を拾う） */
function collectStrings(value, out = []) {
  if (Array.isArray(value)) {
    for (const v of value) collectStrings(v, out);
  } else if (value && typeof value === "object") {
    for (const v of Object.values(value)) collectStrings(v, out);
  } else if (typeof value === "string") {
    out.push(value);
  }
  return out;
}

module.exports = {
  FORBIDDEN_KEYS, FORBIDDEN_SUBSTRINGS, OWNER_MUST_HAVE_KEYS,
  collectKeys, collectStrings
};
