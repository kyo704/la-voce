// ============================================================================
// 症状を「感じた場所」でまとめる（受診用サマリー §1）
//
//   ★原因の系統（呼吸器系・消化器系・精神科領域…）で分けません。
//     それは診断です。このアプリは診断をしません。
//     ★「系」という字を、画面に出さないこと。
//
//   ★分けるのは「どこで感じたか」だけです。
//     のど／鼻・のどの奥／気分。場所の言葉だけを使います。
//
//   ★新しい項目を聞きません。
//     いま記録している8つの症状（SYMPTOM_OPTIONS）を、並べ替えるだけです。
//     胸やけ・呑酸・息継ぎのしにくさは★記録されていないので出しません
//     （2026-09-01 に確認。学ぶの記事に出てくるだけで、記録の項目には無い）。
//
//   ★出典 受診用サマリーの構成（Opus の裁定・2026-09-01）
// ============================================================================

/**
 * 症状 → 感じた場所。
 *
 * ★SYMPTOM_OPTIONS の8つを、すべてどこかに入れること。
 *   入れ忘れると components/tests/clinic-summary.test.js が落ちます。
 *   （落ちるようにしてあるのは、症状を足したときに
 *     ★どこで感じるものかを決めないまま出すと、場所の無い項目ができるためです）
 */
export const SYMPTOM_LOCATION = {
  "違和感": "のど",
  "乾燥": "のど",
  "嗄れ": "のど",
  "痛み": "のど",
  "裏返り": "のど",
  "喉の張り感": "のど",
  "鼻づまり": "鼻・のどの奥",
  "咳": "鼻・のどの奥"
};

/** 並べる順番。★場所の言葉だけ。「系」を使わないこと。 */
export const LOCATION_ORDER = ["のど", "鼻・のどの奥"];

/** 表の下に添える一文。★何を並べたのかを、必ず言うこと。 */
export const LOCATION_FOOTNOTE =
  "ご本人が選んだ項目を、感じた場所ごとに並べています。";

/**
 * 期間内の症状を、場所ごとに数える。
 *
 * ★1日も無かった場所は、返しません。
 *   見出しだけが残ると、「その場所は何も無かった」と読めてしまいます。
 *   ★「聞いていない」と「無かった」は別のことです。
 *
 * @returns {Array<{location: string, items: Array<{symptom: string, days: number}>}>}
 */
export function symptomsByLocation(entries, startDate, endDate) {
  const counts = {};
  Object.keys(entries || {})
    .filter((d) => d >= startDate && d <= endDate)
    .forEach((d) => {
      (entries[d].throatSymptoms || []).forEach((sym) => {
        const loc = SYMPTOM_LOCATION[sym];
        if (!loc) return;               // 場所の決まっていない症状は出さない
        counts[loc] = counts[loc] || {};
        counts[loc][sym] = (counts[loc][sym] || 0) + 1;
      });
    });
  return LOCATION_ORDER
    .filter((loc) => counts[loc] && Object.keys(counts[loc]).length > 0)
    .map((loc) => ({
      location: loc,
      // 多い順。★同じ日数なら、記録の並び順ではなく名前で決めます（揺れないため）
      items: Object.keys(counts[loc])
        .map((sym) => ({ symptom: sym, days: counts[loc][sym] }))
        .sort((a, b) => (b.days - a.days) || a.symptom.localeCompare(b.symptom))
    }));
}

/**
 * 夕食から就寝までの間隔（受診用サマリー §4）。
 *
 * ★逆流の分析（refluxDinnerGapBins）とは別のものです。
 *   あちらは「違和感が出た割合」を出します。★それは主張です。
 *   こちらは★記録した時刻をそのまま並べるだけです。
 *   受診用の1枚は「独自の指標を含めず、記録した内容をそのまま整理」する紙なので、
 *   割合ではなく、時刻と間隔を出します。
 *
 * ★病名（逆流性食道炎）の申告に関係なく、誰にでも出します。
 *   夕食の時刻と就寝の時刻は、誰でも記録できる項目だからです。
 */
export function dinnerToBedSummary(entries, startDate, endDate, gapHours) {
  const rows = [];
  Object.keys(entries || {})
    .filter((d) => d >= startDate && d <= endDate)
    .sort()
    .forEach((d) => {
      const e = entries[d];
      if (!e.dinnerTime || !e.bedtime) return;
      const gap = typeof gapHours === "function" ? gapHours(e.dinnerTime, e.bedtime) : null;
      rows.push({ date: d, dinner: e.dinnerTime, bed: e.bedtime, gap });
    });
  if (rows.length === 0) return null;
  const gaps = rows.map((r) => r.gap).filter((g) => typeof g === "number").sort((a, b) => a - b);
  const median = gaps.length
    ? (gaps.length % 2 ? gaps[(gaps.length - 1) / 2]
                       : (gaps[gaps.length / 2 - 1] + gaps[gaps.length / 2]) / 2)
    : null;
  return { days: rows.length, medianGapHours: median, rows };
}
