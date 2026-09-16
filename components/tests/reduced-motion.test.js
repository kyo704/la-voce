#!/usr/bin/env node

// ============================================================================
// ★動きを 減らす 設定の 方に、★動きを 見せないこと
//
//   ★出どころ 裁定 その62 STEP1_MOTION（★2026-09-16）
//     「prefers-reduced-motion: reduce 時、
//       animation/transition duration .01ms・iteration 1・scroll-behavior auto」
//
//   ★★これまでは 3か所に ありました ──
//     したくの 板／羊の 吹き出し／羊の しぐさ。
//     ★★どれも「気づいた ものを、その都度」でした。
//     ★★足した 人が 知らなければ、★新しい 動きは 素通りします。
//   ★★いまは 網が 1枚 あります。★この 見張りは、★それが 在ることを 見ます。
//
//   ★★これは 見た目の 好みでは ありません。
//     ★★動きで 気分が 悪く なる 方が おられます。
//     ★★見本も 書いて います ──
//       「羊の 動きは、酔う方の ために 止められます。」
// ============================================================================

const fs = require("fs");
const path = require("path");

const CSS = path.join(__dirname, "..", "..", "app", "globals.css");

let ok = 0, ng = 0;
function t(cond, label) {
  if (cond) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label); ng++; }
}

if (!fs.existsSync(CSS)) {
  console.log("★★ありません: app/globals.css");
  console.log("　★数えません。★止まります。");
  process.exit(1);
}
const css = fs.readFileSync(CSS, "utf8");

console.log("① 網が 1枚 ある こと");
// ★★`*` に かける 網。★これから 足す 動きも 止まります。
const blocks = css.split("@media (prefers-reduced-motion: reduce)").slice(1);
t(blocks.length >= 1, "prefers-reduced-motion の 決まりが ある（" + blocks.length + " 件）");
const wide = blocks.find((b) => /^\s*\{\s*\*,/.test(b) || /\*,\s*\n\s*\*::before/.test(b));
t(!!wide, "★`*` に かける 網が ある（★その都度では ない）");

console.log("\n② 網の 中身");
const body = wide || "";
t(/animation-duration:\s*0\.01ms\s*!important/.test(body), "animation-duration .01ms");
t(/animation-iteration-count:\s*1\s*!important/.test(body), "animation-iteration-count 1");
t(/transition-duration:\s*0\.01ms\s*!important/.test(body), "transition-duration .01ms");
t(/scroll-behavior:\s*auto\s*!important/.test(body), "scroll-behavior auto");

console.log("\n③ ★0 では なく .01ms で ある こと");
// ★★0 に すると、★終わりの 合図（transitionend）が 出ない ことが あります。
//   ★★待って いる コードが、★永久に 待ちます。
t(!/animation-duration:\s*0s\s*!important/.test(body), "animation は 0s に して いない");
t(!/transition-duration:\s*0s\s*!important/.test(body), "transition は 0s に して いない");

console.log("\n④ もとからの 3つが 残って いること");
// ★★消しても 同じに なりますが、★それぞれに いきさつが 書いて あります。
t(/\.home-drawer/.test(css), "したくの 板");
t(/\[aria-live="polite"\]\s*\{\s*animation:\s*none/.test(css), "羊の 吹き出し");
t(/\.sheep-gesture\s*\{\s*animation:\s*none/.test(css), "羊の しぐさ");

console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
process.exit(ng === 0 ? 0 : 1);
