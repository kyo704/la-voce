#!/usr/bin/env node
/**
 * 契約の一生 ── ★解約したときに、正しく動くこと（2026-09-05 夜）
 *
 *   ★★特商法の表記に、こう書きました。
 *     「解約なさると、次の更新日から、お金はいただきません。」
 *     「日割りでのお返しはありません。★更新日までは、そのままお使いいただけます。」
 *   ★★書いたことと、実物を、そろえます。
 *
 *   ★そして、⑫ §6-4 ──「課金が切れても、過去は1件も消えない」。
 *
 *   実行  node components/tests/subscription-lifecycle.test.js
 */

const fs = require("fs");
const path = require("path");
const { readCode } = require("./_source");

const ROOT = path.join(__dirname, "..", "..");

let pass = 0;
let fail = 0;
function ok(label, cond) {
  if (cond) { pass += 1; console.log("  ✓ " + label); }
  else { fail += 1; console.log("  ✗ " + label); }
}

(async () => {
  const wh = readCode("app", "api", "stripe", "webhook", "route.js");
  const vt = readCode("components", "VocalTracker.jsx");

  console.log("\n① ★更新日までは、そのまま使えること");
  // ★★Stripe は、期間の終わりまで status: active のままにします。
  //   ★こちらは、その status を、そのまま写します。
  //   ★★「解約を押した瞬間に canceled にする」を、★書かないこと。
  ok("★updated では、Stripe の status を写している", /status: subscription\.status/.test(wh));
  // ★★2026-09-05 夜、★この確かめ自体が間違っていました。
  //   ★400字の窓が、★次の case（deleted）まで届いていました。
  //   ★★かたまりを、★正しく切ってから見ます。
  {
    const i = wh.indexOf('case "customer.subscription.updated"');
    const j = wh.indexOf("case ", i + 10);
    const blockUpdated = i === -1 ? "" : wh.slice(i, j === -1 ? wh.length : j);
    ok("★updated のかたまりを、切り出せた", blockUpdated.length > 0);
    ok("★★updated で、canceled と決め打っていない",
      !/status: "canceled"/.test(blockUpdated));
    ok("★updated は、同期に任せている", /syncSubscription/.test(blockUpdated));
  }
  // ★画面の側も、active / trialing だけを「お支払いずみ」とすること。
  ok("★画面は active と trialing を見ている",
    /\["trialing", "active"\]\.includes\(subRow\.status\)/.test(vt));

  console.log("\n② ★期間が終わったら、canceled になること");
  ok("★deleted で canceled にしている",
    /customer\.subscription\.deleted[\s\S]{0,400}status: "canceled"/.test(wh));

  console.log("\n③ ★★解約が、記録に届かないことがないように");
  // ★★2026-09-05 夜まで、★metadata が無いと★黙って何もしませんでした。
  //   ★行が active のまま残り、★解約したのに使える状態になります。
  ok("★持ち主の突き止め方が、1か所にある", /async function findUserId\(/.test(wh));
  ok("★① metadata を見る", /metadata\.supabase_user_id/.test(wh));
  ok("★② stripe_customer_id でも探す", /eq\("stripe_customer_id"/.test(wh));
  ok("★③ stripe_subscription_id でも探す", /eq\("stripe_subscription_id"/.test(wh));
  ok("★★分からなければ、黙らずに残す", /契約の持ち主が分かりませんでした/.test(wh));
  ok("★deleted も、同じ突き止め方を使っている",
    /customer\.subscription\.deleted[\s\S]{0,300}findUserId\(subscription\)/.test(wh));

  console.log("\n④ ★★解約しても、過去は消えないこと（⑫ §6-4）");
  const b64 = Buffer.from(fs.readFileSync(path.join(ROOT, "lib", "freeTier.js"))).toString("base64");
  const m = await import("data:text/javascript;base64," + b64);
  ok("★記録は、いつでも見られる", m.mayViewRecord() === true);
  ok("★書き出しは、いつでも無条件", m.mayExport() === true);
  ok("★カレンダーの遡りに、制限が無い", m.calendarOldestDate() === null);
  // ★★支払いを理由に、消す処理が無いこと。
  ok("★webhook が、記録を消していない",
    !/from\("entries"\)|\.delete\(\)/.test(wh));

  console.log("\n⑤ ★書いたことと、実物がそろっていること");
  const toku = readCode("app", "legal", "tokushoho", "page.js");
  ok("★特商法に「更新日までは、そのまま」と書いてある",
    /更新日までは、そのままお使いいただけます/.test(toku));
  ok("★特商法に「記録は、解約しても残ります」と書いてある",
    /記録は、解約しても残ります/.test(toku));
  ok("★特商法に「アプリの中から手続きできます」と書いてある",
    /アプリの中から、ご自身で手続きできます/.test(toku));
  // ★★その入口が、実際に在ること。
  const bill = readCode("app", "billing", "page.js");
  ok("★★その入口が、実際にある", /<PortalButton/.test(bill));

  console.log(`\n★とおった ${pass} ／ ★落ちた ${fail}`);
  process.exit(fail === 0 ? 0 : 1);
})();
