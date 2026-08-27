// ============================================================================
// 行動ログ（計測とユーザー調査仕様.md §3）
//
// ★行動ログと健康データは、まったく別のものです。
//   行動ログ … どの画面を開いたか、保存できたか、どこで諦めたか、どの項目を
//              「入れたか」。健康の値そのものを持たなければ、要配慮個人情報に
//              あたりません。
//   健康の値 … 症状・スコア・分布。統計利用への明示的な同意が要ります。
//
//   ★この境界を守るのは、このファイルの責任です。
//   「便利だから」と props に値を入れたくなりますが、入れた瞬間に
//   行動ログ全体の法的な重さが変わります。実行時に弾きます。
//
// ★外部の分析ツールへ送りません（§1.2）。自前の events 表だけで足ります。
// ============================================================================

// §3.2 記録するイベント。★15種類まで。増やす前にこの表を更新すること。
//   多く取ると、どれも見なくなります。
export const EVENT_NAMES = [
  "signup_completed",
  "record_opened",
  "record_saved",
  "record_abandoned",
  "voice_entry_added",
  "analysis_opened",
  "analysis_card_viewed",
  "analysis_card_expanded",
  "unlock_reached",
  "notification_clicked",
  "install_prompt_shown",
  "install_prompt_accepted",
  "checkout_started",
  "checkout_completed",
  "support_form_submitted"
];
export const MAX_EVENT_NAMES = 15;

// §3.5 行動ログは13か月で消す。それ以上持つ理由がありません。
export const EVENT_RETENTION_MONTHS = 13;

// ---------------------------------------------------------------------------
// ★props に入れてはいけない語。
//   健康の値そのもの、および本文（自由記述）です。
//   ここに無い語でも、値が数値のスコアなら疑ってください。
// ---------------------------------------------------------------------------
const FORBIDDEN_PROP_KEYS = [
  "throatCondition", "voiceQuality", "sleepQuality", "ease", "resonanceScore",
  "throatSymptoms", "symptoms", "mentalTags", "mentalReason", "notes", "memo",
  "voiceMemo", "weightKg", "bodyFatPct", "cycleStart", "cyclePeriods",
  "medicationTags", "conditions", "allergies", "regularMedications",
  "healthNotes", "wakeNote", "dinnerTags", "cppsValue", "pianissimoHighNote",
  "throat_condition", "voice_quality", "sleep_quality", "weight_kg", "cycle_start"
];

/**
 * props が行動ログの範囲に収まっているか。
 * ★「項目名の配列」は可。「項目の値」は不可。
 *   例: fieldsFilled: ["sleep","hydration"]  ○
 *       bodyFeel: 2                          ✗
 */
export function validateEventProps(props) {
  if (props == null) return { ok: true, problems: [] };
  if (typeof props !== "object" || Array.isArray(props)) {
    return { ok: false, problems: ["propsはオブジェクトにしてください"] };
  }
  const problems = [];
  Object.keys(props).forEach((k) => {
    if (FORBIDDEN_PROP_KEYS.includes(k)) problems.push(`健康の値「${k}」は行動ログに入れられません`);
  });
  // 自由記述が紛れ込んでいないか（長い文字列は本文の可能性が高い）
  Object.entries(props).forEach(([k, v]) => {
    if (typeof v === "string" && v.length > 120) problems.push(`「${k}」が長すぎます。本文を入れていませんか`);
  });
  return { ok: problems.length === 0, problems };
}

/** イベント名が、決めた15種類に入っているか */
export function isKnownEvent(name) {
  return EVENT_NAMES.includes(name);
}

/**
 * 行動ログを1件送る。★失敗しても、利用者の操作は止めない。
 * supabase: クライアント。userId: 送信者。
 */
export function trackEvent(supabase, userId, name, props = {}) {
  if (!supabase || !userId) return;
  if (!isKnownEvent(name)) {
    // ★知らない名前は送らない。表を更新してから使うこと。
    if (typeof console !== "undefined") console.warn(`events: 未定義のイベント「${name}」は送りません。`);
    return;
  }
  const check = validateEventProps(props);
  if (!check.ok) {
    // ★健康の値が入っていたら、送らずに落とす。黙って送らないこと。
    if (typeof console !== "undefined") console.error("events: 送れない props です。", check.problems);
    return;
  }
  const row = {
    user_id: userId,
    name,
    props: props || {},
    at: new Date().toISOString(),
    tz: (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) { return null; } })(),
    platform: (() => {
      if (typeof window === "undefined") return null;
      const standalone = window.matchMedia && window.matchMedia("(display-mode: standalone)").matches;
      return standalone || window.navigator.standalone === true ? "pwa" : "web";
    })()
  };
  // 結果を待たない。行動ログのために操作を遅らせない。
  try {
    supabase.from("events").insert(row).then(() => {}, () => {});
  } catch (e) { /* 送れなくても、利用者には何も起きない */ }
}
