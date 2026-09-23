#!/usr/bin/env node
// STRIP: A（振る舞い）
// ============================================================================
// ★★★外へ 便りを 出す 場所は、★ぜんぶ 台帳に 載って いる
//
//   ★出どころ 2026-09-23 ──
//     ★`lib/outboundRoutes.js` の resend の 欄は `where` が **1本** でした。
//     ★★けれど 実際に `api.resend.com` を 呼ぶ 場所は **7本** ありました。
//     ★★★台帳は「どこから 外へ 出て いるか」を 説明する 紙 です。
//       ★6本 抜けて いる 紙は、★説明に なりません。
//
//   ★★この 見張りは 数を 覚えません。★毎回 **数え直します**。
//     ★道が 増えたら、★台帳に 足すまで 赤の まま です。
// ============================================================================
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
let 落ち = 0;
function t(cond, label) {
  if (cond) console.log("  ok   " + label);
  else { console.log("  NG   " + label); 落ち++; }
}

// ★★呼んで いる 場所を 数え直す（★app/ と lib/ を 歩く）
function 歩く(d, 出) {
  fs.readdirSync(d).forEach((n) => {
    const f = path.join(d, n);
    if (fs.statSync(f).isDirectory()) return 歩く(f, 出);
    if (!/\.jsx?$/.test(n)) return;
    const 中 = fs.readFileSync(f, "utf8");
    // ★★註の 中の 例示は 数えません（★STRIP: A）
    const 実 = 中.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    if (/api\.resend\.com/.test(実)) 出.push(path.relative(ROOT, f));
  });
  return 出;
}
const 呼場 = 歩く(path.join(ROOT, "app"), 歩く(path.join(ROOT, "lib"), []))
  .filter((p) => p !== "lib/outboundRoutes.js").sort();

// ★★台帳に 載って いる 場所
const 台 = fs.readFileSync(path.join(ROOT, "lib", "outboundRoutes.js"), "utf8");
const 欄 = 台.slice(台.indexOf('id: "resend"'), 台.indexOf('id: "stripe"'));
const 載 = [];
const w = 欄.match(/where:\s*"([^"]+)"/);
if (w) 載.push(w[1].replace(/:\d+$/, ""));
const a = 欄.match(/alsoWhere:\s*\[([\s\S]*?)\]/);
if (a) (a[1].match(/"([^"]+)"/g) || []).forEach((x) => 載.push(x.slice(1, -1).replace(/:\d+$/, "")));
載.sort();

console.log("★呼んで いる 場所 …… " + 呼場.length + "本");
呼場.forEach((p) => console.log("    " + p));
console.log("★台帳に ある 場所 …… " + 載.length + "本");

t(呼場.length > 0, "★数え られて いる（★0本 なら 見張りが 壊れて います）");
呼場.forEach((p) => t(載.includes(p), "★台帳に ある ── " + p));
載.forEach((p) => t(呼場.includes(p), "★台帳の 場所は いま も 呼んで いる ── " + p));

console.log(落ち === 0 ? "\n★すべて 通りました" : "\n★" + 落ち + "件 落ちました");
process.exit(落ち === 0 ? 0 : 1);
