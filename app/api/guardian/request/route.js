import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserWithTimeout } from "@/lib/withTimeout";
import { MAIL_SUBJECT, mailLines, FAILED_LINE } from "@/lib/guardianConsent";

// ============================================================================
// ★保護者に 1通 お送りする 道（★裁定 その107・2026-09-20）
//
//   ★★★合言葉は 台帳が 作ります（`request_guardian_consent`）。
//     ★★ここでは 作りません。★作り方が 2か所に なります。
//
//   ★★★送れなくても、★行は 残ります。
//     ★★もう一度 お送りできます。★そのたび 新しい 合言葉に なります。
//
//   ★★★保護者に 学生の 記録を 見せません。★学校の 名と 先生の 名 だけ です。
//
//   ★見張り components/tests/guardian-consent.test.js
// ============================================================================

export const runtime = "nodejs";

export async function POST(request) {
  const supabase = createClient();
  const { user, unreachable } = await getUserWithTimeout(supabase, "保護者の同意");
  if (unreachable) {
    return NextResponse.json({ error: FAILED_LINE }, { status: 503 });
  }
  if (!user) {
    return NextResponse.json({ error: FAILED_LINE }, { status: 401 });
  }

  let body = null;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: FAILED_LINE }, { status: 400 });
  }
  const orgId = typeof body.orgId === "string" ? body.orgId : "";
  const teacherId = typeof body.teacherId === "string" ? body.teacherId : null;
  const email = typeof body.guardianEmail === "string" ? body.guardianEmail.trim() : "";
  // ★★形だけ 見ます。★届くか どうかは 送って みないと 分かりません。
  if (!orgId || !email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "メールアドレスを お確かめ ください。" }, { status: 400 });
  }

  // ★★合言葉を 作ります（★台帳が 作ります）。
  const { data, error } = await supabase.rpc("request_guardian_consent", {
    p_org_id: orgId, p_teacher_id: teacherId, p_guardian_email: email
  });
  if (error || !Array.isArray(data) || data.length === 0) {
    console.error("★保護者の同意：合言葉を作れませんでした:", error);
    return NextResponse.json({ error: FAILED_LINE }, { status: 500 });
  }
  const token = data[0].token;

  // ★★名前を 添えます（★見せるのは 学校と 先生の 名 だけ）。
  const admin = createAdminClient();
  const [{ data: 学校 }, { data: 生徒 }, { data: 先生 }] = await Promise.all([
    admin.from("organizations").select("name").eq("id", orgId).maybeSingle(),
    admin.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
    teacherId
      ? admin.from("profiles").select("display_name").eq("id", teacherId).maybeSingle()
      : Promise.resolve({ data: null })
  ]);

  const base = process.env.NEXT_PUBLIC_SITE_URL || "";
  const url = `${base}/guardian/${token}`;
  const 行 = mailLines({
    studentName: (生徒 && 生徒.display_name) || "",
    orgName: (学校 && 学校.name) || "",
    teacherName: (先生 && 先生.display_name) || "",
    url
  });

  // ★★★送れなくても、★ここで 500 に しません。
  //   ★★行は もう 出来て います。★もう一度 お送りできます。
  let sent = false;
  if (process.env.RESEND_API_KEY && process.env.FEEDBACK_FROM_EMAIL) {
    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: process.env.FEEDBACK_FROM_EMAIL,
          to: [email],
          subject: MAIL_SUBJECT,
          text: 行.join("\n")
        })
      });
      sent = r.ok;
      if (!r.ok) console.error("★保護者の同意：送れませんでした", r.status);
    } catch (e) {
      console.error("★保護者の同意：送れませんでした", e);
    }
  } else {
    console.error("★保護者の同意：メールの設定が ありません（RESEND_API_KEY）");
  }

  // ★★★合言葉を 返しません。★画面に 出しません。
  //   ★★出すと、★学生が ご自分で 押せて しまいます。
  return NextResponse.json({ ok: true, sent });
}
