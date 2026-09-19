import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { FAILED_LINE } from "@/lib/guardianConsent";

// ============================================================================
// ★保護者が「承知しました」を 押す 道（★裁定 その107・2026-09-20）
//
//   ★★★押す 方は、★お入りに なって いません。★合言葉 だけ が 手がかり です。
//     ★★守るのは 長さ（32バイト）と 期限（7日）と 1度きり です。
//
//   ★★★通らない ときの 答えを 分けません（★裁定 その77）。
//     ★★「無い」「切れた」「もう 済んだ」を 同じ 1文に します。
//     ★★★分けると、★合言葉を 総当たりして 中が 分かります。
//
//   ★見張り components/tests/guardian-consent.test.js
// ============================================================================

export const runtime = "nodejs";

export async function POST(request) {
  let body = null;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: FAILED_LINE }, { status: 200 });
  }
  const token = typeof body.token === "string" ? body.token.trim() : "";
  if (!token) {
    return NextResponse.json({ ok: false, error: FAILED_LINE }, { status: 200 });
  }

  // ★★読み道が 決めます。★ここでは 判じません。
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("accept_guardian_consent", { p_token: token });
  if (error) {
    console.error("★保護者の同意：受け取れませんでした:", error);
    return NextResponse.json({ ok: false, error: FAILED_LINE }, { status: 200 });
  }
  const ok = Array.isArray(data) && data.length > 0 && data[0].ok === true;
  // ★★★通っても 通らなくても、★同じ 形で 返します。★番も 同じ です。
  return NextResponse.json({ ok, error: ok ? null : FAILED_LINE }, { status: 200 });
}
