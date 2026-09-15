#!/usr/bin/env node

// ============================================================================
// ★値段は、★1か所だけ（★2026-09-15）
//
//   ★出どころ 坂本さん ──「★値段の 食い違いは、
//     ★実際の 課金・信頼に 直結する。★優先して 洗い出して」
//
//   ★★何が 起きたか。
//     ★★年額を 5,800 → 4,800 に 下げた とき、★`/billing` は 直り、
//       ★`components/CountV2.jsx` だけ **古いまま** 残りました。
//     ★★門の 中の 方は、★かぞえる → 調べる で **5,800円** を 見て いました。
//       ★実際に 払う 額は 4,800円 です。
//     ★★`app/billing/page.js:95` に、★**同じ 失敗の 記録**が あります。
//       ★「★年額を 5,800 → 4,800 に下げたとき、★ここだけ古いまま残りました。」
//       ★★つまり **2度目** です。
//
//   ★★だから、★機械で 止めます。★気持ちでは 止まりません。
//
//   ★★この 見張りが 見る のは「画面に 出る 字」だけ です。
//     ★コメントの 中の 数は 見ません。★出ない から です。
//     ★`lib/learnContent.js` も 見ません ── ★記事の 本文（レッスン料など）で、
//       ★私たちの 値段では ありません。
// ============================================================================

const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { readCode } = require("./_source");

const ROOT = path.join(__dirname, "..", "..");

let ok = 0;
let ng = 0;
function t(cond, label) {
  if (cond) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label); ng++; }
}

console.log("① ★道具が 通る こと");
let out = "";
let code = 0;
try {
  out = execFileSync("python3", [path.join(ROOT, "tools", "price_hardcode_scan.py")],
    { cwd: ROOT, encoding: "utf8" });
} catch (e) {
  out = (e.stdout || "") + (e.stderr || "");
  code = e.status;
}
const m = out.match(/合わない 値段: (\d+) 件/);
t(m !== null, "★道具が 数を 出した");
t(m && m[1] === "0", "★★plans.js と 合わない 値段が 0 件（★実際 " + (m ? m[1] : "?") + "）");
t(code === 0, "★道具が 0 で 終わる");

console.log("\n② ★値段の 決めは lib/plans.js が 1つだけ 持つ");
const plans = readCode("lib", "plans.js");
t(/export const PLANS/.test(plans), "★PLANS が ある");
t(/priceYen: 580/.test(plans), "★月額 580");
t(/priceYen: 4800/.test(plans), "★年額 4800");
t(/export function priceLabelOf/.test(plans), "★札を 引く 道が ある");
t(/export function priceWithTaxOf/.test(plans), "★税込の 札を 引く 道が ある");

console.log("\n③ ★画面が 値段を 書き写して いないこと");
// ★★かぞえる（★2026-09-15 に 直した ところ）。
const cv = readCode("components", "CountV2.jsx");
t(/priceWithTaxOf\("monthly"\)/.test(cv), "★かぞえるは 月額を 引いて いる");
t(/priceWithTaxOf\("annual"\)/.test(cv), "★かぞえるは 年額を 引いて いる");
t(!/5,800/.test(cv), "★★5,800 が 残って いない（★これが 誤りでした）");
t(!/"580円|"4,800/.test(cv), "★値段を 書き写して いない");

console.log("\n④ ★道具が 本当に 見つけられること（★校正）");
// ★★わざと ちがう 値段を 置いて、★落ちる ことを 見ます。
//   ★★1度も 落ちない 見張りは、★働くか 分かりません。
const bait = path.join(ROOT, "lib", "_priceBait.js");
fs.writeFileSync(bait, 'export const X = "9,900円";\n', "utf8");
let out2 = "";
let code2 = 0;
try {
  out2 = execFileSync("python3", [path.join(ROOT, "tools", "price_hardcode_scan.py")],
    { cwd: ROOT, encoding: "utf8" });
} catch (e) { out2 = (e.stdout || "") + (e.stderr || ""); code2 = e.status; }
fs.unlinkSync(bait);
t(/_priceBait\.js/.test(out2), "★わざと 置いたら 名指しで 出る");
t(code2 !== 0, "★わざと 置いたら 落ちる");

console.log("\n⑤ ★まだ 引いて いない ところ（★数えるだけ・落としません）");
// ★★特商法の 紙は、★いま 値が 合って います。★法律の 文 なので、
//   ★★勝手に 直しません。★お裁きを いただいてから。
const tk = readCode("app/legal/tokushoho", "page.js");
const still = /580円/.test(tk) || /4,800円/.test(tk);
console.log("　★app/legal/tokushoho/page.js が 値段を 書き写して いる: "
  + (still ? "★はい（★いまは 値が 合って います）" : "いいえ"));
console.log("　★★法律の 文 です。★お裁きを いただいてから 直します。");

console.log("\n⑥ ★この 見張りが 見て いない こと");
console.log("　★組み立てて 作る 数（★変数）は 見えません。");
console.log("　★docs/ と supabase/ は 見て いません。★画面に 出ない から です。");

console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
process.exit(ng === 0 ? 0 : 1);
