// ============================================================================
// 記録項目のグループと、詳細度（かんたん記録／しっかり記録）
//
// ★表示・非表示の判定は、必ずこのファイルを通してください。
//   記録項目の再設計v2 §3.3 が明記しているとおり、各コンポーネントに
//   `if (detail >= 2)` を散らすと保守不能になります。
//   （表示ゲート・ロック判定でも同じ原則を採っています）
//
// 統合実行ルートv4 §4-1 が定めた3層:
//   コア（30秒で終わる）  喉のコンディション／声の出来／活動／睡眠時間
//   推奨                  起き抜けの音名／症状の有無／心の余裕／水分
//   詳細（任意）          食事・栄養・体重・環境・響きスコア・CPPS ほか
//
// ★禁止事項（v4 §11）:
//   かんたん記録を選んだ人に「未入力」「不足」「完了度◯%」を出さないこと。
//   かんたん記録は劣った記録ではなく、悪い日でも開ける道です（§2 瞬間④）。
// ============================================================================

export const RECORD_MODES = ["simple", "full"];
export const DEFAULT_RECORD_MODE = "full";  // 既存ユーザーの見え方を変えない

// tier: "core"（かんたんでも出す）/ "recommended"（しっかりで出す）/ "detail"（しっかりで出す・畳める）
// foldKey: 既存の profiles.folded_groups と対応するキー（無いものは畳めない）
export const FIELD_GROUPS = [
  // ---- コア: これだけで30秒で終わる ----
  { key: "voice", tier: "core", labelKey: "sectionVoiceThroat" },
  { key: "activity", tier: "core", labelKey: "sectionPractice" },
  { key: "sleep", tier: "core", labelKey: "sectionSleep" },

  // ---- 推奨: 分析から名指しで要求される層 ----
  { key: "noteName", tier: "recommended", labelKey: "labelWakeNote" },
  { key: "symptoms", tier: "recommended", labelKey: "labelThroatSymptoms" },
  { key: "mental", tier: "recommended", labelKey: "sectionMental" },
  { key: "hydration", tier: "recommended", labelKey: "sectionWater" },

  // ---- 詳細: 任意。畳める ----
  { key: "meal", tier: "detail", labelKey: "sectionMealDetail" },
  { key: "meal_detail", tier: "detail", labelKey: "sectionMealDetail", foldKey: "meal_detail" },
  { key: "body", tier: "detail", labelKey: "sectionBodyData" },
  { key: "body_fat", tier: "detail", labelKey: "sectionBodyData", foldKey: "body_fat" },
  { key: "env", tier: "detail", labelKey: "sectionClimate", foldKey: "environment" },
  { key: "exercise", tier: "detail", labelKey: "sectionExercise" },
  { key: "exercise_detail", tier: "detail", labelKey: "sectionExercise", foldKey: "exercise_detail" },
  { key: "cpps", tier: "detail", labelKey: "sectionVoiceThroat", foldKey: "cpps" },
  { key: "medication", tier: "detail", labelKey: "sectionBodyData", foldKey: "medication" },
  { key: "mental_detail", tier: "detail", labelKey: "sectionMental", foldKey: "mental_detail" },
  { key: "practiceNote", tier: "detail", labelKey: "sectionMemo" }
];

const BY_KEY = FIELD_GROUPS.reduce((a, g) => { a[g.key] = g; return a; }, {});

export function getFieldGroup(key) {
  return BY_KEY[key] || null;
}

/** かんたん記録で出すグループのキー一覧（＝30秒で終わる道）。 */
export const CORE_GROUP_KEYS = FIELD_GROUPS.filter((g) => g.tier === "core").map((g) => g.key);

/**
 * その項目グループを、いまの設定で表示してよいか。
 *
 * @param {string} key            FIELD_GROUPS の key
 * @param {object} ctx            { mode, foldedGroups }
 *   mode          "simple"（かんたん）/ "full"（しっかり）
 *   foldedGroups  profiles.folded_groups の配列
 * @returns {boolean}
 *
 * かんたん記録ではコアだけを出す。しっかり記録では、本人が畳んだものを除いて全部出す。
 * 未知のキーは true（＝出す）。新しい項目を足したときに、黙って消えないようにするため。
 */
export function isFieldGroupVisible(key, ctx = {}) {
  const g = BY_KEY[key];
  if (!g) return true;
  const mode = RECORD_MODES.includes(ctx.mode) ? ctx.mode : DEFAULT_RECORD_MODE;
  if (mode === "simple") return g.tier === "core";
  const folded = Array.isArray(ctx.foldedGroups) ? ctx.foldedGroups : [];
  if (g.foldKey && folded.includes(g.foldKey)) return false;
  return true;
}

/**
 * 記録項目の再設計v2 §3.3 の Detail（0=記録しない / 1=簡易 / 2=詳細）。
 * いまは かんたん/しっかり の2モードなので、そこから導出する。
 * 将来グループごとの3段階を持たせるときは、この関数だけを変えればよい。
 */
export function fieldGroupDetail(key, ctx = {}) {
  if (!isFieldGroupVisible(key, ctx)) return 0;
  const g = BY_KEY[key];
  if (!g) return 2;
  const mode = RECORD_MODES.includes(ctx.mode) ? ctx.mode : DEFAULT_RECORD_MODE;
  if (mode === "simple") return 1;
  return g.tier === "detail" ? 2 : 2;
}
