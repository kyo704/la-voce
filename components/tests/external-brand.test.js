#!/usr/bin/env node

// ============================================================================
// ★見張り ── ★よその 会社の 色（★裁定 その101・2026-09-19）
//
//   ★★★決まり ──「よその 会社の ブランド色は、★コントラストの 決まりの 外」。
//     ★★わけ ──「何の 札か 分かる」ことが、★読みやすさより 先に 立つ 場面が あります。
//
//   ★★★広げない こと（★裁定 その101 DO_NOT）──
//     ★★Woolsong 自身の 色に、★この 例外を 当てません。
//     ★★一覧に 載るのは、★よその 会社の 公式の 札 だけ です。
//
//   ★★★代わりに 決めた こと（★REQUIRED）──
//     ★★札の **外** に、★何の 札かを 字で 書きます。
//
//   ★★較正 ── ★わざと 当たる ものと、★当たらない もので 試します。
// ============================================================================

const assert = require("assert");
const { loadLib, readCode } = require("./_source");

let 数 = 0;
function 見る(名, f) { f(); 数 += 1; console.log("  ○ " + 名); }

(async () => {
  const V = await loadLib("lib", "visualTokens.js");
  const 蔵 = readCode("components", "VocalTracker.jsx");
  const 見張り = readCode("components/tests", "display-prefs.test.js");

  見る("道具の 較正", () => {
    assert.ok(V.isExternalBrand("#06C755"), "★LINE の 緑を 見つけられません");
    assert.ok(!V.isExternalBrand("#840C24"), "★えんじが よその 色に なって います");
  });

  見る("★一覧は 1つ だけ（★広げて いない）", () => {
    assert.strictEqual(V.EXTERNAL_BRAND_COLORS.length, 1,
      "★増えて います。★裁定 その101 の 外に 広げて いませんか");
    const x = V.EXTERNAL_BRAND_COLORS[0];
    assert.strictEqual(x.key, "line");
    assert.ok(x.why && x.why.length > 6, "★わけが 書かれて いません");
    assert.ok(x.ruling === "その101", "★どの 裁定かが 書かれて いません");
    assert.ok(typeof x.ratio === "number" && x.ratio < 4.5,
      "★測った 比が 書かれて いません");
  });

  見る("★Woolsong 自身の 色を 入れて いない", () => {
    const 自分 = ["#840C24", "#241914", "#F6F1E7", "#FFFDF8", "#8C6115"];
    for (const h of 自分) {
      assert.ok(!V.isExternalBrand(h), "★自分の 色が 入って います: " + h);
    }
  });

  見る("★札の 外に、★何の 札かを 書いて いる（★REQUIRED）", () => {
    const x = V.EXTERNAL_BRAND_COLORS[0];
    assert.ok(蔵.includes(x.outsideLabel),
      "★外の 字が ありません: " + x.outsideLabel);
    // ★★中の 字（札の 中）とは 別の ところに ある こと。
    const i = 蔵.indexOf(x.outsideLabel);
    const j = 蔵.indexOf("C.lineGreen");
    assert.ok(i > 0 && j > 0 && Math.abs(i - j) < 2000,
      "★札の そばに ありません");
  });

  見る("★見張りが、★この 色だけ を 外して いる", () => {
    assert.ok(/lineGreen/.test(見張り), "★外す 名が 書かれて いません");
    assert.ok(/その101/.test(見張り), "★どの 裁定かが 書かれて いません");
    // ★★★書き写して いない こと（★片方だけ 増えます）。
    assert.ok(!/06C755/.test(見張り), "★見張りに 色の 字を 書き写して います");
  });

  見る("★入口の 縞は 別の 系統（★裁定 その102）", () => {
    assert.ok(V.isEntranceStripe("#6B1620"), "★縞の 色を 見つけられません");
    assert.ok(!V.isEntranceStripe("#840C24"), "★いまの えんじが 縞に 入って います");
    assert.strictEqual(V.ENTRANCE_STRIPE_COLORS.length, 1, "★増えて います");
    const x = V.ENTRANCE_STRIPE_COLORS[0];
    assert.strictEqual(x.colors.length, 4, "★縞は 4色 です");
    assert.ok(x.why && x.ruling === "その102", "★わけと 裁定が 書かれて いません");
  });

  見る("★入口の 字の えんじは、★いまの 色（★裁定 その102）", () => {
    const fs2 = require("fs");
    const path2 = require("path");
    for (const f of ["app/login/page.js", "app/reset-password/page.js"]) {
      const 本 = fs2.readFileSync(path2.join(__dirname, "..", "..", f), "utf8");
      // ★★字の えんじが 古い ままに なって いない こと。
      assert.ok(!/color: "#7A1F2B"/.test(本), "★字が 古い ままです: " + f);
      assert.ok(/color: "#840C24"/.test(本), "★字が 揃って いません: " + f);
      // ★★縞は 残って いる こと（★揃えて しまって いない）。
      assert.ok(/#6B1620/.test(本) || f.includes("reset"), "★縞が 消えました: " + f);
    }
  });

  console.log("\n★" + 数 + "つ 通りました。");
})().catch((e) => { console.error("★止まりました ──", e.message); process.exit(1); });
