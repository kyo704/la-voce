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
    ["components", "MinorConsentGate.jsx"],
    // ★★2026-09-07、★壁の札と、もっとのカードにも値段が出るようになりました。
    ["components", "GateNotice.jsx"]
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

  console.log("■ 壁の札と、もっとのカード");
  // ★★lib/freeTier.js にも「月580円」が直に書いてありました（★2026-09-07 に外しました）。
  //   ★年額を下げたとき、★ここも古いまま残るところでした。
  const ft = readCode("lib", "freeTier.js");
  ok("★GATE_LINES に、値段の直書きが無い",
    !/[0-9][0-9,]{2,}\s?円/.test(ft.slice(ft.indexOf("GATE_LINES"), ft.indexOf("GATE_CLOSING_LINES"))));
  ok("★値段の行は、lib/plans.js から作る", /export function gatePriceLines/.test(ft));
  const gate = readCode("components", "GateNotice.jsx");
  ok("★壁の札が、両方の値段を出している", /gatePriceLines\(PLANS\)/.test(gate));
  // ★★モーダルにしないこと（権利と課金の線引き §6-3）。
  ok("★画面を覆っていない", !/position: "fixed"|inset: 0/.test(gate));
  ok("★閉じるボタンを置いていない", !/閉じる|×|onClose/.test(gate));
  // ★★急かさないこと。
  ok("★急かす言葉が無い", !/お得|今だけ|お早め|残り|期間限定/.test(gate));

  const vt2 = readCode("components", "VocalTracker.jsx");
  // ★★「アップグレード」とは書けません（★3つの見張りが止めます）。
  //   ★free-tier-wording「★英語で言い換えて、ぼかさないこと」ほか。
  //   ★★日本語の、押しつけない言い方にしてあります。
  ok("★もっとに、見られるものを増やすカードがある",
    /見られるものを増やす/.test(vt2));
  ok("★「アップグレード」と書いていない", !/アップグレード/.test(vt2));
  // ★★済んでいる方に、もう一度すすめないこと。
  ok("★お支払いずみの方には、出さない", /subscribed !== true && \(/.test(vt2));
  ok("★先に「無料のもの」を言っている",
    vt2.indexOf("GATE_CLOSING_LINES.map") < vt2.indexOf("gatePriceLines(PLANS)"));

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
