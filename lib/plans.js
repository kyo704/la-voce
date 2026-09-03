// ============================================================================
// プラン（2026-09-04）
//
//   ★価格と、Stripe の価格IDの環境変数名を、★1か所で持ちます。
//     ★画面・決済の道・規約・特商法の表記が、★ここから引きます。
//     ★同じ数字が3か所にあると、★片方だけが古くなります。
//
//   ★★クライアントから、価格ID（price_…）を受け取らないこと。
//     ★受け取ると、★任意の価格で契約できてしまいます。
//     ★受け取るのは "monthly" / "annual" という★名前だけです。
//     ★★価格IDへの引き当ては、★サーバ側で行います。
//
//   ★未成年に出してよいプランは lib/minorBilling.js が決めます。
//     ★ここは「何があるか」だけを持ちます。★「誰に出すか」は持ちません。
//     ★2つを1か所にすると、★どちらの理由で出なかったのかが分からなくなります。
//
//   ★このファイルは、ほかの lib を読み込みません。
//     検査が1本ずつ切り離して読み込むためです。
// ============================================================================

/**
 * プランの一覧。
 *
 *   ★key            画面と決済の道が、やり取りする名前
 *   ★priceYen       表示する金額（★税込）
 *   ★interval       "month" / "year"
 *   ★envKey         Stripe の価格IDが入っている環境変数の名前
 *
 *   ★★価格IDそのものを、ここに書かないこと。★環境ごとに違います。
 *     ★テストと本番で、別のIDになります。
 */
export const PLANS = [
  {
    key: "monthly",
    priceYen: 580,
    interval: "month",
    envKey: "STRIPE_PRICE_ID_MONTHLY",
    label: "月々のお支払い",
    priceLabel: "580円／月"
  },
  {
    key: "annual",
    priceYen: 5800,
    interval: "year",
    envKey: "STRIPE_PRICE_ID_ANNUAL",
    label: "1年分のお支払い",
    priceLabel: "5,800円／年"
  }
];

/** 名前から引きます。★知らない名前には null を返します。 */
export function planByKey(key) {
  return PLANS.find((p) => p.key === key) || null;
}

/** 使ってよい名前の一覧。★これ以外は受け取りません。 */
export const PLAN_KEYS = PLANS.map((p) => p.key);

/**
 * ★名前から、Stripe の価格IDを引きます。
 *
 *   ★env は process.env を渡します（★検査から差し替えられるように）。
 *   ★知らない名前、または環境変数が無ければ null です。
 *     ★★null を「まあいいか」で通さないこと。★呼ぶ側で止めます。
 */
export function priceIdFor(key, env) {
  const plan = planByKey(key);
  if (!plan) return null;
  const v = (env || {})[plan.envKey];
  return v ? String(v) : null;
}

/**
 * 月あたりの金額。★年払いを、月あたりに直します。
 *
 *   ★未成年に出す上限の判断（「毎月◯◯円まで」）に使います。
 *   ★★割り切れない場合は、★切り上げます。
 *     ★少なく見せないためです。
 */
export function monthlyEquivalentYen(key) {
  const plan = planByKey(key);
  if (!plan) return null;
  if (plan.interval === "month") return plan.priceYen;
  return Math.ceil(plan.priceYen / 12);
}
