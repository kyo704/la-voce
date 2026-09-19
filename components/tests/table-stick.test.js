#!/usr/bin/env node
// ============================================================================
// ★表の 貼り付け（★裁定 その81 §3／§5-1）── ★決めは 1か所（★2026-09-19）
//
//   ★★★運営の 表は、★見出しの 行と 左の 列が 貼り付きます。
//     ★★横に すべった とき、★どの 行・どの 列を 見て いるかが 分かる ため です。
//
//   ★★★決めは `lib/visualTokens.js` が 持ちます（`.tblwrap` ／ `.stick` `.anc`）。
//     ★★画面に 手で `position: sticky` を 書きません。
//     ★★★2026-09-19、★`OpsKumu` が 自分で 書いて いました ── ★寄せました。
//       ★★あちらには 見出しの 行の 貼り付けが 無く、★横に すべると 曜日が 消えて いました。
//
//   ★★較正 ── ★在る ものを 見つけ、★無い ものを 見つけない こと。
// ============================================================================

const assert = require("assert");
const { readRaw, readCode } = require("./_source");
const fs = require("fs");
const path = require("path");

let 数 = 0;
function 見る(名, f) { f(); 数 += 1; console.log("  ○ " + 名); }

const 蔵 = readRaw("lib", "visualTokens.js");
const 入れ物 = (蔵.match(/TABLE_CLASS = "([^"]+)"/) || [])[1];

見る("較正 ── ★名を 読めて いる", () => {
  assert.strictEqual(入れ物, "tblwrap", "★入れ物の 名: " + 入れ物);
  assert.ok(/ANCHOR_CLASSES = Object\.freeze\(\["stick", "anc"\]\)/.test(蔵));
});

const 置き場 = path.join(__dirname, "..");
const 一覧 = fs.readdirSync(置き場).filter((f) => f.endsWith(".jsx"));

const 表のある画面 = 一覧.filter((f) => /<table[\s>]/.test(readCode("components", f)));

見る("較正 ── ★表の ある 画面を 数えられて いる", () => {
  assert.ok(表のある画面.length >= 5, "★数えられて いません: " + 表のある画面.length);
  assert.ok(表のある画面.includes("OpsRosterTable.jsx"), "★当たりが ありません");
  assert.ok(!表のある画面.includes("UiV2.jsx"), "★無い ものを 見つけて います");
});

// ★★運営の 表（`Ops…`）は、★みな 入れ物に 入って いる こと。
const 運営の表 = 表のある画面.filter((f) => f.startsWith("Ops"));

見る("★運営の 表は みな `.tblwrap` の 中（" + 運営の表.length + "枚）", () => {
  const 無い = 運営の表.filter((f) => !/TABLE_CLASS|tblwrap/.test(readCode("components", f)));
  assert.strictEqual(無い.length, 0, "★入れ物が ない: " + 無い.join(" "));
});

見る("★運営の 表に、★手で 書いた 貼り付けが ない", () => {
  // ★★`position: sticky` を 画面に 直に 書くと、★決めが 2つに なります。
  //   ★★表の 外（帯・見出しの 段）は 別 です。★表の 中 だけ を 見ます。
  const 悪い = [];
  運営の表.forEach((f) => {
    const 本 = readCode("components", f);
    const i = 本.indexOf("<table");
    const j = 本.indexOf("</table>", i);
    if (i < 0 || j < 0) return;
    const なか = 本.slice(i, j);
    if (/position:\s*"sticky"/.test(なか)) 悪い.push(f);
  });
  assert.strictEqual(悪い.length, 0, "★手で 書いて います: " + 悪い.join(" "));
});

見る("★左の 列には 錨が ついて いる", () => {
  const 無い = 運営の表.filter((f) => !/ANCHOR_CLASSES|"(stick|anc)"/.test(readCode("components", f)));
  assert.strictEqual(無い.length, 0, "★錨が ない: " + 無い.join(" "));
});

console.log("\n★" + 数 + "つ 通りました。");
