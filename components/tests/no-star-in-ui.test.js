#!/usr/bin/env node

// ============================================================================
// ★「★」が、★画面に 出て いないこと
//
//   ★出どころ [ACTION] Opus → Code（★2026-09-15・SEVERITY 2）
//     「★『★』is our document annotation. ★it should not ship」
//     「★ADD A GUARD: ★ is forbidden in user-facing strings
//       ★same shape as the price-literal and colour-literal guards
//       ★otherwise it returns」
//
//   ★★「★」は、★私たちが 紙の 中で 使う 印です。
//     ★★「ここが 大事」「ここに いきさつが ある」という 合図で、
//       ★読む人（★私たち）の ための ものです。
//     ★★利用者の 画面に 出る ものでは ありません。
//
//   ★★2026-09-15、★20件 出て いました。★いちばん 重かったのは これ です ──
//     `lib/translations.js` の `deleteGraceNote`
//     「…ログインすれば戻せます。★ただし、先生との共有はすぐに切れます。」
//     ★★**退会の 画面**に 出て いました。
//
//   ★★数えるのは `tools/star_leak_scan.py` です。★同じ 決めを 2か所に 置きません。
//     ★この見張りは、★その 道具を 走らせて、★数を 見ます。
// ============================================================================

const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const TOOL = path.join(ROOT, "tools", "star_leak_scan.py");

let ok = 0, ng = 0;
function t(cond, label) {
  if (cond) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label); ng++; }
}

if (!fs.existsSync(TOOL)) {
  console.log("★★ありません: tools/star_leak_scan.py");
  console.log("　★数えません。★止まります。");
  process.exit(1);
}

console.log("① 道具が 通ること");
let out = "";
try {
  out = execFileSync("python3", [TOOL], { cwd: ROOT, encoding: "utf8" });
} catch (e) {
  out = (e.stdout || "") + (e.stderr || "");
}
const mQ = out.match(/① 引用符の 中[^…]*… (\d+) 件/);
const mB = out.match(/★うち それ以外（★画面の 字）… (\d+) 件/);
t(mQ !== null && mB !== null, "★道具が 数を 出した");

console.log("\n② ★画面の 字に「★」が ないこと");
const bare = mB ? Number(mB[1]) : -1;
t(bare === 0, "★JSX の 地の 字に「★」が 0 件（★いま " + bare + "）");

console.log("\n③ 引用符の 中（★訳・定数）");
// ★★★2件 残して います。★どちらも `lib/consent.js` の 同意の 文 です。
//   ★★`health.cycle` と `health.reflux_care`。
//
//   ★★★なぜ 消さないか（★2026-09-15・台帳 ㊳）。
//     ★★`consent_records` は 文面を 持ちません。★`text_hash` だけ です。
//       ★文を 変えると、★ハッシュが 変わり、
//       ★★過去の 行が **どの 文面だったか 分からなく なります**。
//     ★★一度 外して、★戻しました ──
//       health.cycle       fnv1a-88086752 → fnv1a-a34ee161
//       health.reflux_care fnv1a-094f46d4 → fnv1a-35972d00
//     ★★版を 上げれば よいか ── ★いいえ。★`lib/consent.js:31` が 禁じて います。
//       「★誤字の 直しでは 上げません」。★「★」を 外すのは、★誤字の ほう です。
//
//   ★★だから、★画面に「★」が 出た まま です。★承知の うえ です。
//     ★★黙って 同意の 文を 変える ほうが、★重い から です。
//
//   ★★★次に 版を 上げる とき、★一緒に 外して ください（★台帳 ㊳）。
//     ★そのとき、★この 数を 0 に して ください。
const quoted = mQ ? Number(mQ[1]) : -1;
t(quoted <= 2, "★引用符の 中は 2件 以下（★いま " + quoted + "）");
if (quoted > 0) {
  console.log("    ★★残りは `lib/consent.js` の 同意の 文 です（★台帳 ㊳）。");
  console.log("    ★★ハッシュが 変わるので、★版を 上げる ときに 一緒に 外します。");
}

// ★★★同意の 文の ハッシュが、★変わって いないこと。
//   ★★これが この 見張りの、★いちばん 大事な 1本 です。
//   ★★2026-09-15、★私は 気づかずに 2つ 変えて いました。
//     ★★`consent_records` に 行が 無かった から 助かっただけ です。
const consentSrc = fs.readFileSync(path.join(ROOT, "lib", "consent.js"), "utf8");
const EXPECT = {
  "health.record": "fnv1a-8df9e04c",
  "health.cycle": "fnv1a-88086752",
  "health.meal_sleep": "fnv1a-4215208b",
  "health.reflux_care": "fnv1a-094f46d4"
};
(async () => {
  const C = await import("data:text/javascript;base64,"
    + Buffer.from(consentSrc, "utf-8").toString("base64"));
  console.log("\n★★同意の 文の ハッシュが 変わって いないこと");
  Object.keys(EXPECT).forEach((k) => {
    const p = C.purposeByKey(k);
    const h = p ? C.textHash(p.text) : "（目的が ありません）";
    t(h === EXPECT[k], k + " … " + h);
  });
  console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
  process.exit(ng === 0 ? 0 : 1);
})();

console.log("\n④ ★いちばん 重かった ものが、★戻って いないこと");
// ★★退会の 画面の 1行。★出て いては いけない ところ でした。
const tr = fs.readFileSync(path.join(ROOT, "lib", "translations.js"), "utf8");
const m = tr.match(/deleteGraceNote:\s*\{\s*ja:\s*"([^"]*)"/);
t(m !== null, "deleteGraceNote が ある");
t(m !== null && !m[1].includes("★"), "★その 中に「★」が ない");

console.log("\n⑤ 記事の 本文は、★別の 話");
// ★★`lib/learnContent.js` は「学ぶ」の 記事 そのもの です。
//   ★★書いたのは 私たちでは ありません。★著者の 字 です。
//   ★★そこの「★」は、★著者が 強めた ところ かも しれません。
//   ★★混ぜて 数えると、★直すべき ものが 埋もれます。
t(/記事の 本文/.test(out), "道具が 記事の 本文を 分けて 数えて いる");

