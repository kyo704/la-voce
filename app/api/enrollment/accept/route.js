import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserWithTimeout } from "@/lib/withTimeout";

// ============================================================================
// 招待を受けた生徒を、教室に在籍させる（2026-09-01）
//
//   ★なぜサーバ側に移したか
//     これまでは生徒の画面から、★先生の memberships を読んでいました。
//       supabase.from("memberships").select("org_id")
//         .eq("user_id", 先生).eq("role", "owner").maybeSingle()
//     memberships_select は「本人か、教室のオーナー・管理者」だけなので、
//     生徒には0行が返ります。★エラーではなく、ただの0行です。
//     その結果 enrollments の upsert は一度も実行されず、
//     ★enrollments はこの日まで全体で0行でした。
//     生徒の一覧・先生の名簿・担当・レッスンが、すべて空のままでした。
//
//   ★RLS をゆるめる直し方は採りません
//     「生徒が enrollments を自分で入れてよい」ことにすると、
//     ★教室のIDさえ知っていれば誰でも在籍できます。
//     共有範囲の設計（lib/shareScope.js）と逆向きです。
//
//   ★権限の根拠
//     「先生と生徒の紐付けが、いま有効であること」だけです。
//     招待コードは★教室を特定するために使い、権限の根拠にはしません。
//     コードは使用済みになるので、根拠にすると再試行が通らなくなります。
// ============================================================================

export async function POST(request) {
  const supabase = createClient();
  const { user, unreachable } = await getUserWithTimeout(supabase, "在籍の認証確認");
  if (unreachable) return NextResponse.json({ error: "いま、つながりません。" }, { status: 503 });
  if (!user) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ error: "不正なリクエストです。" }, { status: 400 });
  }

  const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
  if (!code) return NextResponse.json({ error: "招待コードがありません。" }, { status: 400 });

  const admin = createAdminClient();

  // ---- 招待から、先生と教室を引く ----
  const { data: invitation, error: invError } = await admin
    .from("teacher_invitations")
    .select("code, teacher_id, org_id")
    .eq("code", code)
    .maybeSingle();
  if (invError) {
    console.error("在籍：招待を読めませんでした。", invError);
    return NextResponse.json({ error: "在籍の登録に失敗しました。" }, { status: 500 });
  }
  if (!invitation) {
    return NextResponse.json({ error: "招待が見つかりません。" }, { status: 404 });
  }

  // ==========================================================================
  // ★権限の確認：いま有効な紐付けがあること
  //
  //   ★招待が使用済みかどうかは見ません。この処理は、紐付けを作った
  //     直後に呼ばれます。そのとき招待は既に使用済みになっています。
  //     使用済みを弾くと、★正しい流れが通らなくなります。
  //   ★見るのは「その先生と、いまつながっているか」だけです。
  // ==========================================================================
  const { data: link, error: linkError } = await admin
    .from("teacher_student_links")
    .select("id")
    .eq("teacher_id", invitation.teacher_id)
    .eq("student_id", user.id)
    .eq("status", "active")
    .limit(1);
  if (linkError) {
    console.error("在籍：紐付けを確認できませんでした。", linkError);
    return NextResponse.json({ error: "在籍の登録に失敗しました。" }, { status: 500 });
  }
  if (!link || link.length === 0) {
    // ★「招待が違う」と「つながっていない」を分けません。
    //   分けると、招待コードの当たりはずれを調べる道具になります。
    return NextResponse.json({ error: "この招待で在籍することはできません。" }, { status: 403 });
  }

  // ---- 教室を決める ----
  // ★新しい招待は org_id を持っています。
  //   古い招待（2026-09-01 より前）は null なので、そのときだけ
  //   先生のオーナー教室を見にいきます。★埋め戻しはしません。
  let orgId = invitation.org_id || null;
  if (!orgId) {
    const { data: owned, error: ownedError } = await admin
      .from("memberships")
      .select("org_id")
      .eq("user_id", invitation.teacher_id)
      .eq("role", "owner")
      .order("created_at", { ascending: true })
      .limit(1);
    if (ownedError) {
      console.error("在籍：先生の教室を確認できませんでした。", ownedError);
      return NextResponse.json({ error: "在籍の登録に失敗しました。" }, { status: 500 });
    }
    orgId = owned && owned.length > 0 ? owned[0].org_id : null;
  }

  // ★先生が教室を持っていないことは、失敗ではありません。
  //   つながり自体は成立しています。在籍だけが作られません。
  if (!orgId) {
    return NextResponse.json({ ok: true, enrolled: false, reason: "no_org" });
  }

  const { error: enrollError } = await admin
    .from("enrollments")
    .upsert({ org_id: orgId, student_id: user.id, status: "active" }, { onConflict: "org_id,student_id" });
  if (enrollError) {
    console.error("在籍：登録できませんでした。", { orgId, message: enrollError.message });
    return NextResponse.json({ error: "在籍の登録に失敗しました。" }, { status: 500 });
  }

  // ==========================================================================
  // 担当（assignments）も、ここで作ります。
  //
  //   ★画面からは作れません。生徒は org_id を知る手段が無く、
  //     assignments の RLS もオーナー・管理者向けだからです。
  //   ★二重に作らないよう、先に有無を見ます。
  //     一意制約の形が分からないので、upsert の onConflict に頼りません。
  // ==========================================================================
  const { data: existingAssignment, error: findError } = await admin
    .from("assignments")
    .select("id")
    .eq("org_id", orgId)
    .eq("teacher_id", invitation.teacher_id)
    .eq("student_id", user.id)
    .limit(1);
  if (findError) {
    // ★在籍は作れています。担当が作れなくても、そこは巻き戻しません。
    console.error("在籍：担当を確認できませんでした。", findError);
    return NextResponse.json({ ok: true, enrolled: true, assigned: false, orgId });
  }
  if (!existingAssignment || existingAssignment.length === 0) {
    const { error: assignError } = await admin
      .from("assignments")
      .insert({ org_id: orgId, teacher_id: invitation.teacher_id, student_id: user.id });
    if (assignError) {
      console.error("在籍：担当を作れませんでした。", { orgId, message: assignError.message });
      return NextResponse.json({ ok: true, enrolled: true, assigned: false, orgId });
    }
  }

  return NextResponse.json({ ok: true, enrolled: true, assigned: true, orgId });
}
