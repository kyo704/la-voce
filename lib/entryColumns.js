// ============================================================================
// entries に「実際にある」と確認できている列
//
//   ★なぜこのファイルが要るか
//     supabase/schema.sql は本番の写しではありません（CLAUDE.md）。
//     多くの列は Supabase の SQL エディタで手で足されていて、
//     ★どこにも記録が残っていませんでした。
//     そのため「手で足したから本番にある列」と「まだ無い列」を、
//     コードの側から区別できませんでした。
//
//   ★2026-08-30 に同じ事故が2回起きました（type_fields / morning_edema）。
//     どちらも、列を使うコードが先に本番へ出た形です。
//     PostgREST は知らない列が1つあるだけで★保存全体を断るので、
//     その項目を触っていない人の保存まで、全部落ちました。
//
//   ★使い方（新しい列を足すとき）
//     ① supabase/migration_*.sql を書く
//     ② その列を PENDING_COLUMNS に足す
//     ③ 坂本さんが SQL を実行し、★保存が通ることを確かめる
//     ④ 確かめてから LIVE_COLUMNS へ移す（PENDING から消す）
//
//   ★③を飛ばして④をしないこと。このファイルは「動くはず」ではなく
//     「動くのを見た」の記録です。見ていないものを LIVE に書かないこと。
//
//   ★PENDING にある列でも、コードは今までどおり書き込みます。
//     止めるのではなく、lib/entryWriteFallback.js が
//     「その列だけ外して保存し直す」ので、記録は失われません。
// ============================================================================

/** 本番にあることを確認済みの列。 */
export const LIVE_COLUMNS = [
  "activity_detail", "activity_duration", "activity_type", "ambient_noise_db",
  "bedtime", "body_fat_pct", "calorie_level", "carbs_g",
  "cpps_value", "cycle_start", "date", "dinner_tags",
  "dinner_time", "ease", "environment_tags", "exercise_level",
  "exercise_minutes", "exercises", "fat_g", "fiber_g",
  "flight_hours", "humidity", "jetlag_hours", "load_detail",
  "location", "longest_speech_block_minutes", "meal_notes", "meals",
  "medication_tags", "mental_reason", "mental_tags", "noisy_environment",
  "non_performance_speech_minutes", "notes", "performance_quality", "pianissimo_high_note",
  "pianissimo_onset_delay", "protein_g", "protein_level", "recovery",
  "repertoire", "resonance_score", "routine_note", "sleep_hours",
  "sleep_quality", "speaking_level", "temperature", "throat_condition",
  "throat_symptoms", "throat_symptoms_other", "type_fields", "user_id",
  "voice_checkins", "voice_entries", "voice_memo", "voice_quality",
  "wake_note", "water_by_slot", "water_intake", "weather",
  "weight_kg",
  // 2026-08-30 に足し、★2026-09-01 に本番のダンプで存在と値を確認した3列
  //   （むくみ3日 / たばこ2日 / お酒2日ぶんの値が入っていました）
  "morning_edema", "smoked_today", "drank_today"
];

/**
 * SQL は書いたが、本番で確認できていない列。
 *
 * ★ここが空でないあいだは、その列を触る保存が
 *   lib/entryWriteFallback.js の回り道を通ることがあります。
 * ★確認できたら LIVE_COLUMNS へ移し、ここから消してください。
 */
export const PENDING_COLUMNS = [
  // ★いまは空です。
  //   2026-09-01、本番のダンプで morning_edema / smoked_today / drank_today の
  //   3列とも存在し、値が入っていることを確認して LIVE_COLUMNS へ移しました。
  //   （むくみ3日 / たばこ2日 / お酒2日ぶん）
];

/** 記録として認めている列すべて。 */
export function knownEntryColumns() {
  return [...LIVE_COLUMNS, ...PENDING_COLUMNS];
}
