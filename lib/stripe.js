import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20"
});

/**
 * ★決済が、いま使える状態か（2026-09-03）。
 *
 *   ★確かめたこと
 *     new Stripe(undefined) は★投げません。読み込みは通ります。
 *     失敗するのは★呼んだときで、StripeAuthenticationError になります。
 *     つまり、鍵が無くても★通信そのものは起きます。
 *
 *   ★これは /api/advice とは違う状態です
 *     advice は、鍵の有無を★fetch より前に見て 500 を返します。
 *     ★通信そのものが発生しません（外へ1バイトも出ません）。
 *
 *     こちらは、鍵の見張りがどこにもありません。だから
 *       stripe.customers.create({ email: user.email,
 *                                 metadata: { supabase_user_id: user.id } })
 *     が★そのまま api.stripe.com へ届きます。
 *     ★メールアドレスと利用者IDが外へ出てから、拒否されます。
 *     「使っていないので何も出ていない」ではありません。
 *
 *   ★閉じるほうへ倒します。CRON_SECRET・AI_ADVICE_ENABLED と同じ形です。
 */
export function stripeConfigured() {
  return !!process.env.STRIPE_SECRET_KEY;
}
