import { classifyOwnedOrgs, closeOrg } from "./orgClosure.js";
import { isMissingTable } from "./supabaseErrors.js";

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
// ★この一覧は「user_id 列で消せる表」だけです。
//   2026-09-01、user_id を持たない4表が紛れていました。
//     teacher_notes / lessons / assignments / enrollments
//   以前は isMissingTable が「列が無い」を「表が無い」と誤読して
//   握りつぶしていたので、★静かに何もせず成功扱いになっていました。
//   握りつぶしをやめた結果、実地の削除試験で5件の失敗として表面化しました。
//
//   ★4表の行き先（外部キーの実際の挙動を pg_constraint で確認済み）
//     teacher_notes  … link_id が teacher_student_links に CASCADE。
//                      severConnections が紐付けを消した時点で一緒に消えます
//     assignments    … org_id / student_id が CASCADE
//     enrollments    … org_id / student_id が CASCADE
//     lessons        … link_id / org_id は CASCADE。
//                      created_by / student_id / teacher_id は NO ACTION なので、
//                      SPECIAL_DELETES と NULLED_REFERENCES が個別に扱います
//
//   ★表をこの一覧に足すときは、その表が本当に user_id 列を持つか
//     確かめてください。持たないなら、SPECIAL_DELETES か
//     NULLED_REFERENCES か、外部キーの CASCADE に任せます。
export const USER_OWNED_TABLES = [
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
  // 1回だけ出す知らせの既読。★本人のものなので、一緒に消します。
  "user_notices",
  // ★お知らせの宛先。その方あての行なので、退会で消します（TASK A ③）。
  //   ★notice_batches は消しません。あちらは束そのもので、
  //     決めた時点の人数（frozen_count）しか持ちません。
  //     ★1人の退会で、送った束の記録が消えてはいけません。
  "notice_targets",
  "entries",
  // ★行動ログ。2026-09-01 まで、この一覧に入っていませんでした。
  //   events.user_id は auth.users を参照しているのに、削除の掃除から
  //   丸ごと漏れていて、★Dashboard の Delete user が
  //   「Database error deleting user」で失敗しました。
  //   ★記録を1回でも開いた人は events に行があります。つまり
  //     ほとんどの利用者が、退会できない状態でした。
  //   ★supabase/migration_events.sql には on delete cascade と
  //     書いてありますが、その create は「if not exists」です。
  //     表が先に手で作られていれば、その行は素通りしています。
  //     ★ファイルは証拠になりません。実物の制約を見ること。
  //   ★どちらの制約であっても、ここで先に消せば正しく動きます。
  "events",
  // 組織の予定に「出ます」と印をつけた記録（2026-09-02）。
  // ★本人のものなので、退会のときは一緒に消します。中身は持ちません。
  "org_event_participants",
  "feedback",
  "memberships",
  "subscriptions"
];

// user_id 以外の列で本人に紐づくもの。
export const SPECIAL_DELETES = [
  { table: "teacher_student_links", column: "student_id" },
  { table: "teacher_student_links", column: "teacher_id" },
  { table: "teacher_invitations", column: "teacher_id" },
  // ★生徒が消えたレッスンの行は、残す意味がありません。
  //   （先生が消えた場合は別。行を残して teacher_id を null にします。
  //     Opus の判断・2026-09-01。そちらはまだ実装していません）
  { table: "lessons", column: "student_id" },
  // ★つながりの記録。本人のものなので、退会のときは一緒に消します。
  //   「行を消さない」は★解除したときの話です（履歴として積むため）。
  //   本人がアカウントごと消すときは、消去権のほうが優先します。
  { table: "link_consents", column: "student_id" }
  // ★link_consents.teacher_id は、ここに入れないこと。
  //   ここに入れると、先生が退会したときに★生徒側の履歴が行ごと消えます。
  //   「いつ誰とつながっていたか」は、生徒さん自身の事実です。
  //   外部キーが on delete set null なので、名前だけが外れます（それが正しい）。
];

/**
 * 行は残し、その人への紐付けだけを外す列。
 *
 * ★外部キーが ON DELETE NO ACTION なので、ここを外さないと
 *   auth.users の削除が★外部キー違反で失敗します。
 *   そのとき、記録はもう消えたあとです。
 *
 * ★行ごと消さない理由は、列ごとに違います。
 *   organizations   … 教室は他の人が使っています
 *   org_invitations … 招待の記録は教室のものです
 *   teacher_invitations.used_by_student_id … 同上
 */
export const NULLED_REFERENCES = [
  { table: "organizations", column: "created_by" },
  // ★予定の行は残し、作った人の名前だけ外します。
  //   予定は組織のものです。作った人が抜けても、予定は続きます。
  { table: "org_events", column: "created_by" },
  { table: "org_invitations", column: "used_by" },
  { table: "org_invitations", column: "invited_by" },
  { table: "teacher_invitations", column: "used_by_student_id" },
  // ★先生が退会したときは、行を残して名前だけ外します（Opus 判断・2026-09-01）。
  //   レッスンの日時は「過ぎた事実」で、★生徒側の記録でもあります。
  //   生徒との紐付け（teacher_student_links）とは扱いが違います。あちらは
  //   続いている関係なので、猶予を待たずその場で切れ、取り消しても戻りません。
  //   ★画面では「退会した先生」と出ます（lib/teacherDisplay.js）。
  { table: "lessons", column: "teacher_id" },
  // ★assignments.teacher_id は、ここに★入れてはいけません（2026-09-02）。
  //   一度入れて、すぐ外しました。理由を残します。
  //
  //   実測：assignments_teacher_id_fkey は ★on delete cascade
  //         かつ teacher_id は ★NOT NULL。
  //
  //   ★NOT NULL の列に null を書こうとすると、更新が失敗します。
  //     失敗は failures に積まれ、その手前の
  //       if (failures.length > 0) return { ok: false, failures };
  //     で★deleteUser に辿り着く前に退会が止まります。
  //     つまり「直したつもり」が、★退会を壊します。
  //
  //   ★CASCADE なので、そもそも手当ては要りません。
  //     auth.users が消えれば、担当の行も一緒に消えます。
  //   ★「行を残して名前だけ外す」（lessons.teacher_id の扱い）にしたいなら、
  //     コードではなく★外部キーを set null に変える判断が要ります。
  //     いまは cascade なので、担当の履歴は先生の退会で消えます。
  // ★created_by を null にすると「誰が作ったか」が辿れなくなります。
  //   監査は created_at（いつ作られたか）で見ます。lessons.created_by は
  //   もともと★どこからも読まれていません（書き込みのみ）。
  { table: "lessons", column: "created_by" }
];

