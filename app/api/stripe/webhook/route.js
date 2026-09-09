import { NextResponse } from "next/server";
import { tierFromPriceId, oneYearFrom } from "@/lib/tiers";
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

  /**
   * ★どの利用者の契約かを、★突き止めます。
   *
   *   ★★2026-09-05 夜に足しました。
   *     ★それまでは metadata だけを見て、★無ければ★黙って何もしませんでした。
   *     ★★いちばん困るのは、★解約の知らせが届かないときです。
   *       ★行が active のまま残り、★解約したのに使える状態になります。
   *       ★お客さまに得な向きの間違いですが、★記録が本当でなくなります。
   *
   *   ★手がかりは3つ。★上から順に試します。
   *     ① metadata（★こちらが入れたもの。★ふつうは、これで足ります）
   *     ② stripe_customer_id（★checkout のときに保存しています）
   *     ③ stripe_subscription_id（★一度でも同期していれば、入っています）
   */
  async function findUserId(subscription) {
    const fromMeta = subscription.metadata && subscription.metadata.supabase_user_id;
    if (fromMeta) return fromMeta;
    const customerId = typeof subscription.customer === "string"
      ? subscription.customer : (subscription.customer && subscription.customer.id);
    if (customerId) {
      const { data } = await admin.from("subscriptions")
        .select("user_id").eq("stripe_customer_id", customerId).maybeSingle();
      if (data && data.user_id) return data.user_id;
    }
    if (subscription.id) {
      const { data } = await admin.from("subscriptions")
        .select("user_id").eq("stripe_subscription_id", subscription.id).maybeSingle();
      if (data && data.user_id) return data.user_id;
    }
    // ★★黙らないこと。★誰の契約か分からないまま、通り過ぎるのが、いちばん悪い形です。
    console.error("★契約の持ち主が分かりませんでした: sub=" + subscription.id);
    return null;
  }

  /**
   * ★買い切りを、★purchases に 1行 残します（★2026-09-09）。
   *
   *   ★★同じ知らせが 2度 来ても、★2行に しません。
   *     ★stripe_session_id を unique に してあります。
   *     ★Stripe は、同じ知らせを 2度 送ることが あります。
   *
   *   ★★終わる日は「お申し込みの日から 1年」です。
   *     ★★1月1日では ありません。★あれは「よそおいの 年のテーマ」が
   *       ★変わる日で、★お金の日では ありません（★2026-09-08 の決め）。
   *
   *   ★★段（tier）は、★値段の鍵から 決めます。★申告では ありません。
   *     ★知らない鍵なら null に します。★勝手に 上げません。
   *
   *   ★★黙らないこと。★誰の買い物か 分からないまま 通り過ぎるのが、
   *     ★いちばん 悪い形です。
   */
  async function recordPurchase(session) {
    const meta = session.metadata || {};
    const userId = meta.supabase_user_id || null;
    if (!userId) {
      console.error("★買い切りの持ち主が分かりませんでした: session=" + session.id);
      return;
    }
    // ★★何を 買ったか。★値段の鍵は、★品目から 引きます。
    let priceId = null, amount = null;
    try {
      const items = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
      const first = items && items.data && items.data[0];
      priceId = (first && first.price && first.price.id) || null;
      amount = (first && first.amount_total) || session.amount_total || null;
    } catch (e) {
      // ★★品目が 引けなくても、★行は 残します。★買った事実が 消えるより ましです。
      console.error("★買い切りの品目を読めませんでした:", e && e.message);
      amount = session.amount_total || null;
    }
    const tier = tierFromPriceId(priceId, {
      STRIPE_PRICE_ID_MONTHLY: process.env.STRIPE_PRICE_ID_MONTHLY,
      STRIPE_PRICE_ID_ANNUAL: process.env.STRIPE_PRICE_ID_ANNUAL,
      STRIPE_PRICE_ID_FULL: process.env.STRIPE_PRICE_ID_FULL
    });
    const startedAt = new Date().toISOString();
    const { error } = await admin.from("purchases").insert({
      user_id: userId,
      plan: meta.plan || null,
      tier: tier || null,
      stripe_session_id: session.id,
      stripe_payment_intent: session.payment_intent || null,
      stripe_price_id: priceId,
      amount_yen: amount,
      started_at: startedAt,
      ends_at: oneYearFrom(startedAt),
      status: "active"
    });
    // ★★2度目は、unique で はじかれます（23505）。★それは 正しい形です。
    //   ★★はじかれたことを、★誤りとして 騒がないこと。
    if (error && error.code !== "23505") {
      console.error("★買い切りを残せませんでした:", error.message, "session=" + session.id);
    }
  }

  async function syncSubscription(subscription) {
    const userId = await findUserId(subscription);
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
        // ★★段（tier）── 無料／¥580／¥1,280（★2026-09-08 夜）。
        //   ★★決めるのは、★Stripe の 値段の鍵です。
        //     ★契約したときの 申告（metadata.plan）では ありません。
        //     ★あちらは 人が 入れる値なので、★取りちがえが 起きます。
        //   ★★どの鍵が どの段かは、★lib/plans.js が 持ちます。
        //     ★ここでは 判じません。
        //   ★★知らない鍵なら、★書き換えません（★null を 入れません）。
        //     ★★無料に 落とすと、★お金を払った方から 取り上げることに なります。
        //     ★分からないときは、★いまの値を そのままに します。
        ...(() => {
          const item = subscription.items && subscription.items.data && subscription.items.data[0];
          const priceId = item && item.price && item.price.id;
          const t = tierFromPriceId(priceId, {
            STRIPE_PRICE_ID_MONTHLY: process.env.STRIPE_PRICE_ID_MONTHLY,
            STRIPE_PRICE_ID_ANNUAL: process.env.STRIPE_PRICE_ID_ANNUAL,
            STRIPE_PRICE_ID_FULL: process.env.STRIPE_PRICE_ID_FULL
          });
          if (!t) {
            // ★★黙らないこと。★どの鍵が 分からなかったかを 残します。
            if (priceId) console.error("★段が 分からない 値段の鍵: " + priceId);
            return priceId ? { stripe_price_id: priceId } : {};
          }
          return { tier: t, stripe_price_id: priceId };
        })(),
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
      // ★★買い切り（1回払い）── ★2026-09-09 の 方向転換。
      //   ★★年払いは「1年間 有効な 利用権の 買い切り」です。
      //     ★subscription では ないので、★上の道を 通りません。
      //   ★★purchases に 1行 入れます。★subscriptions には 入れません。
      //     ★同じ表に 混ぜると、★status の 意味が 2つに なります。
      if (session.mode === "payment") {
        await recordPurchase(session);
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
      // ★★ここが、いちばん大事です。★解約が、記録に届かないと、
      //   ★行が active のまま残り、★解約したのに使える状態になります。
      const userId = await findUserId(subscription);
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
