import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserWithTimeout } from "@/lib/withTimeout";
import {
  WITHDRAW_MAIL_SUBJECT, withdrawMailLines, WITHDRAW_FAILED
} from "@/lib/guardianConsent";

// ============================================================================
// ★保護者の 同意を 取り消す（★裁定 その107 §4・2026-09-20）
//
//   ★★★3つを、★この 順で します ──
//     ①同意に 印を つける（`withdraw_guardian_consent`）
//     ②学校から 出る（`leave_enrollment`）
//     ③保護者に 1通 お知らせ
//   ★★★記録は 1行も 消しません。★出欠と 連絡は 学校に 残ります。
//
//   ★★★②が 通らなければ、★①は もう 付いて います。
//     ★★そのときは「取り消せませんでした」と お伝えします。
//     ★★もう一度 押せば、★②から やり直せます（★①は 何度 押しても 同じ）。
//
//   ★見張り components/tests/guardian-consent.test.js
// ============================================================================

export const runtime = "nodejs";

export async function POST(request) {
  const supabase = createClient();
  const { user, unreachable } = await getUserWithTimeout(supabase, "保護者の同意の取り消し");
  if (unreachable) return NextResponse.json({ error: WITHDRAW_FAILED }, { status: 503 });
  if (!user) return NextResponse.json({ error: WITHDRAW_FAILED }, { status: 401 });

  let body = null;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: WITHDRAW_FAILED }, { status: 400 });
  }
  const orgId = typeof body.orgId === "string" ? body.orgId : "";
  if (!orgId) return NextResponse.json({ error: WITHDRAW_FAILED }, { status: 400 });

  // ★① 同意に 印を つけます（★保護者の メールも 返ります）。
  const { data, error } = await supabase.rpc("withdraw_guardian_consent", {
    p_org_id: orgId
  });
  if (error || !Array.isArray(data) || data.length === 0) {
    console.error("★保護者の同意：取り消せませんでした:", error);
    return NextResponse.json({ error: WITHDRAW_FAILED }, { status: 500 });
  }
  const mail = data[0].guardian_email || "";

  // ★② 学校から 出ます（★もとから ある 道を 使います。★2本に しません）。
  const { error: leaveError } = await supabase.rpc("leave_enrollment", { p_org_id: orgId });
  if (leaveError) {
    console.error("★保護者の同意：学校から 出られませんでした:", leaveError);
    return NextResponse.json({ error: WITHDRAW_FAILED }, { status: 500 });
  }

  // ★③ 保護者に 1通。★送れなくても、★ここで 止めません。
  let sent = false;
  if (mail && process.env.RESEND_API_KEY && process.env.FEEDBACK_FROM_EMAIL) {
    const admin = createAdminClient();
    const [{ data: 学校 }, { data: 生徒 }] = await Promise.all([
      admin.from("organizations").select("name").eq("id", orgId).maybeSingle(),
      admin.from("profiles").select("display_name").eq("id", user.id).maybeSingle()
    ]);
    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: process.env.FEEDBACK_FROM_EMAIL,
          to: [mail],
          subject: WITHDRAW_MAIL_SUBJECT,
          text: withdrawMailLines({
            studentName: (生徒 && 生徒.display_name) || "",
            orgName: (学校 && 学校.name) || ""
          }).join("\n")
        })
      });
      sent = r.ok;
      if (!r.ok) console.error("★保護者の同意：お知らせを 送れませんでした", r.status);
    } catch (e) {
      console.error("★保護者の同意：お知らせを 送れませんでした", e);
    }
  }

  return NextResponse.json({ ok: true, sent });
}
