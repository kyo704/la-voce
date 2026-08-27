import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // ★next は自サイト内のパスだけを許す。外部URLを渡されると、
  //   認証直後のユーザーを他所へ飛ばす踏み台（オープンリダイレクト）になる。
  const rawNext = searchParams.get("next") ?? "/billing";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/billing";

  if (code) {
    const supabase = createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
