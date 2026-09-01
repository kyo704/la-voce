// ============================================================================
// auth.users を参照している列の台帳
//
//   ★なぜこの台帳が要るか
//     同じ壊れ方を、3回やりました。
//       ① lessons / entry_comments … 一覧にあるのに user_id 列が無く、
//          「列が無い」を握りつぶして★静かに何もしていなかった
//       ② organizations.created_by … NOT NULL なので null にできず、
//          退会が失敗していた
//       ③ events … ★そもそも一覧に無く、掃除から丸ごと漏れていた。
//          記録を1回でも開いた人は events に行があるので、
//          ★ほとんどの利用者が退会できませんでした
//
//     3回とも原因は同じです。「auth.users を指している列」の全体像が
//     どこにも無く、★人の記憶で一覧を書いていたことです。
//
//   ★この台帳が答える問い
//     「auth.users を指している列は、退会のときに誰が面倒を見るのか」
//     すべての列に、必ず1つの行き先があること。空欄を許しません。
//
//   ★台帳は、実物と突き合わせて初めて意味があります。
//     supabase/check_auth_user_references.sql を実行して、
//     ★DBにあってここに無い列が0件であることを確かめてください。
//     ファイル（migration_*.sql）は証拠になりません。
//     migration_events.sql は「create table if not exists」なので、
//     表が先に手で作られていれば、その中の on delete cascade は
//     ★一度も適用されていない可能性がありました。
//
//   ★2026-09-01 の棚卸しの結果
//     ・NO ACTION / RESTRICT だったのは★7列だけで、すべて既に扱っています。
//     ・events_user_id_fkey は★CASCADE でした（ファイルの記載どおり）。
//
//     ★つまり events は、auth.users の削除を止めていません。
//       +t1 の Dashboard 削除が失敗した原因は events ではなく、
//       ★残っていた organizations の行（created_by が NO ACTION）です。
//       その教室を手で消したあと、削除が通ったことと一致します。
//
//     ★events を一覧に入れたこと自体は、変わらず正しい判断です。
//       行動ログは本人のデータで、消えたことを確かめられる形で
//       消すべきだからです。CASCADE 任せだと、
//       「消えたか」を退会の失敗として観測できません。
// ============================================================================

/**
 * 面倒を見る仕組みの種類。
 *
 *   user_owned    lib/accountDeletion.js の USER_OWNED_TABLES（user_id で消す）
 *   special       SPECIAL_DELETES（user_id 以外の列で、行ごと消す）
 *   nulled        NULLED_REFERENCES（行は残し、その列だけ null にする）
 *   profiles_step purgeAccount の中の、profiles を消す専用の一行
 *   cascade       ★外部キーが CASCADE。auth.users を消せば一緒に消える
 *   org_close     lib/orgClosure.js の CLOSE_ORG_DELETE_ORDER（教室を閉じるとき）
 *
 * ★cascade を選ぶときは、実物の制約を確かめたときだけにしてください。
 *   「移行ファイルにそう書いてある」は理由になりません（③の原因）。
 */
export const HANDLERS = ["user_owned", "special", "nulled", "profiles_step", "cascade", "org_close", "pending"];

/**
 * auth.users を参照している列と、その行き先。
 *
 * ★verified は「実物の制約を pg_constraint で見たか」です。
 *   false のものは、まだ推測です。★推測のまま cascade に頼らないこと。
 *   cascade に頼っている列で verified が false のものは、
 *   検査が★落ちます（それが③の再発だからです）。
 */
