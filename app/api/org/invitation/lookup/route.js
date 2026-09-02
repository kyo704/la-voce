import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserWithTimeout } from "@/lib/withTimeout";

// ============================================================================
// 教室への招待コードを、確かめるだけ（2026-09-02）
//
//   ★なぜサーバ側なのか
//     これまでは画面から org_invitations を直接読んでいました。
//       supabase.from("org_invitations").select("*, org:organizations(name)")
//     招待された人は、まだその教室の誰でもありません。
//     org_invitations のポリシーが「教室の関係者だけ」であれば、
//     ★エラーではなく0行が返り、画面には「コードが見つかりませんでした。」
//     と出ます。★コードは正しいのに、です。
//     在籍（enrollments）でまったく同じことが起きていました（2026-09-01）。
//
//   ★ここでは何も書きません。読むだけです。
//     「参加する」を押したときに、accept のほうで初めて書きます。
//
//   ★教室の名前しか返しません。
//     誰が招待したか、ほかに誰が居るかは返しません。
// ============================================================================

export async function POST(request) {
  const supabase = createClient();
  const { user, unreachable } = await getUserWithTimeout(supabase, "招待の確認");
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

  // ★select("*") にしています。列の名前を決め打ちすると、
  //   知らない列があったときに PostgREST が要求全体を弾きます（PGRST204）。
  const { data: invitation, error } = await admin
    .from("org_invitations")
    .select("*")
    .eq("code", code)
    .maybeSingle();
  if (error) {
    console.error("招待を読めませんでした:", error);
    return NextResponse.json({ error: "招待を確認できませんでした。" }, { status: 500 });
  }
  if (!invitation) {
    return NextResponse.json({ error: "コードが見つかりませんでした。" }, { status: 404 });
  }
  if (invitation.used_at) {
    return NextResponse.json({ error: "このコードは使用済みです。" }, { status: 409 });
  }
  if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
    return NextResponse.json({ error: "このコードは期限切れです。" }, { status: 409 });
  }

  const { data: org, error: orgError } = await admin
    .from("organizations")
    .select("id, name")
    .eq("id", invitation.org_id)
    .maybeSingle();
  if (orgError) {
    console.error("教室を読めませんでした:", orgError);
    return NextResponse.json({ error: "招待を確認できませんでした。" }, { status: 500 });
  }

  // ★既に入っている人には、そう伝えます。
  //   「参加に失敗しました」と出すと、何度も押させることになります。
  const { data: existing } = await admin
    .from("memberships")
    .select("id")
    .eq("org_id", invitation.org_id)
    .eq("user_id", user.id)
    .limit(1);

  return NextResponse.json({
    ok: true,
    code,
    orgId: invitation.org_id,
    orgName: org ? org.name : null,
    alreadyMember: !!(existing && existing.length > 0)
  });
}
