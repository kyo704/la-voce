// ============================================================================
// アカウントの物理削除（統合実行ルートv4 G3-17 / 作業指示-公開前の実装.md A-4）
//
// この処理は2箇所から呼ばれる:
//   ・「今すぐ完全に削除する」を選んだとき（app/api/account/delete）
//   ・猶予期間（30日）を過ぎたものを片付ける定期処理（app/api/cron/purge-deleted）
// 同じ削除が2通りに分かれると必ずズレるので、1つにまとめてある。
//
// ★A-4 の要件「バックアップからの物理削除の手順を、コメントで残しておく」
//   ------------------------------------------------------------------------
//   Supabase の Point-in-Time Recovery やダンプから復元すると、
//   ここで消したはずの行が戻ってきます。削除の求めに応じたあとにデータが
//   復活するのは事故です。復元を行ったときは、必ず次を実施してください。
//     1. 復元直後、profiles の deleted_at が入っている行を洗い出す
//     2. その user_id について、この purgeAccount と同じ削除をもう一度流す
//     3. 復元時点より後に削除申請があったぶんは、申請の記録（監査ログ・
//        サポートの受信箱）と突き合わせて、手作業で消す
//   復元の担当者がこの手順を知らないと守れないので、運用手順書にも
//   同じ内容を残してください。
// ============================================================================

// 削除する順序。子から先に消す（外部キーの参照が残らないように）。
export const USER_OWNED_TABLES = [
  "entry_comments",
  "teacher_notes",
  "lessons",
  "article_notes",
  "article_progress",
  "chapter_state",
  "character_inventory",
  "repertoire_tessitura",
  "role_master",
  "project_master",
  "questionnaire_responses",
  "cycle_periods",
  // ★アカウントを消すときは、同意の記録も一緒に消します。
  //   「行を消さない」は、★同意を撤回したときの話です（EUの下地づくり §3-2）。
  //   本人がアカウントごと消すときに残すと、消したはずの人の記録が
  //   残ることになります。第17条（消去権）のほうが優先します。
  "consent_records",
  "age_answer_changes",
  "cohort_changes",
  "entries",
  "feedback",
  "assignments",
  "enrollments",
  "memberships",
  "subscriptions"
];

// user_id 以外の列で本人に紐づくもの。
export const SPECIAL_DELETES = [
  { table: "teacher_student_links", column: "student_id" },
  { table: "teacher_student_links", column: "teacher_id" },
  { table: "teacher_invitations", column: "teacher_id" }
];

// 環境によっては存在しないテーブルがある。それは失敗として数えない。
function isMissingTable(error) {
  return !!error && /does not exist|schema cache|relation .* does not exist/i.test(error.message || "");
}

/**
 * 共有だけを即座に断つ（A-4「教室の側から見えなくなるのは即時。30日待たない」）。
 * 猶予期間に入った時点で呼ぶ。本人の記録そのものには手を触れない。
 */
export async function severConnections(admin, userId) {
  const failures = [];
  for (const { table, column } of SPECIAL_DELETES) {
    const { error } = await admin.from(table).delete().eq(column, userId);
    if (error && !isMissingTable(error)) failures.push({ table: `${table}.${column}`, message: error.message });
  }
  return failures;
}

/**
 * 本体を物理削除する。認証ユーザーの削除まで行う。
 * ★1つでも失敗したら、認証ユーザーは消さない。消すと残った行に手が届かなくなる。
 * @returns {Promise<{ok: boolean, failures: Array}>}
 */
export async function purgeAccount(admin, userId) {
  const failures = [...(await severConnections(admin, userId))];

  for (const table of USER_OWNED_TABLES) {
    const { error } = await admin.from(table).delete().eq("user_id", userId);
    if (error && !isMissingTable(error)) failures.push({ table, message: error.message });
  }

  // 教室そのものは他の人が使っている可能性がある。消さず、作成者の紐付けだけ外す。
  const { error: orgError } = await admin.from("organizations").update({ created_by: null }).eq("created_by", userId);
  if (orgError && !isMissingTable(orgError)) failures.push({ table: "organizations", message: orgError.message });

  const { error: profileError } = await admin.from("profiles").delete().eq("id", userId);
  if (profileError && !isMissingTable(profileError)) failures.push({ table: "profiles", message: profileError.message });

  if (failures.length > 0) return { ok: false, failures };

  const { error: authError } = await admin.auth.admin.deleteUser(userId);
  if (authError) return { ok: false, failures: [{ table: "auth.users", message: authError.message }] };

  // ★消えた数だけを残します（管理画面のため）。
  //   ★時刻だけです。user_id も、メールアドレスも、その断片も、
  //     ハッシュも入れません。誰が消したかを知る手立てを作らないこと。
  //   ★ここに置く理由：purgeAccount は「本当に消すとき」だけ通ります。
  //     30日の猶予を申し出た時点では通りません。
  //     その場の完全削除も、猶予明けの定期処理も、どちらもここを通るので、
  //     1か所で数えられます。★呼ぶ側で数えないでください。二重に数えます。
  //   ★消したあとに入れます。ここが失敗しても、削除は成功のままです。
  //     数えられなかったことより、消えていないことのほうが重大です。
  // ★空のオブジェクト（insert({})）を送らないこと。
  //   PostgREST に「列が1つも無い本文」を渡すことになり、版によって
  //   400 で弾かれます。★2026-08-30、数が増えなかった第一の疑いがこれです。
  //   既定値に頼らず、値を明示して送ります。
  const deletedAt = new Date().toISOString();
  let countError = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const { error } = await admin.from("account_deletions").insert({ deleted_at: deletedAt });
    countError = error || null;
    if (!countError) break;
    if (isMissingTable(countError)) break;      // 表が無いなら、繰り返しても同じ
  }
  if (countError) {
    // ★黙って落とさないこと。console だけだと、坂本さんには見えません。
    //   呼ぶ側（削除のAPI）へ返し、そちらでログに残します。
    console.error(
      isMissingTable(countError)
        ? "削除の件数を記録できませんでした（表がありません）。supabase/migration_account_deletions_count.sql を実行してください。"
        : "★削除の件数を記録できませんでした（表はあるのに失敗）。",
      { code: countError.code, message: countError.message, details: countError.details, hint: countError.hint }
    );
    return { ok: true, failures: [], countRecorded: false, countError: countError.message || "unknown" };
  }

  return { ok: true, failures: [], countRecorded: true };
}

/** 猶予期間（日数）。A-4 の要件。 */
export const GRACE_PERIOD_DAYS = 30;

/** 猶予期間の残り日数。0以下なら物理削除の対象。 */
export function graceDaysLeft(deletedAt, now = new Date()) {
  if (!deletedAt) return null;
  const elapsedMs = now.getTime() - new Date(deletedAt).getTime();
  const left = GRACE_PERIOD_DAYS - Math.floor(elapsedMs / 86400000);
  return left;
}
