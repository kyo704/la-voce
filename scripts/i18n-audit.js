#!/usr/bin/env node
/**
 * 多言語対応の棚卸し（多言語対応（伊英中）.md Day 1）
 *
 * ★数えるだけです。1文字も書き換えません。
 *
 * 仕様書に書いた「約1,389箇所」は、同じ日に正規表現でざっと数えた
 * 見積もりです。画面ごとの内訳（約468）と合いませんでした。
 * この道具で、その差がどこから来ているのかまで出します。
 *
 * 分類:
 *   stored   ★保存される値。訳してはいけない（lib/storedValues.js）
 *   display  画面に出る文字。t() に通す対象
 *   code     開発者にしか見えないもの（console・エラー・キー名など）
 */
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");

const JP = /[ぁ-ゟ゠-ヿ一-鿿]/;

// lib/storedValues.js から、訳してはいけない語を読む（★写さない）
// ★正規表現で拾うと、説明文（STORED_IN）まで語として数えてしまいます。
//   実際に23語と誤って数えました。モジュールとして読み込みます。
let STORED = [];
async function loadStored() {
  const src = fs.readFileSync(path.join(ROOT, "lib", "storedValues.js"), "utf-8");
  const m = await import("data:text/javascript;base64," + Buffer.from(src, "utf-8").toString("base64"));
  STORED = m.STORED_JAPANESE;
}

const TARGETS = [
  ["components", "VocalTracker.jsx"],
  ["components", "SignupForm.jsx"],
  ["components", "CharacterHome.jsx"],
  ["components", "HealthInfo.jsx"],
  ["app", "login", "page.js"],
  ["app", "page.js"]
];

// ★対象外（仕様書 §1）。教室と学ぶの本文には触れません。
const OUT_OF_SCOPE = /teacher|classroom|org|lesson|enrollment|membership/i;

function stripComments(src) {
  let out = "", i = 0, mode = null;
  while (i < src.length) {
    const two = src.slice(i, i + 2);
    if (!mode && two === "//") { mode = "line"; i += 2; continue; }
    if (!mode && two === "/*") { mode = "block"; i += 2; continue; }
    if (mode === "line" && src[i] === "\n") { mode = null; out += "\n"; i++; continue; }
    if (mode === "block" && two === "*/") { mode = null; i += 2; continue; }
    if (!mode) out += src[i];
    else if (src[i] === "\n") out += "\n";
    i++;
  }
  return out;
}

function classify(text, line) {
  if (STORED.includes(text.trim())) return "stored";
  if (/console\.(log|warn|error)|throw new|catch\s*\(/.test(line)) return "code";
  return "display";
}

async function main() {
await loadStored();

let grand = { stored: 0, display: 0, code: 0 };
const perFile = [];

for (const parts of TARGETS) {
  const p = path.join(ROOT, ...parts);
  if (!fs.existsSync(p)) continue;
  const raw = fs.readFileSync(p, "utf-8");
  const code = stripComments(raw);
  const lines = code.split("\n");
  const counts = { stored: 0, display: 0, code: 0 };
  const samples = [];

  lines.forEach((line, idx) => {
    if (OUT_OF_SCOPE.test(line)) return;
    const found = [];
    // 文字列リテラル
    for (const m of line.matchAll(/"([^"\n]{1,120})"|'([^'\n]{1,120})'|`([^`\n]{1,120})`/g)) {
      const t = m[1] || m[2] || m[3];
      if (t && JP.test(t)) found.push(t);
    }
    // JSX のテキスト
    for (const m of line.matchAll(/>\s*([^<>{}\n]{1,120}?)\s*</g)) {
      if (JP.test(m[1])) found.push(m[1]);
    }
    found.forEach((t) => {
      const kind = classify(t, line);
      counts[kind]++;
      grand[kind]++;
      if (kind === "display" && samples.length < 3) samples.push(`${idx + 1}: ${t.slice(0, 40)}`);
    });
  });
  perFile.push({ file: parts.join("/"), ...counts, samples });
}

console.log("多言語対応の棚卸し（★数えただけ。何も変更していません）\n");
console.log("ファイル                              訳す  ★訳さない  開発用");
perFile.forEach((f) => {
  console.log(`  ${f.file.padEnd(34)} ${String(f.display).padStart(5)} ${String(f.stored).padStart(9)} ${String(f.code).padStart(7)}`);
});
console.log(`  ${"合計".padEnd(34)} ${String(grand.display).padStart(5)} ${String(grand.stored).padStart(9)} ${String(grand.code).padStart(7)}`);
console.log(`\n★「訳す」= t() に通す対象。これが本当の作業量です。`);
console.log(`★「訳さない」= lib/storedValues.js に載っている保存される値（${STORED.length}語）。`);
console.log(`★「開発用」= console やエラー。利用者には見えません。`);

  // ── 画面の中と外の内訳（仕様書の 468 と 1,266 の差を説明する）──
  const vt = stripComments(fs.readFileSync(path.join(ROOT, "components", "VocalTracker.jsx"), "utf-8"));
  const vlines = vt.split("\n");
  const marks = [];
  vlines.forEach((l, i) => { const m = l.match(/activeTab === "(\w+)"/); if (m) marks.push([i, m[1]]); });
  const firstTab = marks.length ? marks[0][0] : vlines.length;
  const lastTab = vlines.length;
  let inside = 0, outside = 0;
  vlines.forEach((line, idx) => {
    if (OUT_OF_SCOPE.test(line)) return;
    let n = 0;
    for (const m of line.matchAll(/"([^"\n]{1,120})"|'([^'\n]{1,120})'|`([^`\n]{1,120})`/g)) {
      const t = m[1] || m[2] || m[3];
      if (t && JP.test(t) && classify(t, line) === "display") n++;
    }
    for (const m of line.matchAll(/>\s*([^<>{}\n]{1,120}?)\s*</g)) {
      if (JP.test(m[1]) && classify(m[1], line) === "display") n++;
    }
    if (idx < firstTab) outside += n; else inside += n;
  });
  console.log("\n── 仕様書の見積もりとの差 ──");
  console.log(`  画面の中（activeTab より下・行${firstTab}〜）: ${inside}`);
  console.log(`  画面の外（上部の関数・選択肢の一覧など）    : ${outside}`);
  console.log("  ★差の正体はこれです。分析の文章を組み立てる関数や、");
  console.log("    選択肢の一覧が、JSX の外に置かれているためです。");
  console.log("    Day 5（分析）が重い理由でもあります。");
}
main();
