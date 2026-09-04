// プランと、決済の道（2026-09-04）
//
//   ★★クライアントから価格ID（price_…）を受け取らないこと。
//     ★受け取ると、★任意の価格で契約できてしまいます。
//   ★年齢の帯で出し分ける判断は、★サーバ側にも要ります。
//     ★画面で隠すだけにしないこと。★API を直に叩かれます。
const fs = require("fs");
const path = require("path");
const { stripComments } = require("./_source");

let 通 = 0, 否 = 0;
const ok = (名, 条) => 条 ? (通++, console.log("  ✓ " + 名)) : (否++, console.log("  ✗ " + 名));
const p = (...a) => path.join(__dirname, "..", "..", ...a);
const read = (...a) => fs.readFileSync(p(...a), "utf8");

const plansSrc = read("lib", "plans.js");
const route = stripComments(read("app", "api", "stripe", "checkout", "route.js"));
const hook = stripComments(read("app", "api", "stripe", "webhook", "route.js"));
const button = stripComments(read("components", "CheckoutButton.jsx"));
const billing = stripComments(read("app", "billing", "page.js"));
const sql = stripComments(read("supabase", "2026-09-04-subscription-plan.sql"));

(async () => {
const m = await import("data:text/javascript;base64," + Buffer.from(plansSrc).toString("base64"));

console.log("\n① プランの表");
ok("2つある", m.PLANS.length === 2);
ok("月額は580円", m.planByKey("monthly").priceYen === 580);
ok("年額は5800円", m.planByKey("annual").priceYen === 5800);
ok("★知らない名前は null", m.planByKey("なにか") === null);
ok("★価格IDそのものを、表に書いていない", !/price_[A-Za-z0-9]/.test(plansSrc));
ok("★環境変数の名前を持っている",
  m.planByKey("monthly").envKey === "STRIPE_PRICE_ID_MONTHLY" &&
  m.planByKey("annual").envKey === "STRIPE_PRICE_ID_ANNUAL");

console.log("\n② ★価格IDの引き当ては、サーバ側で");
ok("環境変数から引く", m.priceIdFor("monthly", { STRIPE_PRICE_ID_MONTHLY: "price_x" }) === "price_x");
ok("★知らない名前は null", m.priceIdFor("なにか", { STRIPE_PRICE_ID_MONTHLY: "price_x" }) === null);
ok("★環境変数が無ければ null", m.priceIdFor("monthly", {}) === null);
ok("★env が無くても落ちない", m.priceIdFor("monthly", undefined) === null);

console.log("\n③ 月あたりの金額（★年払いを、少なく見せない）");
ok("月額はそのまま", m.monthlyEquivalentYen("monthly") === 580);
// 5800 / 12 = 483.33… → ★切り上げて 484
ok("★年払いは切り上げる", m.monthlyEquivalentYen("annual") === 484);

console.log("\n③-2 ★★2つのモジュールで、プランの名前がそろっていること");
// ★★2026-09-04、ここが食い違っていて、★誰も契約できませんでした。
//   ★minorBilling は "monthlyIndividual"、plans は "monthly" でした。
//   ★offeredPlans(band).includes(planKey) が、★1件も一致しませんでした。
//   ★★同じものに、2つの名前を付けたためです。
//   ★検査は「関数を呼んでいるか」だけを見ていて、
//     ★★語彙が合っているかを見ていませんでした。
const mb = await import("data:text/javascript;base64," +
  Buffer.from(read("lib", "minorBilling.js")).toString("base64"));
ok("★月額の名前が一致している", mb.PLANS.MONTHLY_INDIVIDUAL === "monthly");
ok("★年額の名前が一致している", mb.PLANS.ANNUAL_INDIVIDUAL === "annual");
// ★売っているプランは、すべて offeredPlans が返せる名前であること。
m.PLAN_KEYS.forEach((k) => {
  ok(`★"${k}" を、大人には出せる`, mb.offeredPlans("adult").includes(k));
});
// ★★実際に通るかを、通しで確かめます。★名前の一致だけでは足りません。
const ag = await import("data:text/javascript;base64," +
  Buffer.from(read("lib", "ageGate.js")).toString("base64"));
const 大人 = ag.ageBandOf({ age_band: null, is_under_18: false });
ok("★2択で「18歳以上」と答えた方は adult", 大人 === "adult");
ok("★★その方が、月額を契約できる", mb.offeredPlans(大人).includes("monthly"));
ok("★★その方が、年額も契約できる", mb.offeredPlans(大人).includes("annual"));
const 十代 = ag.ageBandOf({ age_band: "teen" });
ok("★15〜17歳は、月額だけ",
  mb.offeredPlans(十代).includes("monthly") && !mb.offeredPlans(十代).includes("annual"));

console.log("\n④ ★決済の道が、価格IDを受け取らないこと");
ok("★body から price を読んでいない", !/body\.price|body\["price"\]/.test(route));
ok("★plan という名前だけを読む", /body\.plan/.test(route));
ok("★一覧にない名前は 400", /PLAN_KEYS\.includes\(planKey\)/.test(route));
ok("★価格IDは、サーバ側で引き当てる", /priceIdFor\(planKey, process\.env\)/.test(route));
ok("★引き当てられなければ 503", /if \(!priceId\)/.test(route));
ok("★古い STRIPE_PRICE_ID を、もう読んでいない",
  !/process\.env\.STRIPE_PRICE_ID\b/.test(route));

console.log("\n⑤ ★年齢の帯で出し分ける判断が、サーバ側にもあること");
ok("★帯を読んでいる", /ageBandOf\(prof\)/.test(route));
ok("★offeredPlans で確かめている", /offeredPlans\(band\)\.includes\(planKey\)/.test(route));
ok("★通らなければ 403", /plan_not_available/.test(route));
// ★判定の順：★帯の確認が、価格の引き当てより先にあること。
const iBand = route.indexOf("offeredPlans(band)");
const iPrice = route.indexOf("priceIdFor(planKey");
ok("★帯の確認が先", iBand > 0 && iPrice > 0 && iBand < iPrice);

console.log("\n⑥ ★契約したときのことを、残すこと");
ok("★plan を metadata に入れている", /plan: planKey/.test(route));
ok("★契約時の帯も入れている", /age_band: band/.test(route));
ok("★webhook が plan を書く", /plan: \(subscription\.metadata/.test(hook));
ok("★webhook が契約時の価格を書く", /contracted_price_yen/.test(hook));
// ★プランの表の数字ではなく、★Stripe の item の金額を使うこと。
//   ★表を書き換えても、契約の記録は変わってはいけません。
ok("★item の金額を使っている", /price\.unit_amount/.test(hook));
ok("★表の priceYen を使っていない", !/priceYen/.test(hook));

console.log("\n⑥-2 ★Managed Payments を、この決済では使わないこと");
// ★★2026-09-04、これが無くて 500 になりました。
//   ★Stripe のアカウントで既定で有効になっており、
//   ★商品に税コードが無いと投げます。
//   ★★税コードを付ける道は採りません。★使うと決めていないためです。
ok("★明示的に切っている", /managed_payments:\s*\{\s*enabled:\s*false\s*\}/.test(route));

console.log("\n⑥-3 ★Stripe が投げたときに、裸の 500 を返さないこと");
// ★何が起きたか分からないまま、★利用者にも私たちにも届きません。
ok("★顧客の作成を包んでいる", /stripe_customer/.test(route));
ok("★決済の画面の作成を包んでいる", /stripe_session/.test(route));
ok("★理由の名前を返している", /detail: \(e && e\.code\)/.test(route));
ok("★502 を返している（★500 ではない）", /status: 502/.test(route));
// ★★秘密を返さないこと。★code と type だけです。
ok("★e.message を返していない", !/detail:.*e\.message/.test(route));

console.log("\n⑥-4 ★契約の行が無いときに、作ること");
// ★0行のまま進むと、★押すたびに新しい顧客ができます。
ok("★0行を見ている", /updated\.length === 0/.test(route));
ok("★無ければ作る", /\.insert\(\{ user_id: user\.id, stripe_customer_id/.test(route));

console.log("\n⑦ 画面");
ok("★ボタンがプランを送る", /JSON\.stringify\(\{ plan: planKey \}\)/.test(button));
ok("★ボタンは価格IDを送らない", !/price_/.test(button));
// ★2026-09-04、/billing の中身を MinorConsentGate へ移しました。
//   ★年齢の帯で出し分けるためです。★見る先も、そちらへ移します。
const gate = stripComments(read("components", "MinorConsentGate.jsx"));
ok("★プランごとに1つずつ置く", /PLANS\.filter\(/.test(gate));
ok("★常設の1行を置いている", /MINOR_NOTICE_LINE/.test(gate));
ok("★/billing は、帯で出し分ける部品を置いている",
  /<MinorConsentGate band=\{band\}/.test(billing));

console.log("\n⑧ SQL");
ok("plan の列がある", /add column if not exists plan text/.test(sql));
ok("契約時の価格の列がある", /add column if not exists contracted_price_yen integer/.test(sql));
ok("★知らないプラン名を弾く", /plan in \('monthly', 'annual'\)/.test(sql));
ok("★利用者から書く権限を剥がしている",
  /revoke insert, update, delete on public\.subscriptions from authenticated/.test(sql));
ok("★SELECT は残している（本人が自分の契約を見る）",
  !/revoke select on public\.subscriptions from authenticated/.test(sql));
ok("★anon からは全部剥がしている",
  /revoke all on public\.subscriptions from anon/.test(sql));
ok("★埋め戻していない", !/update public\.subscriptions set plan/i.test(sql));

console.log(`\n合計 ${通 + 否} 本：通過 ${通}／失敗 ${否}`);
process.exit(否 ? 1 : 0);
})();
