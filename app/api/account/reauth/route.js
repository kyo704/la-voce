import { NextResponse } from "next/server";
import { createClient as createPlainClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserWithTimeout } from "@/lib/withTimeout";
import { verifyPassword } from "@/lib/reauth";

// ============================================================================
// もう一度の確かめ（2026-09-05）
//
//   出どころ docs/opus/lavoce-判断-Face IDでの再確認.md
//            lib/reauth.js
//
//   ★★ここが、★確かめを覚える唯一の場所です。
//     ★画面には覚えさせません。★画面は、パスワードを渡すだけです。
//
//   ★★いまのセッションを、★動かしません。
//     ★セッションを持たないクライアントで確かめます。
//     ★（cookie 付きのクライアントで signInWithPassword を呼ぶと、
//        ★いまのセッションが書き換わります ── delete/route.js:80）
//
//   ★覚えるのは、★時刻だけです。
//     ★どのパスワードだったかは、★持ちません。★持つ必要がありません。
// ============================================================================

export async function POST(request) {
  const supabase = createClient();
  const { user, unreachable } = await getUserWithTimeout(supabase, "もう一度の確かめ");
  // ★「つながらない」と「入っていない」を分けます。
  //   ★つながらないときに 401 を返すと、★入り直しを勧めてしまいます。
  if (unreachable) {
    return NextResponse.json({ error: "いま、つながりません。" }, { status: 503 });
  }
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ error: "不正なリクエストです。" }, { status: 400 });
  }

  const password = typeof body.password === "string" ? body.password : "";
  if (!password) {
    return NextResponse.json({ error: "パスワードをご入力ください。" }, { status: 400 });
  }

  // ★★アドレスは、★入っている方のものを使います。
  //   ★画面から渡させないこと。★他人のアドレスを試されます。
  const ok = await verifyPassword({
    createPlainClient,
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    email: user.email,
    password
  });
  if (!ok) {
    // ★理由を細かく分けないこと。★「このメールは在る」を漏らさないためです。
    return NextResponse.json({ error: "パスワードが一致しません。" }, { status: 401 });
  }

  // ★★時刻は、★サーバの時計で入れます。★画面の時計は使いません。
  //   ★端末の時計は、ずれます。★ずらされることもあります。
  const admin = createAdminClient();
  const at = new Date().toISOString();
  // ★profiles は update だけです（upsert にしないこと ── RLS が INSERT を許しません）。
  //   ★★ここは service_role なので RLS は通りませんが、★形をそろえます。
  const { error } = await admin
    .from("profiles").update({ reauth_at: at }).eq("id", user.id).select("id");
  if (error) {
    // ★★列がまだ無いときは、42703 で来ます。
    //   ★確かめ自体は通っているので、★止めません。
    //   ★ただし、★覚えられなかったことは伝えます（★次でまた聞かれます）。
    console.error("★確かめた時刻を覚えられませんでした:", error.message);
    return NextResponse.json({ ok: true, remembered: false, at }, { status: 200 });
  }

  return NextResponse.json({ ok: true, remembered: true, at }, { status: 200 });
}
