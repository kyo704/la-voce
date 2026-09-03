import { NextResponse } from "next/server";
import { absoluteUrl } from "@/lib/baseUrl";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe, stripeConfigured } from "@/lib/stripe";
import { getUserWithTimeout } from "@/lib/withTimeout";
import { PLAN_KEYS, priceIdFor } from "@/lib/plans";
import { ageBandOf } from "@/lib/ageGate";
import { offeredPlans } from "@/lib/minorBilling";

export async function POST(request) {
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

  // ★どのプランかを、名前で受け取ります（2026-09-04）。
  //   ★★価格ID（price_…）を受け取らないこと。
  //     ★受け取ると、★任意の価格で契約できてしまいます。
  //   ★引き当ては、★サーバ側で行います。
  //   ★知らない名前は、ここで止めます。★既定に倒しません。
  let planKey = null;
  try {
    const body = await request.json();
    planKey = body && typeof body.plan === "string" ? body.plan : null;
  } catch (e) {
    planKey = null;
  }
  if (!planKey || !PLAN_KEYS.includes(planKey)) {
    return NextResponse.json({ error: "plan" }, { status: 400 });
  }

  const supabase = createClient();
  const { user, unreachable } = await getUserWithTimeout(supabase, "決済の認証確認");
  // ★「確認できなかった」と「ログインしていない」を分ける。
  //   つながらないときに 401 を返すと、利用者は「ログインし直してください」と
  //   案内され、ログインもできず途方に暮れます。503 を返して、時間を置けば
  //   直ることを伝えます。
  if (unreachable) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // ★年齢の帯で、出してよいプランが変わります（2026-09-04）。
  //   ★★画面で隠すだけにしないこと。★API を直に叩かれます。
  //   ★帯が分からない方には、★1つも出しません（フェイルクローズ）。
  //   ★15〜17歳には、★月額だけです。★年払いを出しません。
  //     ★長期の契約ほど、★取り消されたときに戻す額が大きくなります。
  const { data: prof } = await admin
    .from("profiles")
    .select("age_band, is_under_18")
    .eq("id", user.id)
    .single();
  const band = ageBandOf(prof);
  if (!offeredPlans(band).includes(planKey)) {
    return NextResponse.json({ error: "plan_not_available" }, { status: 403 });
  }

  // ★価格IDは、名前から引き当てます。
  //   ★環境変数が無ければ、★ここで止めます。★通信は起きません。
  const priceId = priceIdFor(planKey, process.env);
  if (!priceId) {
    return NextResponse.json(
      { error: "この機能は、いまお使いいただけません。" },
      { status: 503 }
    );
  }

  const { data: sub } = await admin
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .single();

  let customerId = sub && sub.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id }
    });
    customerId = customer.id;
    await admin
      .from("subscriptions")
      .update({ stripe_customer_id: customerId })
      .eq("user_id", user.id);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      // ★trial_period_days: 14 を消しました（2026-09-03・Opus §5）。
      //   ★文言の嘘は3か所ありましたが、★動きの側にもありました。
      //   ★サンドボックスであっても、値が残っていれば、いつか動きます。
      //   ★お試し期間を設けるなら、★有料化を決めた日に、
      //     ★利用規約・特商法の表記と同時に入れ直してください。
      //   ★ここだけ先に戻さないこと。それが今回の形です。
      // ★どのプランで契約したかを、★Stripe 側にも残します。
      //   ★subscriptions の表には、まだプランの列がありません。
      //   ★★列を足すかどうかは、別のご判断です。
      //     ★足さなくても、★ここに残っていれば、あとから分かります。
      metadata: {
        supabase_user_id: user.id,
        plan: planKey,
        // ★契約した時点の帯。★あとで「そのとき何歳の帯だったか」を問われます。
        age_band: band
      }
    },
    success_url: absoluteUrl("/dashboard"),
    cancel_url: absoluteUrl("/billing")
  });

  return NextResponse.json({ url: session.url });
}
