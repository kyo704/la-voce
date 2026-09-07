// ============================================================================
// 値段は、lib/plans.js が1か所で持つ（2026-09-07）
//
//   ★★2026-09-07、★年額を 5,800 → 4,800 に下げたとき、
//     ★/billing の見出しだけ「月580円」と直に書いてあり、★古いまま残りました。
//     ★★同じものが2か所にある、の形です。
//   ★★画面に数字を書き写さないこと。★lib から引くこと。
// ============================================================================

const { readCode } = require("./_source");

let failed = 0;
function ok(name, cond, extra) {
  if (cond) { console.log("  ○ " + name); return; }
  failed++; console.log("  ✗ " + name + (extra ? "\n      " + extra : ""));
}

(async () => {
  const fs = require("fs");
  const path = require("path");
  const ROOT = path.join(__dirname, "..", "..");
  const src = fs.readFileSync(path.join(ROOT, "lib", "plans.js"), "utf-8");
  const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));

  console.log("■ 正の値");
  const monthly = m.planByKey("monthly");
  const annual = m.planByKey("annual");
  ok("月額は580円", monthly.priceYen === 580);
  ok("年額は4800円", annual.priceYen === 4800);
  // ★★年額のほうが安いこと。★ここが逆だと、年額を選ぶ理由がありません。
  ok("★年額の月あたりが、月額より安い",
    m.monthlyEquivalentYen("annual") < monthly.priceYen,
    m.monthlyEquivalentYen("annual") + " / " + monthly.priceYen);

  console.log("■ 画面に、数字を書き写していないか");
  // ★★値段を出す画面ぜんぶを見ます。
  const screens = [
    ["app", "billing", "page.js"],
    ["app", "page.js"],
    ["components", "StartFlow.jsx"],
    ["components", "MinorConsentGate.jsx"]
  ];
  for (const parts of screens) {
    const code = readCode(...parts);
    const name = parts.join("/");
    // ★「580円」「4,800円」のように、数字と円をつなげて書いていないこと。
    const hard = code.match(/[¥￥]?\s?[0-9][0-9,]{2,}\s?円/g) || [];
    ok(`${name} に、値段の直書きが無い`, hard.length === 0, hard.join(", "));
    // ★lib から引いていること（★値段を出す画面なら）。
    if (/priceLabel|priceYen|PLANS/.test(code)) {
      ok(`${name} は、lib/plans.js から引いている`, /from "@\/lib\/plans"/.test(code));
    }
  }

  console.log("■ 年額を、買える場所があるか");
  const billing = readCode("app", "billing", "page.js");
  const minor = readCode("components", "MinorConsentGate.jsx");
  // ★★申し込みのボタンは、lib/plans.js の並びで出すこと。
  //   ★月額だけを直に書かないこと。
  ok("★申し込みは、PLANS から並べている", /PLANS\.filter\(/.test(minor));
  ok("★年額も、大人には出している", /ANNUAL_INDIVIDUAL/.test(
    readCode("lib", "minorBilling.js")));
  // ★★見出しにも、両方の値段が出ていること。
  ok("★/billing の見出しが、両方の値段を出している",
    /PLANS\.map\(\(p\) => p\.priceLabel\)/.test(billing));

  console.log("■ ランディングには、値段を出さないこと");
  // ★★2026-09-07、★坂本さんの決めで、★ランディングに値段を出さないことにしました。
  //   ★世の中のふつうの作りに合わせます。
  //   ★★代わりに、★有料の画面に触れたときと、★「もっと」の中で見せます。
  //     ★押しつけずに、★自分で見つけられる場所に置く、という考えです。
  const landing = readCode("app", "page.js");
  ok("★ランディングに、値段を出していない",
    !/PLANS\.map\(\(p\) => p\.priceLabel\)/.test(landing));
  ok("★ランディングは、値段を読みこんでいない",
    !/from "@\/lib\/plans"/.test(landing));

  console.log(failed === 0 ? "\n✅ すべて通りました" : "\n❌ " + failed + " 件");
  process.exit(failed === 0 ? 0 : 1);
})();
