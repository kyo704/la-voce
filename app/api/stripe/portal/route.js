import { NextResponse } from "next/server";
import { absoluteUrl } from "@/lib/baseUrl";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe, stripeConfigured } from "@/lib/stripe";
import { getUserWithTimeout } from "@/lib/withTimeout";

export async function POST() {
  // ★鍵が無いなら、ここで止まります（2026-09-03）。
  //   ★確かめたこと：new Stripe(undefined) は投げません。呼んだときに
  //     初めて失敗します。つまり見張りが無いと、メールアドレスと利用者IDが
  //     ★api.stripe.com へ出てから拒否されます。
  //   ★/api/advice と同じ形です。閉じるほうへ倒します。
  if (!stripeConfigured()) {
    return NextResponse.json(
      { error: "この機能は、いまお使いいただけません。" },
      { status: 503 }
    );
  }

  const supabase = createClient();
  const { user, unreachable } = await getUserWithTimeout(supabase, "請求ポータルの認証確認");
  // ★「確認できなかった」と「ログインしていない」を分ける。
  //   つながらないときに 401 を返すと、利用者は「ログインし直してください」と
  //   案内され、ログインもできず途方に暮れます。503 を返して、時間を置けば
  //   直ることを伝えます。
  if (unreachable) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: sub } = await admin
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .single();

  if (!sub || !sub.stripe_customer_id) {
    return NextResponse.json({ error: "no customer" }, { status: 400 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: absoluteUrl("/billing")
  });

  return NextResponse.json({ url: session.url });
}
