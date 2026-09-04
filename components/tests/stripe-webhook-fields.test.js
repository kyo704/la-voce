// 決済の webhook が、必要なものを取りこぼさないこと（2026-09-04）
//
//   ★★2026-09-04、current_period_end だけが null で入りました。
//     ★status も plan も contracted_price_yen も入っていました。
//     ★★つまり webhook は届いていました。★場所が変わっただけです。
//   ★新しい API の版では、★subscription の直下から★items の中へ移りました。
//   ★★どちらにあっても拾えるようにします。★版に頼りません。
const { readCode } = require("./_source");
const fs = require("fs");
const path = require("path");

let 通 = 0, 否 = 0;
const ok = (名, 条) => 条 ? (通++, console.log("  ✓ " + 名)) : (否++, console.log("  ✗ " + 名));
const p = (...a) => path.join(__dirname, "..", "..", ...a);
const { stripComments } = require("./_source");
const hook = stripComments(fs.readFileSync(p("app", "api", "stripe", "webhook", "route.js"), "utf8"));
const base = stripComments(fs.readFileSync(p("lib", "baseUrl.js"), "utf8"));

console.log("\n① ★どちらの場所からも拾うこと");
for (const [名, key] of [["期間の終わり", "current_period_end"], ["お試しの終わり", "trial_end"]]) {
  ok(`★${名} が、直下と items の両方を見ている`,
    new RegExp(`subscription\\.${key}[\\s\\S]{0,120}item && item\\.${key}`).test(hook));
}
ok("★契約時の価格も、items から取る", /item\.price && item\.price\.unit_amount/.test(hook));

console.log("\n② ★数字かどうかを確かめること");
// ★0 は正しい値です。★|| で落とさないこと。
ok("★typeof で確かめている（0 を落とさない）",
  (hook.match(/typeof at === "number"/g) || []).length >= 2);
ok("★価格も typeof で確かめている", /typeof amount === "number"/.test(hook));

console.log("\n③ ★戻り先のURL");
// ★★VERCEL_URL は配備ごとに変わります。★別の生い立ちなので cookie が付きません。
//   ★2026-09-04、決済のあとに★ログアウトした状態で戻されました。
ok("★プレビューでは、ブランチのURLを先に使う",
  /VERCEL_BRANCH_URL/.test(base));
const iBranch = base.indexOf("VERCEL_BRANCH_URL");
const iUrlInPreview = base.indexOf("VERCEL_URL", iBranch);
ok("★ブランチのURLのほうが先", iBranch > 0 && iBranch < iUrlInPreview);
ok("★無ければ VERCEL_URL に落とす", iUrlInPreview > 0);
ok("★本番は NEXT_PUBLIC_SITE_URL が最優先のまま",
  base.indexOf("NEXT_PUBLIC_SITE_URL") < iBranch);

console.log("\n④ ★webhook が、何も書かずに終わらないこと");
ok("★署名を確かめている", /constructEvent/.test(hook));
ok("★鍵が無ければ止まる", /status: 503/.test(hook));
ok("★4つの出来事を見ている",
  ["checkout.session.completed", "customer.subscription.created",
   "customer.subscription.updated", "customer.subscription.deleted"]
    .every((e) => hook.includes(e)));

console.log(`\n合計 ${通 + 否} 本：通過 ${通}／失敗 ${否}`);
process.exit(否 ? 1 : 0);
