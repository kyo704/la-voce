#!/usr/bin/env node

// ============================================================================
// ★見張り ── ★運営の 画面に 生の 色を 書かない（★裁定 その81 §1-3）
//
//   ★★★「色を 直に 書かない。★必ず トークンを 通す」（★裁定 その81 §1-3）。
//   ★★2026-09-19 に 29か所 直しました（★`tools/visual_scope.py` で 数えました）。
//
//   ★★★§9 の 失敗②を 繰り返さない ため、★**定義**は 見ません。
//     ★★`lib/tokens.js` ／ `lib/visualTokens.js` は 色そのものを 書く ところ です。
//     ★★あそこを 置換すると、★`--ink:var(--ink)` に なり 画面が 壊れます。
//
//   ★★較正 ── ★わざと 1件 当たる ものを 作り、★見つかる ことを 確かめます。
// ============================================================================

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { readCode } = require("./_source");

let 数 = 0;
function 見る(名, f) { f(); 数 += 1; console.log("  ○ " + 名); }

const ROOT = path.join(__dirname, "..", "..");
const 運営 = fs.readdirSync(path.join(ROOT, "components"))
  .filter((f) => f.startsWith("Ops") && f.endsWith(".jsx"));
if (運営.length < 10) {
  console.log("★★運営の 画面が %d本 しか ありません。★止まります。", 運営.length);
  process.exit(1);
}

const 生の色 = /#[0-9A-Fa-f]{3,8}\b|rgba?\(/;

見る("道具の 較正", () => {
  assert.ok(生の色.test('color: "#FFFDF8"'), "★道具が 壊れて います");
  assert.ok(生の色.test("background: rgba(0,0,0,.2)"), "★道具が 壊れて います");
  assert.ok(!生の色.test("color: C.onCurtain"), "★道具が 壊れて います");
});

見る(`★運営の ${運営.length}本に 生の 色が ない`, () => {
  const 悪い = [];
  for (const f of 運営) {
    // ★★註は 落として 見ます（★裁定の 番号（#007）などが 註に あります）。
    const 素 = readCode("components", f);
    for (const 行 of 素.split("\n")) {
      if (生の色.test(行)) 悪い.push(`${f} … ${行.trim().slice(0, 60)}`);
    }
  }
  assert.deepStrictEqual(悪い, [], "★生の 色が あります");
});

見る("★★定義の ところは 触って いない（★§9 の 失敗②）", () => {
  for (const f of ["lib/tokens.js", "lib/visualTokens.js"]) {
    const 本 = fs.readFileSync(path.join(ROOT, f), "utf8");
    assert.ok(生の色.test(本), `★色そのものが 消えて います: ${f}`);
    assert.ok(!/--ink:\s*var\(--ink\)/.test(本), `★自分を 指して います: ${f}`);
  }
});

見る("★新しい 名前が 台帳（tokens）に ある", () => {
  const t = fs.readFileSync(path.join(ROOT, "lib", "tokens.js"), "utf8");
  for (const 名 of ["onCurtain", "opsBand", "opsFoot", "onCurtainFaint", "scrim"]) {
    assert.ok(new RegExp(名 + ":").test(t), "★ありません: " + 名);
  }
  // ★★`card` と `onCurtain` は 同じ 値 ですが、★別の 名 です。
  assert.ok(/onCurtain: "#FFFDF8"/.test(t), "★値が 変わって います");
  assert.ok(/card: "#FFFDF8"/.test(t), "★箱の 地が 変わって います");
});

console.log("\n★" + 数 + "つ 通りました。");