/**
 * ★まだ扱っていない列（Opus の判断待ち・2026-09-01）。
 *   ここが空になるまで、退会は先生の側で失敗しうる状態です。
 *   components/tests/account-deletion-fk.test.js が、この一覧と
 *   本番の NO ACTION 制約の突き合わせを見ています。
 */
export const PENDING_FK_DECISIONS = [
  // ★いまは空です。8列すべてを扱っています（2026-09-01）。
  //   entry_comments.created_by は、表ごと削除したので対象から外れました。
];

// ★entry_comments は 2026-09-01 に表ごと削除しました。
//   生徒の記録への自由記述コメントで、憲章 §10・レッスン連絡パッチ §4-1 が
//   禁じている「生徒↔先生の1対1の自由記述」そのものでした。
//   0行のうちに消しています。★同じものを別の名前で作らないこと（憲章 §10）。

// 環境によっては存在しないテーブルがある。それは失敗として数えない。
// ★判定の中身は lib/supabaseErrors.js に移しました（2026-09-01）。
//   orgClosure からも同じ判定が要り、こちらから import すると
//   循環するためです。★ここに書き戻さないこと。2つに増えます。

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
  // ==========================================================================
  // ★いちばん最初に、教室を確かめます（判断 2026-09-01）
  //
  //   ★何かを消す前に見ること。途中まで消してから止めると、
  //     記録だけ消えてアカウントが残ります。いちばん悪い結果です。
  //   ★APIの側でも同じ確認をしています。二重ですが、わざとです。
  //     猶予明けの定期処理（/api/cron/purge-deleted）は API を通らず、
  //     ここへ直接来ます。片方だけだと、そこがすり抜けます。
  // ==========================================================================
  const orgs = await classifyOwnedOrgs(admin, userId);
  if (orgs.error) {
    return { ok: false, failures: [{ table: "organizations", message: orgs.error.message }] };
  }
  if (orgs.blocked.length > 0) {
    // ★失敗ではありません。「先にやることがある」という状態です。
    //   呼ぶ側が failures と取り違えないよう、別の名前で返します。
    return { ok: false, blocked: orgs.blocked, failures: [] };
  }

  const failures = [...(await severConnections(admin, userId))];

  for (const table of USER_OWNED_TABLES) {
    const { error } = await admin.from(table).delete().eq("user_id", userId);
    if (error && !isMissingTable(error)) failures.push({ table, message: error.message });
  }

  // ★ほかに誰もいない教室は、行ごと消します（判断B）。
  //   ★NULLED_REFERENCES より前にやること。あとにすると、
  //     created_by を null にしてから消すことになり、
  //     「誰の教室だったか」が分からないまま失敗したときに追えません。
  for (const orgId of orgs.solo) {
    const closeFailures = await closeOrg(admin, orgId);
    closeFailures.forEach((f) => failures.push({ table: `${f.table}(教室 ${orgId})`, message: f.message }));
  }

  // 行は残し、その人への紐付けだけを外す（NULLED_REFERENCES）。
  // ★外部キーが ON DELETE NO ACTION なので、ここを外さないと
  //   このあとの auth.users の削除が外部キー違反で失敗します。
  for (const { table, column } of NULLED_REFERENCES) {
    const { error } = await admin.from(table).update({ [column]: null }).eq(column, userId);
    if (error && !isMissingTable(error)) failures.push({ table: `${table}.${column}`, message: error.message });
  }

  if (failures.length > 0) return { ok: false, failures };

  // ==========================================================================
  // ★profiles は、ここで消しません（2026-09-02）。
  //
  //   前は auth.users より★先に profiles を消していました。
  //   この2つは★別々の通信で、巻き戻せません。
  //   ★後半（deleteUser）だけ失敗すると、
  //     「ログインできるのに profiles の行が無い人」が残ります。
  //   その人は、アプリを使えます。ですが★保存がひとつも効きません。
  //     書き込みは全部 .update(...).eq("id", userId) で、INSERT のポリシーが
  //     無いためです。★0行の更新を PostgREST はエラーにしません。
  //     つまり★成功したように見えます。本人は気づけません。
  //
  //   ★消す必要はありません。連鎖で消えます。
  //     supabase/schema.sql:9
  //       id uuid references auth.users on delete cascade primary key
  //     auth.users の行が消えれば、profiles の行も★同じ処理の中で消えます。
  //     手で消すのは、余分なだけでなく★危険でした。
  //
  //   ★失敗する向きが、これで逆になります。
  //     deleteUser が失敗しても、profiles は残ります。
  //     利用者は、いつもどおり使えます。もう一度消せば済みます。
  // ==========================================================================
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
