import { NextResponse } from "next/server";
import { stripe, stripeConfigured } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

// Stripe の署名検証には生のリクエストボディが必要なため、
// このルートでは request.text() を使う（JSON.parse しない）。
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

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  const admin = createAdminClient();

  async function syncSubscription(subscription) {
    const userId = subscription.metadata && subscription.metadata.supabase_user_id;
    if (!userId) return;
    await admin
      .from("subscriptions")
      .update({
        stripe_subscription_id: subscription.id,
        status: subscription.status,
        trial_end: subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null,
        current_period_end: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", userId);
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.mode === "subscription" && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        await syncSubscription(subscription);
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      await syncSubscription(event.data.object);
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      const userId = subscription.metadata && subscription.metadata.supabase_user_id;
      if (userId) {
        await admin
          .from("subscriptions")
          .update({ status: "canceled", updated_at: new Date().toISOString() })
          .eq("user_id", userId);
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
