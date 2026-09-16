#!/usr/bin/env node

// ============================================================================
// ★お支払いが 続いて いる 方を、★退会させない（★第1段）
//
//   ★★出どころ　坂本さん（★2026-09-16）──
//     「★有効な subscription が ある人は 退会させない。★409 と 理由を 返す」
//
//   ★★なぜ ──
//     ★★退会の 道は Stripe を **一度も 呼びません**（★調べ・2026-09-16）。
//       ★消すのは `subscriptions` の **行**だけ。★契約は 生きた まま です。
//       ★★去った あとも お金が 引かれ 続けます。
//     ★★行を 消すと `/api/stripe/portal` が `stripe_customer_id` を 引けず、
//       ★ご自分で 止める 道まで 塞がります。
//     ★★webhook も 静かに 失敗します（★0行の update・200 を 返す）。
//
//   ★★この 見張りは、★止める 決めが 生きて いる ことを 見ます。
//     ★★第2段（★先に Stripe を 解約し、★成功した ときだけ 消す）が できたら、
//       ★この 見張りも 書き直して ください。★消さないで ください ──
//       ★★第2段が 失敗した ときも、★止まる ことは 変わりません。
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode, readRaw } = require("./_source");

let ok = 0, ng = 0;
function t(cond, label) {
  if (cond) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label); ng++; }
}

(async () => {
  const ROOT = path.join(__dirname, "..", "..");
  for (const f of ["lib/activeSubscription.js", "app/api/account/delete/route.js",
    "components/VocalTracker.jsx"]) {
    if (!fs.existsSync(path.join(ROOT, f))) {
      console.log("★★ありません: " + f);
      console.log("　★数えません。★止まります。");
      process.exit(1);
    }
  }
  const src = fs.readFileSync(path.join(ROOT, "lib/activeSubscription.js"), "utf8");
  const m = await import("data:text/javascript;base64,"
    + Buffer.from(src, "utf8").toString("base64"));

  console.log("① どの 状態で 止めるか（★実際に 呼んで 試します）");
  // ★★お金が これから 動く ものは 止めます。
  [["active", true], ["trialing", true], ["past_due", true],
   ["unpaid", true], ["incomplete", true]].forEach(([s, want]) => {
    t(m.blocksDeletion({ status: s }) === want, "★" + s + " → 止める");
  });
  // ★★もう 動かない ものは 止めません。★退会を 塞がない ため です。
  [["canceled", false], ["incomplete_expired", false]].forEach(([s, want]) => {
    t(m.blocksDeletion({ status: s }) === want, s + " → 止めない");
  });
  t(m.blocksDeletion(null) === false, "行が 無ければ 止めない");
  t(m.blocksDeletion({}) === false, "状態が 無ければ 止めない");
  t(m.blocksDeletion({ status: "ACTIVE" }) === false,
    "★大文字は 通さない（★Stripe の ことばを そのまま 使う）");

  console.log("\n② 道が、止める 決めを 使って いること");
  const route = readCode("app", "api", "account", "delete", "route.js");
  t(/blocksDeletion\(/.test(route), "★`blocksDeletion` を 呼んでいる");
  t(/status: 409/.test(route) && /paymentActive: true/.test(route),
    "★409 と わけを 返している");
  // ★★教室の 409 より **先**に 見ます。★お金の ほうが 先に 止まる べき です。
  const iPay = route.indexOf("blocksDeletion(");
  const iOrg = route.indexOf("classifyOwnedOrgs(");
  t(iPay > 0 && iOrg > 0 && iPay < iOrg, "★教室の 確かめより 先に 見ている");
  // ★★読めなかった ときは 止めます。★「読めない」を「無い」と 同じに しません。
  t(/subErr/.test(route) && /status: 500/.test(route), "★読めない ときは 進めない");

  console.log("\n③ 画面が、行き止まりに なって いないこと");
  const vt = readRaw("components", "VocalTracker.jsx");
  t(/deleteStatus === "paymentActive"/.test(vt), "★止めた ことを 画面に 出す");
  t(/PAYMENT_BLOCK_LINES/.test(vt), "★字は lib が 持つ（★画面に 書き写さない）");
  // ★★字だけ だと、★止められた 方が どこへ 行けば よいか 分かりません。
  t(/href=\{PAYMENT_BLOCK_HREF\}/.test(vt), "★★押せる 行き先が ある");

  console.log("\n④ 引き止めに なって いないこと");
  // ★★「退会を 隠さない。★引き止めを 2回以上 出さない」── ★この家の 決め。
  const lines = m.PAYMENT_BLOCK_LINES.join("");
  ["もったいない", "本当に", "残念", "考え直"].forEach((w) => {
    t(!lines.includes(w), "★「" + w + "」と 書いていない");
  });
  t(/やめる/.test(lines) || /プラン/.test(lines), "★どこを 押せば よいか 書いてある");

  console.log("\n⑤ 退会の 道が、いまも Stripe を 呼んで いないこと");
  // ★★第2段が できたら、★ここは 逆に なります（★呼ぶ ことを 求める）。
  //   ★★いまは「呼んで いない」ことを 記録として 残します。
  //     ★★止める 決めが 要る わけ が、★これ だから です。
  const del = readCode("lib", "accountDeletion.js");
  const callsStripe = /stripe/i.test(route) || /stripe/i.test(del);
  console.log("  ・退会の 道が Stripe を 呼ぶ … " + (callsStripe ? "はい" : "★いいえ（第1段の まま）"));
  t(true, "しらべました（★合否には しません）");

  console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
  process.exit(ng === 0 ? 0 : 1);
})();
