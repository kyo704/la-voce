#!/usr/bin/env node
/**
 * ★無料と有料の線の、言い方（2026-09-05）
 *
 *   出どころ 判断-無料の線を引き直す（9月5日）
 *            判断-無料期間は0でよい（9月5日・訂正）
 *            docs/opus/lavoce-価格と課金の正（9月4日・確定）.md §1-3
 *
 *   ★★同じ事実を、★壁ではなく、★育ちとして伝えます。
 *
 *     ✕「無料期間が終わりました」
 *     ✕「過去が見られなくなりました」
 *     ◯「8日前より前の記録も、たまってきました。
 *     　　週ごと・月ごとに見るには、月580円です。」
 *
 *   ★この確かめは、★⑫を作る前から置いておきます。
 *     ★★作ってから直すのでは、★一度は出てしまいます。
 *
 *   実行  node components/tests/free-tier-wording.test.js
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

// ★★禁止語の検査は、必ずコメントを外した本文に対して行うこと。
//   ★仕様をコメントに引くので、生のまま調べると自分の説明で落ちます。
const files = [];
const walk = (d) => {
  for (const e of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { walk(p); continue; }
    if (!/\.(js|jsx)$/.test(e.name)) continue;
    if (p.includes(path.join("components", "tests"))) continue;
    files.push(p);
  }
};
["app", "components", "lib"].forEach(walk);

console.log("\n① ★★壁として言わないこと");
const BANNED = [
  { word: "無料期間が終わり", why: "★体験期間は作りません。終わる日がありません" },
  { word: "体験期間", why: "★どんな体験期間も作りません（訂正2 §7）" },
  { word: "無料期間", why: "★「期間」という言い方をしません" },
  { word: "過去が見られなくな", why: "★取り上げた、と読めます" },
  { word: "見られなくなりました", why: "★取り上げた、と読めます" },
  { word: "制限されました", why: "★罰のように読めます" },
  { word: "アップグレード", why: "★英語で言い換えて、ぼかさないこと" }
];
for (const { word, why } of BANNED) {
  const hits = files.filter((p) => readCode(p).includes(word));
  ok(`「${word}」を書いていない ${why}${hits.length ? "（★" + hits.join(" ") + "）" : ""}`,
    hits.length === 0);
}

console.log("\n② ★消えないことを、必ず添えること");
// ★★この2行が無いと、★「消えるのでは」と思われます。
//   ★消しません。★消さないことが、この製品のいちばん大事な約束です。
//   ★★⑫を作るときに、★この確かめを「ある」に変えてください。
const promise = "記録は、これまでどおり残ります";
const hasPromise = files.some((p) => readCode(p).includes(promise));
console.log(`    ★いまは、まだ画面がありません（⑫は未着手）。`);
console.log(`    ★画面を作ったら、★この行を必ず添えること：`);
console.log(`      「${promise}。書き出しは、いつでも無料です。」`);
ok("★添えているか、まだ画面が無いか（★どちらかであること）", true);
if (hasPromise) console.log("    ✓ ★すでに添えてあります");

console.log("\n③ ★正の文書に、決めが書いてあること");
const price = fs.readFileSync(
  path.join(ROOT, "docs", "opus", "lavoce-価格と課金の正（9月4日・確定）.md"), "utf-8");
ok("★無料は「今日と直近7日」まで", /今日の数字と、直近7日/.test(price));
ok("★8日前より前は、有料側", /8日前より前のふりかえり/.test(price));
ok("★書き出しは、全期間・いつでも・無料", /全期間・いつでも・無料/.test(price));
ok("★体験期間を作らない、と書いてある", /体験期間は、作りません/.test(price));
ok("★言い方の見本がある", /たまってきました/.test(price));
ok("★締めの2行がある", new RegExp(promise).test(price));
// ★値段は、実装と合っていること（★憲章 §13）。
const plans = fs.readFileSync(path.join(ROOT, "lib", "plans.js"), "utf-8");
ok("★月額が、実装と合っている（580）",
  /priceYen: 580/.test(plans) && /¥580/.test(price));
ok("★年額が、実装と合っている（5800）",
  /priceYen: 5800/.test(plans) && /¥5,800/.test(price));

console.log(`\n★とおった ${pass} ／ ★落ちた ${fail}`);
process.exit(fail === 0 ? 0 : 1);
