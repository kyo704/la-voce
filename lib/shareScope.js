// ============================================================================
// 健康データの共有範囲（share_scope）と、entries の列との対応表
//
// ★このファイルが、「どの列が、どの共有範囲に属するか」の唯一の定義です。
//   supabase/migration_teacher_student_entries_rpc.sql の関数は、この表と
//   1対1で対応していなければなりません（components/tests/share-scope.test.js で検証）。
//
// なぜ必要か:
//   PostgreSQL の RLS は「行」単位の制御で、「列」単位ではありません。そのため
//   entries に対して select("*") をすると、生徒が共有を許可していない項目まで
//   ブラウザに届いてしまいます（画面に描画されないだけ）。統合実行ルートv4 §11
//   「RLS だけで守らない」に従い、列の絞り込みはサーバー側の SECURITY DEFINER
//   関数で行い、クライアントはその結果だけを受け取ります。
//
// ★重要な設計（既存の canViewHealth と同じ原則を、サーバー側でも守ること）:
//   健康データの共有は、教室（organizations / memberships / assignments）とは
//   完全に独立した、1対1の連携（teacher_student_links）だけで判定します。
//   オーナー・管理者・担当講師という「教室での役割」は一切関与しません。
// ============================================================================

// 生徒が招待を受けるときに選ぶ9つの範囲（画面のチェックボックスと一致させること）。
export const SHARE_SCOPE_KEYS = ["voice", "symptoms", "sleep", "activity", "hydration", "meal", "body", "mental", "notes"];

// 共有範囲に関係なく必ず返す列。日付が無いと記録を日付ごとに並べられないため。
export const ALWAYS_VISIBLE_COLUMNS = ["date"];

// ---------------------------------------------------------------------------
// 列 → 共有範囲の対応表。
// 値が null の列は「どの範囲にも属さない＝共有しない」列です。
// 迷ったら null にしてください（fail closed）。
// ---------------------------------------------------------------------------
export const COLUMN_SCOPE = {
  // ---- voice: 声・喉の記録 ----
  throat_condition: "voice",
  voice_quality: "voice",
  voice_checkins: "voice",
  voice_entries: "voice",
  voice_memo: "voice",
  wake_note: "voice",
  routine_note: "voice",
  resonance_score: "voice",
  pianissimo_high_note: "voice",
  pianissimo_onset_delay: "voice",
  cpps_value: "voice",

  // ---- symptoms: 症状 ----
  // 起きたときのむくみ（中核5項目の⑤）。★からだの症状なので "symptoms"。
  //   声の出来（voice）とは別に共有を切れるようにします。
  //   ★共有しない側に置いていません。むくみは声の状態の説明に直接使われ、
  //     指導者が「今日は軽くしましょう」と判断する材料になるためです。
  morning_edema: "symptoms",
  throat_symptoms: "symptoms",
  throat_symptoms_other: "symptoms",

  // ---- sleep: 睡眠 ----
  sleep_hours: "sleep",
  sleep_quality: "sleep",
  bedtime: "sleep",

  // ---- activity: 活動・練習量 ----
  activity_type: "activity",
  activity_duration: "activity",
  activity_detail: "activity",
  repertoire: "activity",
  performance_quality: "activity",
  recovery: "activity",
  load_detail: "activity",
  exercise_minutes: "activity",
  exercises: "activity",
  exercise_level: "activity",
  speaking_level: "activity",
  non_performance_speech_minutes: "activity",
  longest_speech_block_minutes: "activity",

  // ---- hydration: 水分 ----
  water_intake: "hydration",
  water_by_slot: "hydration",

  // ---- meal: 食事 ----
  meal_notes: "meal",
  meals: "meal",
  carbs_g: "meal",
  protein_g: "meal",
  fat_g: "meal",
  fiber_g: "meal",
  protein_level: "meal",
  calorie_level: "meal",
  dinner_time: "meal",
  dinner_tags: "meal",

  // ---- body: 体重・身体データ ----
  weight_kg: "body",
  body_fat_pct: "body",

  // ---- mental: 心の余裕・日記 ----
  ease: "mental",
  mental_reason: "mental",
  mental_tags: "mental",

  // ---- notes: 稽古ノート ----
  notes: "notes",

  // ---- どの範囲にも属さない列（＝先生には一切共有しない） ----
  // ★ここは意図的な判断です。生徒が見るチェックボックスは「症状」「活動」等の
  //   9つだけで、服薬や月経周期に同意した覚えのない項目まで「症状」に含めるのは、
  //   同意の範囲を超えます。共有したい場合は、生徒に見える選択肢を先に増やすこと。
  // 型ごとの追加項目（職業を声の型で切り直す §5-2）。
  // ★§10-10「職業を先生・教室に見せる範囲を広げない（既存の範囲のまま）」。
  //   新しく足した項目を先生に見せると、その範囲が広がります。生徒が見る
  //   チェックボックスにも、この項目を説明する選択肢がありません。
  //   共有するなら、先に生徒に見える選択肢を増やすこと。
  //   ★本人の書き出しと削除には、これまでどおり含まれます（別の話です）。
  type_fields: null,
  medication_tags: null,  // 服薬タグ。9つのどの選択肢でも説明されていない
  cycle_start: null,      // 月経周期の開始日。同上。とくに機微度が高い
  // 環境の記録。対応する共有範囲の選択肢が存在しないため共有しない。
  location: null,         // 滞在地（生徒の居場所そのもの）
  temperature: null,
  humidity: null,
  weather: null,
  environment_tags: null,
  ambient_noise_db: null,
  noisy_environment: null,
  flight_hours: null,
  jetlag_hours: null
};

/** 対応表に載っている全列（＝関数が明示的に扱う列）。 */
export const KNOWN_COLUMNS = Object.keys(COLUMN_SCOPE);

/**
 * share_scope から、値を返してよい列の一覧を作る。
 * 対応表に無い列（＝あとから entries に足された列）は、ここに現れないので
 * 自動的に共有されません（fail closed）。
 */
export function allowedColumnsForScope(scope) {
  const s = scope || {};
  return KNOWN_COLUMNS.filter((col) => {
    const key = COLUMN_SCOPE[col];
    return key != null && s[key] === true;
  });
}

/** 逆に、明示的に null で返す列の一覧。 */
export function deniedColumnsForScope(scope) {
  const allowed = new Set(allowedColumnsForScope(scope));
  return KNOWN_COLUMNS.filter((col) => !allowed.has(col));
}
