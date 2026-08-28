import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserWithTimeout } from "@/lib/withTimeout";
import { BRAND } from "@/lib/brand";

const FEEDBACK_TO_EMAIL = "kyo0703opera@gmail.com";

export async function POST(request) {
  const supabase = createClient();
  const { user, unreachable } = await getUserWithTimeout(supabase, "問い合わせの認証確認");
  // ★「確認できなかった」と「ログインしていない」を分ける。
  //   つながらないときに 401 を返すと、利用者は「ログインし直してください」と
  //   案内され、ログインもできず途方に暮れます。503 を返して、時間を置けば
  //   直ることを伝えます。
  if (unreachable) {
    return NextResponse.json({ error: "いま、つながりません。少し待ってからお試しください。" }, { status: 503 });
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

  const category = (body.category || "その他").toString().slice(0, 50);
  const message = (body.message || "").toString().trim().slice(0, 5000);
  if (!message) {
    return NextResponse.json({ error: "内容を入力してください。" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error: dbError } = await admin.from("feedback").insert({
    user_id: user.id,
    email: user.email,
    category,
    message
  });
  if (dbError) {
    return NextResponse.json({ error: "送信に失敗しました。時間をおいて再度お試しください。" }, { status: 500 });
  }

  // メール送信(RESEND_API_KEY が設定されている場合のみ)。
  // 失敗してもデータベースには保存済みなので、致命的なエラーにはしない。
  if (process.env.RESEND_API_KEY) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: process.env.FEEDBACK_FROM_EMAIL || `${BRAND.name} Feedback <onboarding@resend.dev>`,
          to: FEEDBACK_TO_EMAIL,
          reply_to: user.email,
          subject: `[${BRAND.name} フィードバック] ${category}`,
          text: `送信者: ${user.email}\n種類: ${category}\n\n${message}`
        })
      });
    } catch (e) {
      // no-op: メール送信の失敗はユーザーには見せない
    }
  }

  return NextResponse.json({ ok: true });
}
