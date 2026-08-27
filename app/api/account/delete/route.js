import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ============================================================================
// アカウントの削除（統合実行ルートv4 G3-17 / 改善タスクv2 P0-3）
//
// 受け入れ条件:「削除後、同一メールで再登録しても旧データが復活しない」
//   → auth のユーザーを消すだけでは足りない。schema.sql で on delete cascade が
//     付いているのは profiles / subscriptions / entries の3つだけで、あとから
//     手作業で足されたテーブルには付いていない可能性がある。
//     取り残された行は「持ち主のいないデータ」として残り続けるので、
//     ここで明示的に消してから auth のユーザーを消す。
//
// ★1つのテーブルの削除に失敗しても、そこで止めない。
//   途中で止めると「一部だけ消えた」状態が残り、次に再試行しても
//   同じところで止まる。失敗したテーブルを記録して最後まで進み、
//   1つでも失敗があれば auth のユーザーは消さずに報告する
//   （ユーザーが消えると、残った行に手が届かなくなるため）。
// ============================================================================

// 削除する順序。子から先に消す（外部キーの参照が残らないように）。
const USER_OWNED_TABLES = [
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
  "entries",
  "feedback",
  "assignments",
  "enrollments",
  "memberships",
  "subscriptions"
];

// user_id 以外の列で本人に紐づくもの。
const SPECIAL_DELETES = [
  { table: "teacher_student_links", column: "student_id" },
  { table: "teacher_student_links", column: "teacher_id" },
  { table: "teacher_invitations", column: "teacher_id" }
];

export async function POST(request) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  // 本人確認。画面で入力させた文字列を、ここでもう一度突き合わせる。
  // 画面側だけの確認では、リクエストを直接投げれば素通りしてしまう。
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ error: "不正なリクエストです。" }, { status: 400 });
  }
  const typed = (body.confirmation || "").trim();
  const okByEmail = typed.toLowerCase() === (user.email || "").toLowerCase();
  const okByPhrase = typed === "削除します";
  if (!okByEmail && !okByPhrase) {
    return NextResponse.json(
      { error: "確認の入力が一致しません。登録メールアドレス、または「削除します」と入力してください。" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const failures = [];

  for (const table of USER_OWNED_TABLES) {
    const { error } = await admin.from(table).delete().eq("user_id", user.id);
    // テーブルが存在しない環境もあるため、その場合は失敗として数えない。
    if (error && !/does not exist|schema cache/i.test(error.message || "")) {
      failures.push({ table, message: error.message });
    }
  }
  for (const { table, column } of SPECIAL_DELETES) {
    const { error } = await admin.from(table).delete().eq(column, user.id);
    if (error && !/does not exist|schema cache/i.test(error.message || "")) {
      failures.push({ table: `${table}.${column}`, message: error.message });
    }
  }
  // 教室のオーナーだった場合、教室そのものは他の人が使っている可能性がある。
  // 勝手に消さず、作成者の紐付けだけ外す。
  const { error: orgError } = await admin
    .from("organizations").update({ created_by: null }).eq("created_by", user.id);
  if (orgError && !/does not exist|schema cache/i.test(orgError.message || "")) {
    failures.push({ table: "organizations", message: orgError.message });
  }

  const { error: profileError } = await admin.from("profiles").delete().eq("id", user.id);
  if (profileError) failures.push({ table: "profiles", message: profileError.message });

  if (failures.length > 0) {
    // ★ここで auth のユーザーを消さない。消すと残った行に手が届かなくなる。
    console.error("アカウント削除：一部のデータを削除できませんでした。", failures);
    return NextResponse.json(
      { error: "一部のデータを削除できませんでした。お手数ですが、時間をおいてもう一度お試しください。", failures },
      { status: 500 }
    );
  }

  const { error: deleteUserError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteUserError) {
    console.error("アカウント削除：認証ユーザーを削除できませんでした。", deleteUserError);
    return NextResponse.json({ error: "アカウントを削除できませんでした。時間をおいてもう一度お試しください。" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
