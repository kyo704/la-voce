import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserWithTimeout } from "@/lib/withTimeout";

// ============================================================================
// 教室への招待を受けて、参加する（2026-09-02）
//
//   ★これまで、一度も成功していませんでした
//     画面から、自分の memberships を自分で入れていました。
//       supabase.from("memberships").insert({ org_id, user_id, role: "teacher" })
//     招待された人は、まだ★その教室の誰でもありません。教室を作った人でも
//     ありません。教室には既に人が居ます。memberships の INSERT ポリシーは
//     どれも当てはまらず、必ず 403 になります。
//     ★つまり「教室への招待」は、これまで誰ひとり受けられませんでした。
//     しかも画面には「参加に失敗しました。もう一度お試しください。」と出ます。
//     ★何度やっても通らないものに、再試行をすすめていました。
//
//   ★RLS をゆるめる直し方は採りません
//     「自分の membership を自分で入れてよい」ことにすると、
//     ★教室のIDさえ知っていれば誰でも教室に入れます。
//
//   ★権限の根拠は、招待コードそのものです
//     在籍（/api/enrollment/accept）は「先生との紐付けがあること」を根拠に
//     しました。あちらには、先に成立している関係があったからです。
//     こちらには、まだ何の関係もありません。★招待とは、関係が無い人に
//     権限を渡すための仕組みです。だからコードが根拠になります。
//     コードは31文字から8文字（約8500億通り）・1回きり・7日で期限切れです。
//
//   ★コードを先に押さえてから、membership を作ります
//     逆にすると、同時に2回押されたときに2つ入ります。
//     membership の作成に失敗したら、★押さえたコードは戻します。
//     戻さないと、正しいコードが二度と使えなくなります。
// ============================================================================

export async function POST(request) {
  const supabase = createClient();
  const { user, unreachable } = await getUserWithTimeout(supabase, "教室に参加する認証確認");
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

  const { data: invitation, error: invError } = await admin
    .from("org_invitations")
    .select("*")
    .eq("code", code)
    .maybeSingle();
  if (invError) {
    console.error("招待を読めませんでした:", invError);
    return NextResponse.json({ error: "参加できませんでした。" }, { status: 500 });
  }
  if (!invitation) {
    return NextResponse.json({ error: "コードが見つかりませんでした。" }, { status: 404 });
  }
  if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
    return NextResponse.json({ error: "このコードは期限切れです。" }, { status: 409 });
  }

  const orgId = invitation.org_id;
  if (!orgId) {
    console.error("招待に教室が入っていません:", { code });
    return NextResponse.json({ error: "参加できませんでした。" }, { status: 500 });
  }

  // ==========================================================================
  // ★既に入っているなら、それで終わりです
  //   通信が途中で切れて、もう一度押した場合がこれです。
  //   「失敗しました」と言わないこと。実際、入れているのですから。
  // ==========================================================================
  const { data: existing, error: existingError } = await admin
    .from("memberships")
    .select("id")
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .limit(1);
  if (existingError) {
    console.error("参加状況を確認できませんでした:", existingError);
    return NextResponse.json({ error: "参加できませんでした。" }, { status: 500 });
  }
  if (existing && existing.length > 0) {
    if (!invitation.used_at) {
      await admin.from("org_invitations")
        .update({ used_at: new Date().toISOString(), used_by: user.id })
        .eq("code", code).is("used_at", null);
    }
    return NextResponse.json({ ok: true, orgId, alreadyMember: true });
  }

  if (invitation.used_at) {
    return NextResponse.json({ error: "このコードは使用済みです。" }, { status: 409 });
  }

  // ==========================================================================
  // ★コードを押さえる（1回きりであることを、ここで保証します）
  //   is("used_at", null) を付けているので、同時に2回来ても
  //   ★片方しか行を取れません。取れなかったほうは 0 行が返ります。
  // ==========================================================================
  const { data: claimed, error: claimError } = await admin
    .from("org_invitations")
    .update({ used_at: new Date().toISOString(), used_by: user.id })
    .eq("code", code)
    .is("used_at", null)
    .select("code");
  if (claimError) {
    console.error("招待を押さえられませんでした:", claimError);
    return NextResponse.json({ error: "参加できませんでした。" }, { status: 500 });
  }
  if (!claimed || claimed.length === 0) {
    return NextResponse.json({ error: "このコードは使用済みです。" }, { status: 409 });
  }

  const role = invitation.role || "teacher";
  const { error: memError } = await admin
    .from("memberships")
    .insert({ org_id: orgId, user_id: user.id, role });
  if (memError) {
    // ★押さえたコードを戻します。戻さないと、正しいコードが死にます。
    const { error: releaseError } = await admin
      .from("org_invitations")
      .update({ used_at: null, used_by: null })
      .eq("code", code);
    if (releaseError) {
      console.error("★招待を戻せませんでした。このコードは使えなくなります:", { code, message: releaseError.message });
    }
    console.error("教室に参加できませんでした:", { orgId, message: memError.message });
    return NextResponse.json({ error: "参加できませんでした。" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, orgId, alreadyMember: false, role });
}
