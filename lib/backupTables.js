// ============================================================================
// バックアップに入っていなければならないもの（A-P0-1）
//
//   出典 docs/lavoce-優先順位つき残タスク.md A-P0-1
//        「テーブルごとの行数」「期待される行数を大きく下回っていたら異常終了」
//
//   ★これが唯一の正です。scripts/backup-verify.js に一覧を書き写さないこと。
//     書き写すと、テーブルを足したときに片方だけが古くなり、
//     ★「検査は通るのに、そのテーブルだけ入っていない」が起きます。
//     lib/shareScope.js の FORBIDDEN_KEYS が、まさにその穴でした。
//
//   ★lib/exportData.js・lib/accountDeletion.js とは目的が違います。
//     あちらは「本人に返すもの」「本人のものを消すもの」。
//     こちらは「事業として失ってはいけないもの」で、
//     ★他人の行（role_master のような共通データ）も入ります。
//     三つは意図的に一致しません。
// ============================================================================

/**
 * ダンプに含める schema。
 *
 * ★auth を外さないこと。
 *   pg_dump は既定で public だけを出します。auth を落とすと、
 *   entries は戻るのに、その行の持ち主が居ない状態になります。
 *   ★復元先でログインできず、「記録が消えた」ように見えます。
 *   auth.identities も要ります（メールとパスワードでの認証に使われます）。
 */
export const BACKUP_SCHEMAS = ["auth", "public"];

/**
 * public に必ずあるテーブル。
 *
 *   critical: true  … 1行も無ければ異常。事業の根幹（★異常終了します）
 *   critical: false … 空でもありうる（まだ誰も使っていない機能）
 *
 * ★増やしたときは、ここに足してください。
 *   components/tests/backup-tables.test.js が、コードで使っている
 *   テーブルとの食い違いを見ています。
 */
export const BACKUP_TABLES = [
  // ── 失うと事業が終わるもの ────────────────────────────────
  { table: "profiles",                 critical: true  },
  { table: "entries",                  critical: true  },
  // ── 本人の記録 ────────────────────────────────────────────
  { table: "questionnaire_responses",  critical: false },
  { table: "cycle_periods",            critical: false },
  { table: "repertoire_tessitura",     critical: false },
  { table: "role_master",              critical: false },
  { table: "project_master",           critical: false },
  { table: "article_notes",            critical: false },
  { table: "article_progress",         critical: false },
  { table: "chapter_state",            critical: false },
  { table: "character_inventory",      critical: false },
  { table: "events",                   critical: false },
  { table: "feedback",                 critical: false },
  // ── 同意と、あとから作れない履歴 ──────────────────────────
  //   ★これらは「いつ・何に同意したか」の証拠です。
  //     作り直せません。行数が減っていたら、必ず止めてください。
  { table: "consent_records",          critical: false },
  { table: "age_answer_changes",       critical: false },
  { table: "cohort_changes",           critical: false },
  { table: "account_deletions",        critical: false },
  // 1回だけ出す知らせの既読（lib/notices.js）。★消えると、
  //   出し終えた知らせが全員にもう一度出ます。
  { table: "user_notices",             critical: false },
  // ── 教室・指導者（G4 以降。いまは空でも正常）──────────────
  { table: "organizations",            critical: false },
  { table: "memberships",              critical: false },
  { table: "enrollments",              critical: false },
  { table: "assignments",              critical: false },
  { table: "lessons",                  critical: false },
  { table: "entry_comments",           critical: false },
  { table: "teacher_notes",            critical: false },
  { table: "teacher_student_links",    critical: false },
  { table: "teacher_invitations",      critical: false },
  { table: "org_invitations",          critical: false },
  // ── 課金（いまは休んでいます）─────────────────────────────
  { table: "subscriptions",            critical: false }
];

/** auth schema に必ずあるテーブル。★これが無いとログインできません。 */
export const BACKUP_AUTH_TABLES = [
  { table: "users",      critical: true  },
  { table: "identities", critical: false }
];

/**
 * 前回のバックアップから、どれだけ減ったら異常とするか。
 *
 * ★0.20 は「2割減ったら止める」です。
 *   利用者が自分でアカウントを消すことはあるので、少しの減少は正常です。
 *   ★1行でも減ったら止める、にはしません。毎回止まると、
 *     人は確認をやめます。止まったときに必ず見る、を保ちたいためです。
 */
export const MAX_SHRINK_RATIO = 0.20;

/** 名前だけの一覧（scripts から使います）。 */
export function backupTableNames() {
  return BACKUP_TABLES.map((t) => t.table);
}

/** 1行も無ければ異常とするテーブル。 */
export function criticalTableNames() {
  return BACKUP_TABLES.filter((t) => t.critical).map((t) => t.table);
}

/**
 * 前回と今回を比べて、異常な減り方をしたテーブルを返す。
 *
 * ★「前回が無い」は異常ではありません（初回）。呼ぶ側で分けます。
 * ★前回0行だったものが0行なのは正常。0から増えるのは当然に正常。
 */
export function shrinkFailures(previousCounts, currentCounts) {
  const bad = [];
  Object.keys(previousCounts || {}).forEach((table) => {
    const before = previousCounts[table];
    const after = currentCounts[table];
    if (typeof before !== "number") return;
    if (typeof after !== "number") {
      bad.push({ table, before, after: null, reason: "テーブルごと入っていない" });
      return;
    }
    if (before > 0 && after === 0) {
      bad.push({ table, before, after, reason: "★あった行が全部消えている" });
      return;
    }
    if (before > 0 && after < before * (1 - MAX_SHRINK_RATIO)) {
      bad.push({ table, before, after, reason: `★${Math.round((1 - after / before) * 100)}% 減っている` });
    }
  });
  return bad;
}
