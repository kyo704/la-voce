#!/usr/bin/env node
/**
 * ★お申し込みが進まなかったとき、★理由が分かること（2026-09-05 夜）
 *
 *   ★★どの失敗でも、★同じ1文を出していました。
 *     「エラーが発生しました。時間をおいて再度お試しください。」
 *   ★★止めないことと、★黙ることは、★別です。
 *     ★黙ると、★なぜ進めないのかを、★誰も追えません。
 *
 *   ★同じ形を、★今日3回やりました（securityMail・checkout・お知らせ）。
 *
 *   実行  node components/tests/checkout-errors.test.js
 */

const fs = require("fs");
const path = require("path");
const { readCode } = require("./_source");

const ROOT = path.join(__dirname, "..", "..");

let pass = 0;
let fail = 0;
function ok(label, cond) {
  if (cond) { pass += 1; console.log("  ✓ " + label); }
  else { fail += 1; console.log("  ✗ " + label); }
}

(async () => {
  const src = fs.readFileSync(path.join(ROOT, "components", "CheckoutButton.jsx"), "utf-8");
  // ★"use client" と JSX があるので、★中身だけを取り出して確かめます。
  const fn = src.slice(src.indexOf("export function checkoutMessage"),
    src.indexOf("export default function CheckoutButton"));
  const m = await import("data:text/javascript;base64," + Buffer.from(fn).toString("base64"));

  console.log("\n① ★理由ごとに、することが分かる言葉");
  const a = m.checkoutMessage(401, {});
  const b = m.checkoutMessage(403, { error: "plan_not_available" });
  const c = m.checkoutMessage(503, {});
  const d = m.checkoutMessage(502, {});
  ok("★入り直しを勧める（401）", /もう一度お入りください/.test(a));
  ok("★年齢の帯だと分かる（403）", /年齢/.test(b));
  ok("★時間を置くよう伝える（503）", /少し置いて/.test(c));
  ok("★窓口の話だと分かる（502）", /窓口/.test(d));
  // ★★全部が同じ文になっていないこと。
  ok("★4つが、同じ文になっていない", new Set([a, b, c, d]).size === 4);

  console.log("\n② ★中の言葉を、そのまま出さないこと");
  for (const t of [a, b, c, d]) {
    ok(`★英語の符号が出ていない（${t.slice(0, 12)}…）`, !/plan_not_available|unauthorized|unavailable/.test(t));
  }
  // ★★禁じた言い方を使わないこと（⑫・裁定 §6-5）。
  for (const t of [a, b, c, d]) {
    ok(`★「できません」と言っていない（${t.slice(0, 12)}…）`, !t.includes("できません"));
  }
  // ★★「エラー」で終わらせないこと。
  ok("★「エラーが発生しました」と言っていない",
    ![a, b, c, d].some((t) => t.includes("エラーが発生")));

  console.log("\n③ ★私たちの側に、理由が残ること");
  const cb = readCode("components", "CheckoutButton.jsx");
  ok("★状態と中身を、console に残している",
    /console\.error\("★お申し込みに進めませんでした:", res\.status/.test(cb));
  ok("★送れなかったときも、残している", /console\.error\("★お申し込みを送れませんでした/.test(cb));

  const rt = readCode("app", "api", "stripe", "checkout", "route.js");
  ok("★鍵が無いとき、名前を残している", /STRIPE_SECRET_KEY/.test(rt));
  ok("★価格IDが無いとき、どちらが無いかを残している",
    /monthly=[\s\S]{0,120}annual=/.test(rt));
  ok("★年齢の帯で止めたとき、帯を残している", /年齢の帯で止めました/.test(rt));

  console.log("\n④ ★★秘密を、ログに出さないこと");
  // ★鍵の値そのものを出さないこと。★名前と、有無だけです。
  ok("★鍵の値を出していない", !/process\.env\.STRIPE_SECRET_KEY\s*\)/.test(rt.replace(/!!process\.env\.STRIPE_SECRET_KEY/g, "")));
  ok("★価格IDの値を出していない",
    !/console\.error[\s\S]{0,120}\+ process\.env\.STRIPE_PRICE_ID/.test(rt));

  console.log(`\n★とおった ${pass} ／ ★落ちた ${fail}`);
  process.exit(fail === 0 ? 0 : 1);
})();
