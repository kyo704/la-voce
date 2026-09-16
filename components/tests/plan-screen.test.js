#!/usr/bin/env node

// ============================================================================
// ★プランの 画面（★見本 SC['プラン']）
//
//   ★★2026-09-16 まで、★門の 中の この 画面は **まっ白** でした。
//     ★中身が 1枚の 札だけ で、★その 札に
//       `subscribed !== true && paidGateApplies` が 付いて いました。
//     ★★試しの 一覧に 居ない 方には、★1つも 出ません でした。
//   ★★坂本さんの お決め ──
//     「★paidGateApplies は『勧誘するか』の 門であって
//       『価格を 見せるか』の 門では ない」
//
//   ★★この 見張りが 見る のは 4つ です ──
//     ★① 空の ときの 姿が 在る こと
//     ★② 38人の 画面に 生えて いない こと
//     ★③ 値段を 直に 書いて いない こと
//     ★④ 裁定その54 で 消した 字が 戻って いない こと
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode, readRaw } = require("./_source");

let ok = 0, ng = 0;
function t(cond, label) {
  if (cond) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label); ng++; }
}

const ROOT = path.join(__dirname, "..", "..");
for (const f of ["lib/planScreen.js", "components/VocalTracker.jsx",
  "app/billing/page.js", "lib/freeTier.js", "lib/plans.js"]) {
  if (!fs.existsSync(path.join(ROOT, f))) {
    console.log("★★ありません: " + f);
    console.log("　★数えません。★止まります。");
    process.exit(1);
  }
}

const ps = readRaw("lib", "planScreen.js");
const psCode = readCode("lib", "planScreen.js");
const vtRaw = readRaw("components", "VocalTracker.jsx");
const vt = readCode("components", "VocalTracker.jsx");
const bill = readCode("app", "billing", "page.js");
const ft = readCode("lib", "freeTier.js");

console.log("① 空の ときの 姿が 在る こと");
// ★★見本の 字を、★そのまま 持って いるか。
[
  "いまも これからも 無料", "調べる", "無料",
  "記録", "並べる", "さかのぼる", "ノート",
  "ひつじ・おうち", "受診用の 1枚", "書き出す（CSV・JSON）",
  "詳しく 数える", "調べることを 5つまで 選ぶ", "本番の 前の3日だけ",
  "調べるを 見る", "やめる", "お支払いは ありません"
].forEach((w) => t(ps.includes(w) || vtRaw.includes(w), "★「" + w + "」"));

console.log("\n② 38人の 画面に 生えて いない こと");
// ★★`inMore()` は 門の 外で undefined を 返します。★つまり「出す」です。
//   ★★`display: inMore("プラン")` だけ で 出すと、★38人の 画面が 変わります。
//   ★★だから `layoutV2 &&` で 囲って ある こと。
const at = vtRaw.indexOf('data-v2-plan="1"');
t(at > 0, "プランの 節が 在る（data-v2-plan）");
if (at > 0) {
  const before = vtRaw.slice(Math.max(0, at - 700), at);
  t(/layoutV2 && moreSection === "プラン"/.test(before),
    "★`layoutV2 &&` で 囲って ある（★門の 外には 出さない）");
}

console.log("\n③ 値段を 直に 書いて いない こと");
// ★★2026-09-07、★年額を 5,800 → 4,800 に 下げた とき、
//   ★値段を 直に 書いて いた 2か所だけ が 古いまま 残りました。
t(/monthlyPriceLabel/.test(psCode), "値段は lib/plans.js から 引く");
t(!/580\s*円/.test(psCode), "★lib/planScreen.js に「580円」を 書いて いない");
const planBlock = at > 0 ? vtRaw.slice(at, at + 3200) : "";
t(!/580/.test(planBlock), "★画面の 中に 580 を 書いて いない");

console.log("\n④ 裁定その54 で 消した 字が 戻って いないこと");
// ★★出どころ 裁定その54（★2026-09-13・坂本さん承認済み）──
//   「★学校の 400円は 運営のみ。★個人の 有料機能は 学生が 自分で 買う」
//   ★★だから「調べるが 束に なって います」は **事実と ちがい** ます。
//   ★★本番の `app/billing/page.js` が、★それを 出して いました。
const GONE = ["束に なって", "二重には いただきません", "調べるの 束",
  "名簿から 外れると 止まりますが"];
