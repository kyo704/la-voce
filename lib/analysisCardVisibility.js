// ============================================================================
// 分析カードの職業別の出し分け
//
// ★この表は docs/profession-presets.json の analysisCardVisibility と
//   1対1で対応しています（components/tests/profession-visibility.test.js が
//   2つのズレを検出します）。設計書を更新したら、こちらも更新してください。
//
// なぜ必要か:
//   改善タスクv2 §4-1(a) でロックカードを最下部に集約したところ、その人の職業に
//   関係ない分析まで「あと14日で解放されます」と並ぶようになってしまった。
//   このアプリは記録画面も学ぶ画面も職業ごとに出し分けているので、ここだけ
//   原則から外れるのは一貫性を欠く。
// ============================================================================

// アプリ内部の職業ID（profiles.vocal_profession / professions）と、
// 設計書・学ぶコンテンツ側の職業IDの対応。
// ★2つのID体系が併存しているのは歴史的な事情。新しく書くコードは
//   設計書側のID（ハイフン区切り）を正とし、この表で変換すること。
export const APP_TO_DESIGN_PROFESSION = {
  singer: "classical-musical",
  announcer: "announcer",
  voice_actor: "voice-actor",
  pop_musical: "pops-rock"
};

// docs/profession-presets.json の analysisCardVisibility をそのまま写したもの。
// "*" は全職業に表示する。
export const ANALYSIS_CARD_VISIBILITY = {
  "shout-recovery-curve": ["voice-actor"],
  "shout-take-threshold": ["voice-actor"],
  "passaggio-stability": ["classical-musical", "pops-rock"],
  "speaking-pitch-diurnal": ["announcer", "voice-actor"],
  "tour-endurance-curve": ["classical-musical", "pops-rock"],
  "performance-peaking-curve": ["classical-musical", "pops-rock", "voice-actor"],
  "reverberance-trend": ["*"],
  "environment-comfort-zone": ["*"]
};

/**
 * そのカードを、いまの職業設定のユーザーに見せてよいか。
 *
 * @param {string} cardId  設計書のカードID
 * @param {string[]} appProfessions  アプリ内部の職業ID（例: ["singer"]）
 * @returns {boolean}
 *
 * 表に載っていないカード（偏差値・ウォームアップ効率など、職業を問わないもの）は
 * 常に表示する。表に載っているカードだけが、職業で絞られる。
 */
export function isAnalysisCardVisible(cardId, appProfessions) {
  const allowed = ANALYSIS_CARD_VISIBILITY[cardId];
  if (!allowed) return true;          // 表に無い＝職業を問わない
  if (allowed.includes("*")) return true;
  const list = Array.isArray(appProfessions) ? appProfessions : [];
  return list.some((p) => allowed.includes(APP_TO_DESIGN_PROFESSION[p] || p));
}
