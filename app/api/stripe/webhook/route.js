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
        // ★どのプランで契約したか（2026-09-04）。
        //   ★checkout のときに、metadata へ入れています。
        //   ★★Stripe の価格から逆算しません。★契約時の申告を、そのまま残します。
        plan: (subscription.metadata && subscription.metadata.plan) || null,
        // ★★契約したときに「表示していた価格」（未成年に売る形 §10）。
        //   ★あとで値上げしたとき、★そのとき何円だったかが争点になります。
        //   ★item の金額を使います。★プランの表に書いてある数字ではありません。
        //     ★表を書き換えても、★契約の記録は変わってはいけません。
        contracted_price_yen: (() => {
          const item = subscription.items && subscription.items.data && subscription.items.data[0];
          const amount = item && item.price && item.price.unit_amount;
          return typeof amount === "number" ? amount : null;
        })(),
        // ★trial_end も、同じ理由で items 側にあることがあります。
        trial_end: (() => {
          const item = subscription.items && subscription.items.data && subscription.items.data[0];
          const at = subscription.trial_end || (item && item.trial_end);
          return typeof at === "number" ? new Date(at * 1000).toISOString() : null;
        })(),
        // ★新しい API の版では、★current_period_end が
        //   ★subscription の直下から★items の中へ移りました。
        //   ★★2026-09-04、null のまま入っていました。
        //     ★status も plan も入っていたので、★webhook は届いていました。
        //     ★★入らなかったのは、★場所が変わったからです。
        //   ★どちらにあっても拾えるようにします。★版を固定しません。
        //     ★webhook の payload の版は、★アカウント側の設定で決まります。
        //     ★こちらの apiVersion を変えても、★そちらは変わりません。
        current_period_end: (() => {
          const item = subscription.items && subscription.items.data && subscription.items.data[0];
          const at = subscription.current_period_end
            || (item && item.current_period_end);
          return typeof at === "number" ? new Date(at * 1000).toISOString() : null;
        })(),
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