GONE.forEach((w) => {
  t(!ft.includes(w), "lib/freeTier.js に「" + w + "」が ない");
  t(!bill.includes(w), "app/billing/page.js に「" + w + "」が ない");
  t(!psCode.includes(w), "lib/planScreen.js に「" + w + "」が ない");
});
t(!/SCHOOL_BUNDLE_LINES/.test(ft), "★`SCHOOL_BUNDLE_LINES` が もう ない");

console.log("\n⑤ 同じ ことを 言う 場所が 1つで ある こと");
// ★★字は lib/planScreen.js だけ が 持ちます。
//   ★★プランの 画面と お支払いの 画面が、★同じ ところを 読む こと。
t(/PLAN_NOTE_LINES/.test(bill), "お支払いの 画面が planScreen を 読む");
t(/from "@\/lib\/planScreen"/.test(bill), "★読み込みが 在る");
t(/from "@\/lib\/planScreen"/.test(vt), "★プランの 画面も 同じ ところから");
const NEW1 = "調べるは、ご自分で お選びいただくものです。";
t(ps.includes(NEW1), "新しい 字が lib/planScreen.js に 在る");
t(!bill.includes(NEW1), "★お支払いの 画面に 書き写して いない");
t(!vtRaw.includes(NEW1), "★プランの 画面にも 書き写して いない");

console.log("\n⑥ 売り物の 一覧が ずれて いないこと");
// ★★「何が 有料か」は lib/freeTier.js の PAID_FEATURES が 決めます。
//   ★★lib/planScreen.js は **言い方**だけ。★鍵で 結んで あります。
//   ★★片方が 増えたり 減ったり したら、★ここで 落ちます。
// ★★★ここで 1度 誤りました（★出す 前に 捕まえました）。
//   ★★はじめ、★ファイル 全体から `鍵: "字"` を 拾って いました。
//     ★★`PLAN_BUTTON` の `free:` `paid:` まで 拾い、
//       ★「余分な 言い方が ある」と 2件 落ちました。
//     ★★余分では ありません。★別の かたまりの 鍵 でした。
//   ★★数える 前に、★**どこを 数えるか**を 決めます。
const blk = psCode.match(/PAID_ROW_LABEL = Object\.freeze\(\{([\s\S]*?)\}\)/);
const keys = blk ? [...blk[1].matchAll(/(\w+):\s*"/g)].map((m) => m[1]) : [];
t(keys.length > 0, "PAID_ROW_LABEL を 読めた（" + keys.join(", ") + "）");
const paid = [...readCode("lib", "freeTier.js")
  .matchAll(/PAID_FEATURES = Object\.freeze\(\[([\s\S]*?)\]\)/g)];
const paidKeys = paid.length
  ? [...paid[0][1].matchAll(/"(\w+)"/g)].map((m) => m[1]) : [];
t(paidKeys.length > 0, "PAID_FEATURES を 読めた（" + paidKeys.join(", ") + "）");
paidKeys.forEach((k) => t(keys.includes(k), "★言い方が 在る ── " + k));
keys.forEach((k) => t(paidKeys.includes(k), "★余分な 言い方が ない ── " + k));

console.log("\n⑦ 見本の 日付を、それらしく こしらえて いないこと");
// ★★見本は 払って おられる 方に「次の お支払い　2026年10月9日」と 出します。
//   ★★その 日付を、★いまの 実装は 持って いません。
//     ★`subscriptions` から 読んで いるのは status と tier だけ です。
//   ★★だから 出しません。★作りません。
t(!/次の お支払い/.test(psCode) && !/次の お支払い/.test(planBlock),
  "★「次の お支払い」を 書いて いない（★日付を 持って いない ため）");
t(!/2026年10月9日/.test(psCode + planBlock), "★見本の 日付を 写して いない");

console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
process.exit(ng === 0 ? 0 : 1);
