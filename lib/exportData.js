// ============================================================================
// データの書き出し（統合実行ルートv4 G3-16 / 改善タスクv2 P0-3）
//
// ★ここに含める項目を減らさないこと。
//   月経周期・既往症・アレルギー・常用薬は、先生には一切共有しない設定だが
//   （lib/shareScope.js の11列）、本人が自分のデータを持ち出す権利は別の話。
//   「共有しない」と「本人も取り出せない」を混同しないこと。
//
// JSON は完全な構造をそのまま（入れ子の meals / activities / voiceEntries を
// 落とさない）。CSV は日付を1行にした表で、表計算ソフトで開ける形。
// どちらか一方では足りないので、両方を出す。
// ============================================================================

export const EXPORT_FORMAT_VERSION = 2;

// 書き出すテーブルと、その並び順のキー。
// 新しいテーブルを足したら、ここにも足すこと。足し忘れると黙って欠ける。
export const EXPORTED_TABLES = [
  { table: "entries", orderBy: "date" },
  { table: "questionnaire_responses", orderBy: "response_date" },
  // ★周期の記録。先生には一切共有しないが、本人の持ち出しには必ず含める
  //   （ルート文書 G3 の注記。「共有しない」と「本人も取り出せない」は別の話）。
  { table: "cycle_periods", orderBy: "start_date" },
  { table: "repertoire_tessitura", orderBy: null },
  { table: "role_master", orderBy: null },
  { table: "project_master", orderBy: null },
  { table: "article_notes", orderBy: null },
  { table: "article_progress", orderBy: null },
  { table: "chapter_state", orderBy: null },
  { table: "character_inventory", orderBy: null }
];

// プロフィールから書き出す列。★機微な項目こそ本人には返す。
export const EXPORTED_PROFILE_COLUMNS = [
  "name", "email", "occupation", "school", "display_name",
  "height_cm", "age", "sex", "voice_type", "vocal_profession", "professions",
  "conditions", "allergies", "regular_medications", "health_notes",
  "vocal_range_low", "vocal_range_high", "comfort_range_low", "comfort_range_high",
  "technical_goal", "nutrition_phase", "protein_coefficient", "track_cycle",
  "goal_focus", "practice_goal", "practice_goal_tags", "practice_goal_started_at",
  "practice_reviews", "folded_groups", "record_mode", "day_record_boundary_hour",
  "garden_theme", "character_equipped", "character_points_spent",
  "consent_health_data_at", "consent_stats_use_at", "consent_policy_version",
  "onboarding_completed", "created_at",
  // EUの下地づくり.md §4-3。本人のデータなので、書き出しにも含める。
  "data_region"
];

// ---------------------------------------------------------------------------
// 共有設定の履歴（作業指示-公開前の実装.md A-3 の「共有設定の履歴」）
//
// ★A-3 は「他のユーザーの情報（先生のメモなど）は含めない」とも定めている。
//   teacher_student_links には相手の teacher_id が入っているので、そのまま
//   出すと「誰と繋がっていたか」という相手側の情報まで書き出すことになる。
//   自分が「何を・いつからいつまで共有していたか」だけを残し、相手を特定
//   できる値は落とす。
//
// ★安全側の作り: 残す列を並べるのではなく、残してよい列だけを通す。
//   あとから列が増えても、ここに書かない限り書き出されない（fail closed）。
// ---------------------------------------------------------------------------
export const SHARE_HISTORY_SAFE_COLUMNS = ["share_scope", "status", "accepted_at", "revoked_at", "revoked_by", "created_at"];

export function sanitizeShareHistory(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map((row, i) => {
    const out = {};
    SHARE_HISTORY_SAFE_COLUMNS.forEach((k) => { if (k in row) out[k] = row[k]; });
    // 相手を特定できる値は残さないが、複数の共有を見分けられるよう連番だけ振る。
    out.connection = `連携${i + 1}`;
    return out;
  });
}

/** CSV の1セルを安全にする（改行・カンマ・引用符を含む値に対応）。 */
export function csvCell(value) {
  if (value === null || value === undefined) return "";
  let s;
  if (typeof value === "object") s = JSON.stringify(value);
  else s = String(value);
  if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

/**
 * 日々の記録を、日付1行のCSVにする。
 * 列は、実際に含まれている全キーの和集合から作る（欠けた項目は空欄）。
 */
export function entriesToCsv(entries) {
  const rows = Array.isArray(entries) ? entries : [];
  if (rows.length === 0) return "";
  const keys = [];
  const seen = new Set();
  rows.forEach((r) => Object.keys(r).forEach((k) => { if (!seen.has(k)) { seen.add(k); keys.push(k); } }));
  // 日付を先頭に固定すると、表計算ソフトで並べ替えやすい
  keys.sort((a, b) => (a === "date" ? -1 : b === "date" ? 1 : 0));
  const head = keys.map(csvCell).join(",");
  const body = rows.map((r) => keys.map((k) => csvCell(r[k])).join(",")).join("\n");
  return head + "\n" + body;
}

/** 書き出し全体の形。JSONファイルの中身になる。 */
export function buildExportPayload({ profile, tables, exportedAt }) {
  return {
    formatVersion: EXPORT_FORMAT_VERSION,
    exportedAt,
    note: "Woolsong から書き出したあなた自身の記録です。すべての項目を含んでいます。",
    profile: profile || null,
    ...tables
  };
}
