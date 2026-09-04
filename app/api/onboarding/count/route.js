import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isFunnelStep } from "@/lib/onboardingFunnel";

// ============================================================================
// 導線の数を、1つ増やす（2026-09-04）
//
//   ★★外部の解析サービスを入れません。★ここが、その代わりです。
//
//   ★受け取るのは★段の名前だけです。
//     ★★user_id も、IP も、端末の識別子も、★受け取る口がありません。
//     ★「入れないでください」ではなく、★入れられない形にしています。
//
//   ★ログインしていない方も呼びます（着地のページ）。
//     ★★だから認証を求めません。
//     ★数を水増しされる余地はありますが、
//       ★★入っているのは数だけで、★誰の何でもありません。
//       ★水増しされて困るのは、★私たちの見立てだけです。
//
//   ★失敗しても、★画面を止めません。★呼ぶ側は待ちません。
// ============================================================================

export async function POST(request) {
  let step = null;
  try {
    const body = await request.json();
    step = body && typeof body.step === "string" ? body.step : null;
  } catch (e) {
    step = null;
  }
  // ★知らない名前は、受け取りません。★既定に倒しません。
  if (!isFunnelStep(step)) {
    return NextResponse.json({ error: "step" }, { status: 400 });
  }

  // ★日付は、サーバが決めます。★受け取りません。
  //   ★★端末の時計を信じると、★過去や未来に積まれます。
  const today = new Date().toISOString().slice(0, 10);

  try {
    const admin = createAdminClient();
    // ★1つ増やすだけの関数です。★読み書きの競争が起きても、数が飛びません。
    const { error } = await admin.rpc("bump_onboarding_count", {
      p_day: today,
      p_step: step
    });
    if (error) {
      console.error("★導線の数を増やせませんでした:", error.message);
      return NextResponse.json({ ok: false }, { status: 200 });
    }
  } catch (e) {
    console.error("★導線の数を増やせませんでした:", e && e.message);
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  return NextResponse.json({ ok: true });
}
