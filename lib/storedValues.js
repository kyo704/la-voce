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

/**
 * 伴奏（用語辞書の拡張と嗜好品の記録.md §5）。
 * entries の活動ブロック detail.accompaniment に入ります。
 *
 * ★出す職業は classical / musical / pops だけ（§5）。
 *   声優・ナレーター・アナウンサーには出しません。
 *
 * ★v1 では負荷の計算に一切入れないこと（§5-1）。記録するだけです。
 *   伴奏の大きさは、既存の「騒音」「モニター環境」の係数と重なります。
 *   未較正の定数をもう1つ足すと、既存の分析が濁ります。
 *   データが貯まってから、実測で決めます。
 *
 * ★key が保存される値、label は画面に出す文字。訳さないこと。
 */
export const ACCOMPANIMENT_OPTIONS = [
  { key: "piano",     label: "ピアノ" },
  { key: "orchestra", label: "オーケストラ" },
  { key: "band",      label: "バンド" },
  { key: "track",     label: "音源（カラオケ・CD）" },
  { key: "acappella", label: "アカペラ・無伴奏" },
  { key: "other",     label: "その他" }
];

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
 * 登録画面で「学生です」に印を付けた人の職業。profiles.occupation に入る。
 * ★2026-08-29 に追加。多言語の棚卸しで漏れが見つかりました。
 *   components/SignupForm.jsx が
 *     occupation: form.isStudent ? "学生" : form.occupation
 *   として、この固定の文字列を保存しています。
 *   訳すと、管理画面の一覧と本人の書き出しに、言語ごとに違う値が並びます。
 *   ★profiles.occupation は登録時の自由記述の列で、この機能とは別物です
 *     （11分類の職業は voice_occupation）。
 */
export const SIGNUP_STUDENT_VALUE = "学生";

/**
 * 保存される日本語の全部。
 * ★i18n の作業では、この一覧に載っている文字列を
 *   翻訳キーに置き換えてはいけません。
 */
export const STORED_JAPANESE = [
  ...ACTIVITY_KINDS,
  ...VOICE_TYPE_VALUES,
  ...NUTRITION_PHASE_VALUES,
  ...TIME_SLOT_VALUES,
  SIGNUP_STUDENT_VALUE
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
