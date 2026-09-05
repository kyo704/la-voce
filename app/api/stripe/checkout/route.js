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
    // ★★どの鍵が無いのかを、★残します（★値は出しません。★名前だけです）。
    console.error("★Stripe の鍵がありません: STRIPE_SECRET_KEY");
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
    // ★★年齢の帯で止まりました。★どの帯かを残します（★個人は出しません）。
    console.error("★年齢の帯で止めました: band=" + band + " plan=" + planKey);
    return NextResponse.json({ error: "plan_not_available" }, { status: 403 });
  }

  // ★価格IDは、名前から引き当てます。
  //   ★環境変数が無ければ、★ここで止めます。★通信は起きません。
  const priceId = priceIdFor(planKey, process.env);
  if (!priceId) {
    // ★★どの環境変数が無いのかを、★残します（★値は出しません）。
    console.error("★価格IDがありません: plan=" + planKey
      + " monthly=" + (process.env.STRIPE_PRICE_ID_MONTHLY ? "有" : "★無")
      + " annual=" + (process.env.STRIPE_PRICE_ID_ANNUAL ? "有" : "★無"));
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

  try {
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id }
      });
      customerId = customer.id;
      // ★0行を見ます。★行が無ければ、作ります。
      //   ★handle_new_user が作りますが、★それより前に作られた方の行はありません。
      //   ★★0行のまま進むと、★押すたびに新しい顧客ができます。
      const { data: updated, error: upErr } = await admin
        .from("subscriptions")
        .update({ stripe_customer_id: customerId })
        .eq("user_id", user.id)
        .select("user_id");
      if (upErr) {
        console.error("★subscriptions を更新できませんでした:", upErr);
      } else if (!updated || updated.length === 0) {
        console.error("★subscriptions に行がありませんでした。作ります:", user.id);
        const { error: insErr } = await admin
          .from("subscriptions")
          .insert({ user_id: user.id, stripe_customer_id: customerId, status: "none" });
        if (insErr) console.error("★subscriptions を作れませんでした:", insErr);
      }
    }
  } catch (e) {
    // ★Stripe が投げたときに、★裸の 500 を返さないこと。
    //   ★何が起きたか分からないまま、★利用者にも私たちにも届きません。
    console.error("★Stripe の顧客を作れませんでした:", e && e.message, e && e.type);
    return NextResponse.json(
      { error: "stripe_customer", detail: (e && e.code) || (e && e.type) || "unknown" },
      { status: 502 }
    );
  }

  // ★Stripe の呼び出しを包みます。★投げたら、理由の名前を返します。
  //   ★★秘密は返しません。★code と type だけです。
  async function createSessionOrThrow(params) {
    return stripe.checkout.sessions.create(params);
  }

  let session;
  try {
    session = await createSessionOrThrow({
      customer: customerId,
      mode: "subscription",
      // ★Managed Payments を、この決済では使いません（2026-09-04）。
      //   ★Stripe のアカウントで★既定で有効になっています。
      //   ★有効のままだと、★商品に税コードが要り、
      //     ★無いと「the product tax code is missing」で投げます。
      //     ★★2026-09-04、実際にそれで 500 になりました。
      //   ★★税コードを商品に付ける道は、★採りません。
      //     ★Managed Payments を使うかどうかは、★まだ決めていません（+3.5%）。
      //     ★使わないと決めていないものを、★使う前提の設定にしないこと。
      //   ★採用する日が来たら、★ここを消して、税コードを付けます。
      //     ★そのときは、★手数料の話と一緒に決めてください。
      managed_payments: { enabled: false },
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
      // ★trial_period_days: 14 を消しました（2026-09-03・Opus §5）。
      //   ★文言の嘘は3か所ありましたが、★動きの側にもありました。
      //   ★サンドボックスであっても、値が残っていれば、いつか動きます。
      //   ★お試し期間を設けるなら、★有料化を決めた日に、
      //     ★利用規約・特商法の表記と同時に入れ直してください。
      //   ★ここだけ先に戻さないこと。それが今回の形です。
      // ★どのプランで契約したかを、★Stripe 側にも残します。
      //   ★webhook が、ここから subscriptions.plan へ写します。
      //   ★★Stripe 側にも残しておくこと。★DB が壊れても、こちらは残ります。
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
  } catch (e) {
    // ★価格IDが違う／別のアカウントのもの／通貨が合わない、などで投げます。
    //   ★★裸の 500 にしないこと。★理由の名前を返します。
    console.error("★決済の画面を作れませんでした:", e && e.message, e && e.type, e && e.code);
    // ★★2026-09-05 夜、★中身を返していませんでした。
    //   ★返していたのは、★名前だけ（StripeInvalidRequestError）でした。
    //   ★★それでは、★何が違うのか分かりません。
    //   ★Stripe が言っている文そのものを、★返します。
    //     例）「No such price: 'price_…'」★これで、一度で分かります。
    //   ★★お客さまには、★出しません（画面は、やさしい文だけを出します）。
    //     ★console と、★ログにだけ残ります。
    //   ★鍵そのものは、★Stripe の文には入りません。
    return NextResponse.json(
      {
        error: "stripe_session",
        detail: (e && e.code) || (e && e.type) || "unknown",
        // ★長いことがあるので、★頭だけにします。
        message: String((e && e.message) || "").slice(0, 300),
        // ★どちらの鍵で試したかを、★形だけ返します（★値は返しません）。
        keyMode: String(process.env.STRIPE_SECRET_KEY || "").startsWith("sk_live_")
          ? "live" : (String(process.env.STRIPE_SECRET_KEY || "").startsWith("sk_test_") ? "test" : "unknown"),
        // ★価格IDも、★頭だけ返します（★price_ か、それ以外かが分かれば足ります）。
        priceHead: String(priceId || "").slice(0, 8)
      },
      { status: 502 }
    );
  }

  return NextResponse.json({ url: session.url });
}
