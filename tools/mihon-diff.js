// ============================================================================
// 動く見本と、いまの 実装を 突き合わせます
//
//   ★出どころ tools/mihon-scan.js（★見本を 読む ところ）
//
//   ★★数えるのは「見本の 言葉が、実装の どこかに あるか」です。
//   ★★見本には、★お名前や 日付などの 見本用の 中身も 入っています。
//     ★それは 実装に 無くて 当たり前です。★下で のぞきます。
// ============================================================================

const fs = require("fs");
const path = require("path");
const { SC, SH, words, moves } = require("./mihon-scan");
const ROOT = path.join(__dirname, "..");

// ★実装の 本文を、★1つに まとめて 読みます。
let all = "";
(function walk(d) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) { if (!/^(tests|node_modules|\.next)$/.test(f.name)) walk(p); }
    else if (/\.(js|jsx)$/.test(f.name)) all += fs.readFileSync(p, "utf8") + "\n";
  }
})(path.join(ROOT, "components"));
["lib", "app"].forEach((d) => (function walk(x) {
  for (const f of fs.readdirSync(x, { withFileTypes: true })) {
    const p = path.join(x, f.name);
    if (f.isDirectory()) walk(p);
    else if (/\.(js|jsx)$/.test(f.name)) all += fs.readFileSync(p, "utf8") + "\n";
  }
})(path.join(ROOT, d)));

// ★★見本用の 中身らしい 言葉は、のぞきます。
//   ★お名前・学校名・曲名・先生の 名前など。★実装に 無くて 当たり前です。
const SAMPLE = /^(高木|井上|青木|柴田|黒田|服部|大西|斎藤|三浦|小林|田中|渡辺|佐藤|田村|坂本|山田|鈴木|加藤|中村|伊藤|松本|木村|林|清水)/;
const SAMPLEWORD = /ラ・ボエーム|冬の旅|からたちの花|プッチーニ|シューベルト|山田耕筰|ミミ|○○|第1ホール|音楽大学|声楽科/;

function isSample(w) {
  if (SAMPLE.test(w) || SAMPLEWORD.test(w)) return true;
  if (/^\d+$/.test(w)) return true;
  if (/^[0-9０-９]{1,2}[月日時分]/.test(w) && w.length <= 6) return true;
  return false;
}

const rows = [];
for (const [name, body] of SC) {
  const ws = words(body).filter((w) => !isSample(w));
  const miss = ws.filter((w) => !all.includes(w));
  rows.push({ name, total: ws.length, miss });
}
rows.sort((a, b) => (a.total ? a.miss.length / a.total : 0) - (b.total ? b.miss.length / b.total : 0));

let done = 0, part = 0, none = 0;
console.log("画面ごとの 突き合わせ（★見本の 言葉が、実装に あるか）\n");
for (const r of rows.slice().reverse()) {
  const pct = r.total ? Math.round((1 - r.miss.length / r.total) * 100) : 100;
  const mark = pct >= 90 ? "◎" : pct >= 50 ? "○" : pct > 0 ? "△" : "×";
  if (pct >= 90) done++; else if (pct > 0) part++; else none++;
  console.log(`${mark} ${String(pct).padStart(3)}%  ${r.name}  （${r.total - r.miss.length}/${r.total}）`);
  if (pct < 90 && r.miss.length) {
    console.log("       無い言葉: " + r.miss.slice(0, 12).join(" ／ ")
      + (r.miss.length > 12 ? ` …ほか${r.miss.length - 12}` : ""));
  }
}
console.log(`\n◎ ${done} ／ △○ ${part} ／ × ${none}　（合計 ${rows.length} 画面）`);
