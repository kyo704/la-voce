// ============================================================================
// ★訳してはいけない日本語（多言語対応（伊英中）.md §2）
//
//   ここに並ぶ日本語は、画面の文字ではありません。
//   ★データベースに保存されている「値」であり、計算の鍵です。
//
//   訳した瞬間に、過去の記録が引けなくなり、発声負荷の計算が壊れます。
//   影響は「表示が変」では済みません。記録した事実が失われます。
//
//   ★この一覧は、消すことはあっても、消すのは列ごと数えてからです。
//     足すのは自由です。迷ったら足してください。
//
//   正しい形（保存する値と、画面に出す文字を分ける）は既にあります:
//       { key: "休養", labelKey: "activityRest" }
//       NUTRITION_PHASE_KEYS = { "維持": "phaseMaintain", ... }
//   同じ形を、残りにも広げるだけです。新しい発明は要りません。
// ============================================================================

/** 活動の種類。entries.activity_type / activity.kind に入る。 */
export const ACTIVITY_KINDS = ["休養", "自主練習", "レッスン", "リハーサル", "本番"];

/** 声種。profiles.voice_type に入る。 */
export const VOICE_TYPE_VALUES = [
  "ソプラノ", "メゾソプラノ", "アルト", "カウンターテナー",
  "テノール", "バリトン", "バス", "その他"
];

/** 栄養のフェーズ。profiles.nutrition_phase に入る。 */
export const NUTRITION_PHASE_VALUES = ["維持", "増量", "減量"];

/** 記録の場面。voice_checkins の鍵に入る。 */
export const TIME_SLOT_VALUES = ["朝", "昼", "晩"];

/**
 * 保存される日本語の全部。
 * ★i18n の作業では、この一覧に載っている文字列を
 *   翻訳キーに置き換えてはいけません。
 */
export const STORED_JAPANESE = [
  ...ACTIVITY_KINDS,
  ...VOICE_TYPE_VALUES,
  ...NUTRITION_PHASE_VALUES,
  ...TIME_SLOT_VALUES
];

/** その文字列は、保存される値か。 */
export function isStoredValue(text) {
  return typeof text === "string" && STORED_JAPANESE.includes(text.trim());
}

/**
 * どの列に保存されるか（なぜ訳せないかを説明するため）。
 * ★エラーメッセージや監査の出力で使います。
 */
export const STORED_IN = {
  活動の種類: "entries.activity_type / activities[].kind（発声負荷の重みの鍵でもある）",
  声種: "profiles.voice_type",
  栄養のフェーズ: "profiles.nutrition_phase",
  記録の場面: "entries.voice_checkins の鍵"
};
