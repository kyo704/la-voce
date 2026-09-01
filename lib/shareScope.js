// ============================================================================
// 「先生には決して渡さない列」の記録（★もう共有の仕組みではありません）
//
//   ★2026-09-01、共有範囲（shareScope）そのものを廃止しました。
//     先生が生徒の記録の中身を常時見られる仕組みを、丸ごとやめた判断です
//     （坂本さん・Opus の裁定）。共有したいときは、生徒さんが自分で
//     書き出して、アプリの外で渡します。お医者さんに紙を1枚渡すのと同じで、
//     1回きりです。
//
//   ★このファイルに、かつて何があったか
//     ・SHARE_SCOPE_KEYS      … 生徒が選ぶ9つの範囲
//     ・COLUMN_SCOPE          … 列 → 範囲の対応表
//     ・allowedColumnsForScope … 範囲から「返してよい列」を作る関数
//     どれも、先生に記録を見せるためのものでした。全部消しました。
//
//   ★なぜファイルごと消さないのか
//     下の一覧だけは、意味が変わらずに残るからです。
//     「この列は、どんな仕組みができても先生に渡さない」という判断の記録です。
//     ★いま何かを見せるための表ではありません。見せないための表です。
//
//   ★関連
//     supabase/migration_drop_student_entries_rpc.sql（関数を削除した記録）
//     docs/lavoce-設計憲章.md §10（恒久的に作らないもの）
// ============================================================================

/**
 * ★どんな共有の仕組みができても、先生に渡さないと決めた列。
 *
 *   2026-09-01 の廃止より前、これらは「どの範囲にも属さない」列でした。
 *   つまり、生徒が9つのチェックを全部入れても届かない列です。
 *
 *   ★理由は列ごとに違いますが、共通しているのは
 *     「レッスンの指導に要らないのに、その人の生活が分かってしまう」ことです。
 *       cycle_start        … 月経周期の開始日。とくに機微度が高い
 *       medication_tags    … 服薬
 *       location           … 滞在地（生徒の居場所そのもの）
 *       temperature / humidity / weather / weather_source / environment_tags
 *                          … 居場所を言い当てられる
 *       ambient_noise_db / noisy_environment
 *                          … どんな部屋にいるか
 *       flight_hours / jetlag_hours
 *                          … 移動の履歴
 *       smoked_today / drank_today
 *                          … 生活習慣
 *       type_fields        … 職業ごとの追加項目（中身が定まっていない）
 *
 *   ★足すことはあっても、減らさないこと。
 *     減らすときは、なぜ渡してよくなったのかを、ここに書いてください。
 */
export const NEVER_SHARED_COLUMNS = [
  "weather_source",
  "smoked_today",
  "drank_today",
  "type_fields",
  "medication_tags",
  "cycle_start",
  "location",
  "temperature",
  "humidity",
  "weather",
  "environment_tags",
  "ambient_noise_db",
  "noisy_environment",
  "flight_hours",
  "jetlag_hours"
];

/**
 * ★本人の書き出しには、上の列も入ります。
 *   「先生に渡さない」と「本人も取り出せない」は、まったく別の話です。
 *   lib/exportData.js は、この一覧を見ません。見てはいけません。
 */
export const NEVER_SHARED_BUT_EXPORTED = true;
