// ============================================================================
// 言葉の 印 tx() ── 見張り（★2026-09-11）
//
//   ★出どころ Opus「仕様-組織のかたちと言葉の抽出（9月10日・実装用）」
//            ＋ 坂本さんの お決め（★2026-09-11・名前は tx）
//
//   ★★見張るのは 3つ。
//     ① tx() が、★受け取った ものを そのまま 返す
//     ② 中に 変数を 入れていない（★つないでいない）
//     ③ 既存の t（翻訳）と、★同じ ファイルで 混ざっていない
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode, readRaw, ROOT } = require("./_source");

let failed = 0;
function ok(cond, label) {
  if (cond) console.log("  ok  " + label);
  else { console.log("  NG  " + label); failed++; }
}

(async () => {
  const src = readRaw("lib", "t.js");
  const T = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));

  console.log("① そのまま 返す");
  ok(T.tx("記録した日数") === "記録した日数", "★文字は そのまま");
  ok(T.tx("") === "", "★空も そのまま");

  console.log("② 中に 変数を 入れていない");
  // ★★つないだ ものは、★抜き出す 側が 読めません。
  //   ✕ tx("あと " + n + "日")　◎ tx("あと{n}日").replace("{n}", n)
  const files = [];
  ["lib", "components", "app"].forEach((d) => (function walk(x) {
    for (const f of fs.readdirSync(x, { withFileTypes: true })) {
      const p = path.join(x, f.name);
      if (f.isDirectory()) { if (!/^(tests|node_modules|\.next)$/.test(f.name)) walk(p); }
      else if (/\.(js|jsx)$/.test(f.name)) files.push(path.relative(ROOT, p));
    }
  })(path.join(ROOT, d)));
  const bad = [];
  files.forEach((rel) => {
    const code = readCode(...rel.split(path.sep));
    // ★tx( の あとに、★閉じかっこの 前に ＋ や ${ が あるもの
    [...code.matchAll(/\btx\(([^)]*)\)/g)].forEach((m) => {
      const arg = m[1];
      if (/\+|\$\{|`/.test(arg)) bad.push(rel + " → tx(" + arg.slice(0, 40) + ")");
    });
  });
  ok(bad.length === 0, "★つないだ 文字を 包んでいない"
    + (bad.length ? "（" + bad.slice(0, 3).join(" / ") + "）" : ""));

  console.log("③ 翻訳の t と 混ざっていない");
  // ★★1つの ファイルで、★tx を 取り寄せながら
  //   ★createTranslator の t を 使っていないか。
  const both = files.filter((rel) => {
    const code = readCode(...rel.split(path.sep));
    return /from "@\/lib\/t"/.test(code) && /createTranslator/.test(code);
  });
  ok(both.length === 0, "★同じ ファイルに 2つの t が いない"
    + (both.length ? "（" + both.join(" / ") + "）" : ""));
  ok(!/export function t\b/.test(readCode("lib", "t.js")), "★t という 名前で 出していない");
  ok(/export function tx/.test(readCode("lib", "t.js")), "★名前は tx");

  console.log("④ なぜ tx なのかが 書いてある");
  ok(/createTranslator/.test(readRaw("lib", "t.js")), "★ぶつかる 相手が 名指しで 書いてある");

  console.log(failed === 0 ? "\n全て ok" : "\n" + failed + "件 NG");
  process.exit(failed === 0 ? 0 : 1);
})();
