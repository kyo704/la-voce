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
// ============================================================================
// ★props に入れてよい鍵は、ここに載っているものだけです（許可制）
//
//   ★2026-09-01、禁止リストから許可リストに変えました。
//     禁止リストは必ず漏れます。健康の値だけを止めていて、
//     teacher_id / created_by / invited_by / 名前 / メール / 招待コードは
//     ★何も止めていませんでした。今日入っていなくても、明日入ります。
//
//   ★原則：行動ログに、操作した本人以外を指す値を入れないこと。
//     誰が・いつ・何をしたか、までです。誰に対してか、は入れません。
//
//   ★足すときは、その鍵が「操作の形」であって「操作の中身」でないことを
//     確かめてください。項目名の配列は可、項目の値は不可（§3.3）。
// ============================================================================
// ★健康の値の名前。これが1つでもあれば、★イベントごと送りません。
//   許可リストがあれば理屈の上では届きませんが、許可リストに間違いが
//   入ったときの二重の歯止めです。健康の値だけは、落として送るのではなく
//   ★送らないほうを選びます（2026-09-01 まではこの動きでした。残します）。
export const HEALTH_PROP_KEYS = [
  "throatCondition", "voiceQuality", "sleepQuality", "ease", "resonanceScore",
  "throatSymptoms", "symptoms", "mentalTags", "mentalReason", "notes", "memo",
  "voiceMemo", "weightKg", "bodyFatPct", "cycleStart", "cyclePeriods",
  "medicationTags", "conditions", "allergies", "regularMedications",
  "healthNotes", "wakeNote", "dinnerTags", "cppsValue", "pianissimoHighNote",
  "morningEdema", "smokedToday", "drankToday",
  "throat_condition", "voice_quality", "sleep_quality", "weight_kg", "cycle_start"
];

export const ALLOWED_PROP_KEYS = [
  "fieldsFilled",   // 埋めた項目の★名前の配列（値ではない）
  "filledCount",    // 埋めた項目の数
  "durationMs",     // かかった時間
  "msTotal",        // 同上（古い書き方。残っている行があります）
  "mode",           // "quick" / "full"
  "cardKey",        // 見た分析カードの鍵
  "source",         // どこから来たか（"home" / "notification" など）
  "step"            // 何段目まで進んだか
];

/**
 * props が行動ログの範囲に収まっているか。
 * ★「項目名の配列」は可。「項目の値」は不可。
 *   例: fieldsFilled: ["sleep","hydration"]  ○
 *       bodyFeel: 2                          ✗
 *
 * ★許可リストに無い鍵は、問題として返します。
 *   ただし trackEvent は★落とすだけで、送信そのものは続けます
 *   （壊れた行動ログより、行動ログが無いほうがましだからです）。
 */
export function validateEventProps(props) {
  if (props == null) return { ok: true, fatal: false, problems: [], allowed: {} };
  if (typeof props !== "object" || Array.isArray(props)) {
    return { ok: false, fatal: true, problems: ["propsはオブジェクトにしてください"], allowed: {} };
  }
  const problems = [];
  const allowed = {};
  // ★健康の値が1つでもあれば、イベントごと止めます（fatal）。
  const health = Object.keys(props).filter((k) => HEALTH_PROP_KEYS.includes(k));
  if (health.length > 0) {
    return { ok: false, fatal: true, allowed: {},
      problems: health.map((k) => `健康の値「${k}」は行動ログに入れられません`) };
  }
  Object.entries(props).forEach(([k, v]) => {
    if (!ALLOWED_PROP_KEYS.includes(k)) {
      problems.push(`「${k}」は許可されていない鍵です（lib/events.js の ALLOWED_PROP_KEYS）`);
      return;                                   // ★落とす。送らない
    }
    // 自由記述が紛れ込んでいないか（長い文字列は本文の可能性が高い）
    if (typeof v === "string" && v.length > 120) {
      problems.push(`「${k}」が長すぎます。本文を入れていませんか`);
      return;
    }
    allowed[k] = v;
  });
  return { ok: problems.length === 0, fatal: false, problems, allowed };
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
  if (check.fatal) {
    // ★健康の値が入っていたら、1件も送りません。黙って送らないこと。
    if (typeof console !== "undefined") console.error("events: 送れない props です。", check.problems);
    return;
  }
  if (check.problems.length > 0) {
    // ★許可されていない鍵は落とし、残りは送ります。
    //   行動ログが壊れて送れないより、その鍵だけ無いほうがましです。
    //   ★ただし黙って落とさないこと。console に必ず出します。
    if (typeof console !== "undefined") console.error("events: 送れない props を落としました。", check.problems);
  }
  const row = {
    user_id: userId,
    // ★列は event_type です。name ではありません。
    //   2026-09-01 まで name で送っていて、event_type が null の行が
    //   76件たまっていました（props だけあって、種類が分からない行）。
    event_type: name,
    props: check.allowed,
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
