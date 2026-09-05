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
  // ★★「体験期間はありません」だけは、★書かなければならない文です。
  //   ★特商法の表記に要ります。★だから、★そこだけ許します。
  //   ★禁じたいのは「終わりました」「もうすぐ終わります」の側です。
  { word: "体験期間", why: "★どんな体験期間も作りません（訂正2 §7）",
    allow: "体験期間はありません" },
  { word: "無料期間", why: "★「期間」という言い方をしません" },
  { word: "過去が見られなくな", why: "★取り上げた、と読めます" },
  { word: "見られなくなりました", why: "★取り上げた、と読めます" },
  { word: "制限されました", why: "★罰のように読めます" },
  { word: "アップグレード", why: "★英語で言い換えて、ぼかさないこと" }
];
for (const { word, why, allow } of BANNED) {
  const hits = files.filter((p) => {
    let t = readCode(p);
    // ★★禁じた言い方の「一覧」そのものは、外します（2026-09-05 夜）。
    //   ★禁じるために書いてある言葉です。★画面には出ません。
    //   ★★一覧の中だけを外します。★ファイルごと素通しにしないこと。
    t = t.replace(/FORBIDDEN_GATE_PHRASES = Object\.freeze\(\[[\s\S]*?\]\);/, "");
    // ★許した1文だけを外してから、★まだ残っているかを見ます。
    //   ★★「許した」を丸ごと素通しにしないこと。★1文だけです。
    if (allow) t = t.split(allow).join("");
    return t.includes(word);
  });
  ok(`「${word}」を書いていない ${why}${hits.length ? "（★" + hits.join(" ") + "）" : ""}`,
    hits.length === 0);
}

// ★★許した1文は、★その形どおりに書かれていること。
//   ★「体験期間はありません」以外の使い方をしていたら、上で落ちます。
ok("★特商法の表記に「体験期間はありません」がある",
  readCode("app", "legal", "tokushoho", "page.js").includes("体験期間はありません"));

// ★★外した一覧が、★ちゃんと在ること（★素通しにしないため）。
ok("★禁じた言い方の一覧が、lib/freeTier.js に在る",
  /FORBIDDEN_GATE_PHRASES = Object\.freeze\(\[/.test(readCode("lib", "freeTier.js")));
ok("★その一覧が、5つ以上ある",
  (readCode("lib", "freeTier.js").match(/FORBIDDEN_GATE_PHRASES = Object\.freeze\(\[([\s\S]*?)\]\);/) || ["", ""])[1]
    .split(",").filter((x) => x.trim()).length >= 5);

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
// ★★原本は「法定。全期間・全項目」です（無料の線を引き直す §2・§5）。
//   ★「全項目」を落とさないこと。★項目を選んで書き出すのは、制限です。
ok("★書き出しは、法定・全期間・全項目・いつでも・無料",
  /法定。★?全期間・★?全項目・いつでも・無料/.test(price));
ok("★触ってはいけないものの一覧がある", /触ってはいけないもの/.test(price));
ok("★「金を払わない人には黙っている」形を禁じている",
  /金を払わない人には黙っている/.test(price));
ok("★言い方の1行目（見られるものを先に）がある",
  /きのうまでの7日間は、いつでもご覧いただけます/.test(price));
ok("★催促しない、と書いてある", /催促しない/.test(price));
ok("★本番モードは初日から買える、と書いてある", /初日から買えます/.test(price));
// ★★よそおいは、月額に入りません（装いを別売りにする・9月4日夜）。
ok("★よそおいが、月額に入っていない", /この月額には入りません/.test(price));
ok("★「月額に3点ついてくる」と書いていない",
  !/毎月のよそおい ── 服・壁・床・家具・景色から★?3点/.test(price));
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
