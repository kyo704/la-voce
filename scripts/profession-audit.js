#!/usr/bin/env node
/**
 * 職業に依存しているもの、全部の棚卸し（職業を声の型で切り直す.md）。
 *
 * ★これは棚卸しです。何も変えません。
 *   ブランド改名 Phase 0 と同じ形で、表を出してから止まります。
 *
 * 3つの型（歌う / 話す / 通す）へ、どれがどう対応するのかを
 * 人が判断できる材料を並べるのが目的です。
 */
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");

const FILES = [
  "components/VocalTracker.jsx", "components/CharacterHome.jsx",
  "lib/learnContent.js", "lib/fieldGroups.js", "lib/analysisCardVisibility.js",
  "lib/featureFlags.js", "lib/translations.js", "lib/analysisFamilies.js",
  "app/page.js", "app/login/page.js", "components/SignupForm.jsx",
  "components/ProfileFieldGroups.jsx"
].filter((f) => fs.existsSync(path.join(ROOT, f)));

const KEYS = ["singer", "announcer", "voice_actor", "pop_musical"];

// 何を数えるか。分類ごとに、意味が違います。
const KINDS = [
  { key: "職業で分岐", re: /vocal_profession|effectiveProfessions|professions\.includes|isAnalysisCardVisible/ },
  { key: "職業キー直書き", re: new RegExp(`["'](${KEYS.join("|")})["']`) },
  { key: "職業名の表示", re: /PROFESSION_LABELS|声楽家|アナウンサー|声優|ポップス|ミュージカル/ },
  { key: "職業別の記事", re: /professions:\s*\[/ }
];

const rows = [];
FILES.forEach((rel) => {
  const text = fs.readFileSync(path.join(ROOT, rel), "utf-8");
  text.split("\n").forEach((line, i) => {
    if (/^\s*(\/\/|\*)/.test(line)) return;   // コメントは数えない
    KINDS.forEach((k) => {
      if (k.re.test(line)) rows.push({ rel, line: i + 1, kind: k.key, text: line.trim().slice(0, 88) });
    });
  });
});

console.log("職業に依存しているもの（★置き換えていません。表を出すだけです）\n");

const byKind = {};
rows.forEach((r) => { (byKind[r.kind] = byKind[r.kind] || []).push(r); });
Object.entries(byKind).forEach(([kind, list]) => {
  const files = {};
  list.forEach((r) => { files[r.rel] = (files[r.rel] || 0) + 1; });
  console.log(`━━ ${kind}（${list.length}箇所）`);
  Object.entries(files).sort((a, b) => b[1] - a[1]).forEach(([f, n]) => {
    console.log(`     ${String(n).padStart(4)}  ${f}`);
  });
  console.log("");
});

// 職業キーごとの出現数（どれが重いか）
console.log("━━ 職業キーごとの出現数");
KEYS.forEach((k) => {
  let n = 0;
  FILES.forEach((rel) => {
    const t = fs.readFileSync(path.join(ROOT, rel), "utf-8");
    n += (t.match(new RegExp(`["']${k}["']`, "g")) || []).length;
  });
  console.log(`     ${String(n).padStart(4)}  ${k}`);
});

console.log("\n★この表を見てから、3つの型への対応を決めてください（§2）。");
console.log("★「その他」は1つのまま（作業中の状態 §5.15）。11に分けないこと。");