export const AUTH_USER_REFERENCES = [
  // ---- 本人のデータ。user_id で消す ----
  { table: "article_notes", column: "user_id", handledBy: "user_owned", verified: true },
  { table: "article_progress", column: "user_id", handledBy: "user_owned", verified: true },
  { table: "chapter_state", column: "user_id", handledBy: "user_owned", verified: true },
  { table: "character_inventory", column: "user_id", handledBy: "user_owned", verified: true },
  { table: "repertoire_tessitura", column: "user_id", handledBy: "user_owned", verified: true },
  { table: "role_master", column: "user_id", handledBy: "user_owned", verified: true },
  { table: "project_master", column: "user_id", handledBy: "user_owned", verified: true },
  { table: "questionnaire_responses", column: "user_id", handledBy: "user_owned", verified: true },
  { table: "cycle_periods", column: "user_id", handledBy: "user_owned", verified: true },
  { table: "consent_records", column: "user_id", handledBy: "user_owned", verified: true },
  { table: "age_answer_changes", column: "user_id", handledBy: "user_owned", verified: true },
  { table: "cohort_changes", column: "user_id", handledBy: "user_owned", verified: true },
  { table: "user_notices", column: "user_id", handledBy: "user_owned", verified: true },
  { table: "entries", column: "user_id", handledBy: "user_owned", verified: true },
  // ★2026-09-01 に追加。ここが空いていたせいで、Dashboard の Delete user が
  //   「Database error deleting user」で失敗していました。
  { table: "events", column: "user_id", handledBy: "user_owned", verified: true },
  { table: "feedback", column: "user_id", handledBy: "user_owned", verified: true },
  { table: "memberships", column: "user_id", handledBy: "user_owned", verified: true },
  { table: "subscriptions", column: "user_id", handledBy: "user_owned", verified: true },

  // ---- 本人そのもの ----
  { table: "profiles", column: "id", handledBy: "profiles_step", verified: true },

  // ---- 先生と生徒の関係。行ごと消す ----
  { table: "teacher_student_links", column: "teacher_id", handledBy: "special", verified: true },
  { table: "teacher_student_links", column: "student_id", handledBy: "special", verified: true },
  { table: "teacher_invitations", column: "teacher_id", handledBy: "special", verified: true },
  { table: "lessons", column: "student_id", handledBy: "special", verified: true },

  // ---- 行は残し、その人への紐付けだけ外す ----
  { table: "organizations", column: "created_by", handledBy: "nulled", verified: true },
  { table: "org_invitations", column: "used_by", handledBy: "nulled", verified: true },
  { table: "org_invitations", column: "invited_by", handledBy: "nulled", verified: true },
  { table: "teacher_invitations", column: "used_by_student_id", handledBy: "nulled", verified: true },
  { table: "lessons", column: "teacher_id", handledBy: "nulled", verified: true },
  { table: "lessons", column: "created_by", handledBy: "nulled", verified: true },

  // ---- 外部キーの CASCADE に任せるもの（★実物を確認ずみ・2026-09-01） ----
  { table: "assignments", column: "student_id", handledBy: "cascade", verified: true },
  { table: "enrollments", column: "student_id", handledBy: "cascade", verified: true },

  // ★2026-09-01 の棚卸しで確かめました。
  //   NO ACTION / RESTRICT の一覧（check_auth_user_references.sql の2つめ）に
  //   ★出てきませんでした。つまり退会を止める側ではありません。
  //   ★ただし「CASCADE だと確かめた」わけではありません。
  //     分かったのは「NO ACTION でも RESTRICT でもない」ことだけです。
  //     CASCADE か SET NULL か、あるいは auth.users への外部キーが
  //     そもそも無いのか、までは見ていません。
  //     ★退会の可否には影響しないので、ここまでで足ります。
  { table: "assignments", column: "teacher_id", handledBy: "cascade", verified: true,
    note: "2026-09-01 の棚卸しで、NO ACTION / RESTRICT の一覧に出なかった。"
        + "★具体的な規則までは見ていない（CASCADE か SET NULL か不明）。"
        + "分かっているのは「退会を止めない」ことだけ。" }
];

/**
 * ★実物を確かめるまで、行き先を決められない列。
 *
 *   ここが空でない間は、その列を持つ人の退会が失敗しうる、という意味です。
 *   ★supabase/check_auth_user_references.sql の2つめの表に出てくるなら、
 *     （＝NO ACTION なら）その列は必ずどこかの一覧に入れてください。
 *     出てこないなら（＝CASCADE なら）handledBy を cascade、
 *     verified を true にしてください。
 */
export const PENDING_VERIFICATION = [
  // ★2026-09-01 の棚卸しで空になりました。
  //   NO ACTION / RESTRICT だったのは7列で、すべて既に扱っています。
  //     lessons.created_by / teacher_id        → NULLED_REFERENCES
  //     lessons.student_id                     → SPECIAL_DELETES
  //     org_invitations.invited_by / used_by   → NULLED_REFERENCES
  //     organizations.created_by               → NULLED_REFERENCES
  //                                              （solo は closeOrg が先に行ごと消す）
  //     teacher_invitations.used_by_student_id → NULLED_REFERENCES
  //   ★新しい表を作ったら、もう一度この棚卸しを流してください。
];

/** 台帳に無い列が実物にあれば、それが次の事故です。 */
export function findUnhandled() {
  return AUTH_USER_REFERENCES.filter((r) => !r.handledBy || !HANDLERS.includes(r.handledBy));
}

/** ★確かめていないのに CASCADE に頼っている列。ここが空でないと危ないです。 */
export function findUnverifiedCascades() {
  return AUTH_USER_REFERENCES.filter((r) => r.handledBy === "cascade" && !r.verified);
}
