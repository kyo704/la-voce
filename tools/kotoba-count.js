// ============================================================================
// 言葉の 数を 数えます（★裁定-tx()の名前と出口（9月10日 その11）§4）
//
//   ★① 表に 何件の キーが 入っているか（★言語ごと）
//   ★② その うち、画面で 実際に 使われているのは 何件か
//   ★③ 画面の 中に、ベタ書きの 日本語が 何件 残っているか
//   ★④ tx() の 呼び出し数（★出口の 見張り。★2027年3月31日に 0件）
//
//   ★★数えるだけです。★消しません（★同 §5）。
//
//   使い方  node tools/kotoba-count.js
// ============================================================================

const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const { readCode } = require(path.join(ROOT, "components/tests/_source"));

const tr = fs.readFileSync(path.join(ROOT, "lib/translations.js"), "utf8");
const keys = [...tr.matchAll(/^  ([a-zA-Z][a-zA-Z0-9_]*): \{/gm)].map((m) => m[1]);

console.log("① 表の キー:", keys.length, "件");
["ja", "en", "zh", "it", "de", "fr", "es", "ko", "ru"].forEach((L) => {
  const n = (tr.match(new RegExp("\\b" + L + ': "', "g")) || []).length;
  const pct = keys.length ? Math.round((n / keys.length) * 100) : 0;
  console.log(`   ${L.padEnd(3)} ${String(n).padStart(4)}件  ${String(pct).padStart(3)}%`
    + (L === "it" ? "  ★イタリア語" : ""));
});

const files = [];
["components", "lib", "app"].forEach((d) => (function walk(x) {
  for (const f of fs.readdirSync(x, { withFileTypes: true })) {
    const p = path.join(x, f.name);
    if (f.isDirectory()) { if (!/^(tests|node_modules|\.next)$/.test(f.name)) walk(p); }
    else if (/\.(js|jsx)$/.test(f.name)) files.push(path.relative(ROOT, p));
  }
})(path.join(ROOT, d)));

let all = "";
files.forEach((rel) => {
  if (rel === path.join("lib", "translations.js")) return;
  all += readCode(...rel.split(path.sep)) + "\n";
});

const used = keys.filter((k) => new RegExp('["\'`]' + k + '["\'`]').test(all));
console.log("\n② 使われている キー:", used.length,
  "／ 使われていない:", keys.length - used.length);
console.log("   ★消しません。★数えるだけです（★裁定 §5）。");

// ── ③ ベタ書きの 日本語
//   ★注記を 外した 本文の 中の、★引用符に くるまれた 日本語。
//   ★tx(…) と t("key") の 中は のぞきます。
let bare = 0;
const perFile = [];
files.forEach((rel) => {
  if (rel === path.join("lib", "translations.js")) return;
  let code = readCode(...rel.split(path.sep));
  code = code.replace(/tx\((["'])((?:(?!\1).)*)\1\)/g, "");   // ★tx で 包んだ もの
  const hits = [...code.matchAll(/(["'])((?:(?!\1)[^\\])*[ぁ-んァ-ヶ一-龥][^\\]*?)\1/g)];
  if (hits.length) { bare += hits.length; perFile.push([rel, hits.length]); }
});
console.log("\n③ ベタ書きの 日本語:", bare, "件（★のべ）");
perFile.sort((a, b) => b[1] - a[1]).slice(0, 10)
  .forEach(([f, n]) => console.log(`   ${String(n).padStart(5)}  ${f}`));

// ── ④ tx() の 呼び出し
const tx = (all.match(/\btx\(/g) || []).length;
console.log("\n④ tx() の 呼び出し:", tx, "件");
console.log("   ★出口 ── 2027年3月31日に 0件（★裁定 その11 §2）。");
console.log("   ★11月以降、★週ごとに 減っているか 見ます。");
