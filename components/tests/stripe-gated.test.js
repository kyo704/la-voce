// 決済の道が、鍵なしで通信していないか（2026-09-03・TASK B）
//
//   ★advice との違いを、検査で固定します。
//     advice … 鍵の確認が fetch より前。★通信そのものが起きません。
//     stripe … 見張りが無いと、new Stripe(undefined) が構築を通してしまい、
//               ★呼んだときに初めて失敗します。つまり通信は起きます。
//     ★この違いを知らずに「使っていないから安全」と書くのが、いちばん危ないです。
const { readCode } = require("./_source");

let 通 = 0, 否 = 0;
const ok = (名, 条) => 条 ? (通++, console.log("  ✓ " + 名)) : (否++, console.log("  ✗ " + 名));

const ルート = [
  "app/api/stripe/checkout/route.js",
  "app/api/stripe/portal/route.js",
  "app/api/stripe/webhook/route.js"
];

console.log("\n① 見張りがあること");
const 元 = readCode("lib/stripe.js");
ok("stripeConfigured がある", /export function stripeConfigured\(\)/.test(元));
ok("★真偽値で答える（未設定は偽）", /return !!process\.env\.STRIPE_SECRET_KEY/.test(元));

console.log("\n② ★3つのルートすべてが、何かをする前に見張ること");
for (const p of ルート) {
  const src = readCode(p);
  const 見張り = src.indexOf("stripeConfigured()");
  ok(`${p.split("/")[3]}：見張りがある`, 見張り !== -1);

  // ★見張りより前に、外へ出る呼び出しや管理クライアントが無いこと。
  //   ★import 行は数えません（前回、indexOf が import を拾って誤判定しました）。
  const 本体 = src.slice(src.indexOf("export async function POST"));
  const g = 本体.indexOf("stripeConfigured()");
  for (const 語 of ["stripe.customers", "stripe.checkout", "stripe.billingPortal",
                    "createAdminClient(", "constructEvent"]) {
    const i = 本体.indexOf(語);
    ok(`${p.split("/")[3]}：★${語} は見張りより後（または無い）`, i === -1 || i > g);
  }
}

console.log("\n③ 台帳が、advice との違いを書いていること");
const 台 = readCode("lib/outboundRoutes.js");
ok("Stripe の来歴が書かれている", /id: "stripe"/.test(台) && /StripeAuthenticationError/.test(台));
ok("★『使っていない＝安全』と書いていない", !/使っていないので安全|何も出ていません/.test(台));

console.log("\n④ ★無料のうちは、決済の入口へ進まないこと");
// ★入口が消えたと勘違いしないための見張りです。
//   「画面に無いから安全」は、この repo で何度も誤りでした。
const billing = readCode("app/billing/page.js");
// ★見張るのは「ボタンがあるか」ではなく、★「無料のうちは、そこへ進まないか」です。
//   REQUIRE_SUBSCRIPTION が無効なときの早期 return が、下を全部無効にします。
const 早期 = billing.indexOf("if (!requireSubscription)");
// ★2026-09-04、/billing のボタンは MinorConsentGate の中へ移りました。
//   ★年齢の帯で出し分けるためです。
//   ★★見たいのは「無料のうちは、そこへ進まないか」です。
//     ★部品の名前ではありません。★どちらの名前でも拾います。
const ボタン = Math.min(
  ...["<CheckoutButton", "<MinorConsentGate"]
    .map((n) => billing.indexOf(n)).filter((i) => i >= 0)
);
ok("requireSubscription を読んでいる", /process\.env\.REQUIRE_SUBSCRIPTION === "true"/.test(billing));
ok("★無効なときは早期 return する", 早期 !== -1);
ok("★申し込みの入口が見つかる", Number.isFinite(ボタン) && ボタン > 0);
ok("★入口は、その return より後ろにある（＝無料のうちは出ない）",
  早期 !== -1 && ボタン !== -1 && 早期 < ボタン);
ok("★台帳が、到達しないことを書いている", /到達しません/.test(台));

console.log("\n⑤ A型・B型の区別");
ok("kind がある", /kind: "custodial"/.test(台) && /kind: "processing"/.test(台));
ok("★Supabase の場所が入った", /ap-northeast-1/.test(台));
ok("★契約主体は、まだ書いていない（憶測で書かない）", /entity: null/.test(台));

console.log(`\n合計 ${通 + 否} 本：通過 ${通}／失敗 ${否}`);
process.exit(否 ? 1 : 0);
