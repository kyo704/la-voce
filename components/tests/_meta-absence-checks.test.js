// ============================================================================
// ★見張りの 見張り ── ★「無いこと」を、★生の本文で 数えていないか
//
//   ★出どころ 坂本さんの ご指摘（2026-09-10）
//     「★『注記で、禁じた語を、数えていた』という、同じ種類の誤りが、
//       ★今日、9回、発生しています。★なぜ、この、パターンが、
//       ★繰り返されるのか、★根本的な原因を、1度、振り返ってみてください」
//
// ---------------------------------------------------------------------------
// ★★なぜ 繰り返すのか（★調べて 分かったこと）
//
//   ★★① 2つの 読み方が、★見た目が そっくりで、★どちらでも 通る。
//     readRaw  … 生のまま。★構えを 見るとき（並び・書き方・位置）
//     readCode … 注記を 外す。★「無いこと」を 数えるとき
//     ★★1文字ちがいで、★どちらも 文字列を 返します。★取りちがえても 動きます。
//
//   ★★② 1つの 見張りが、★1つの 変数を 使い回す。
//     ★たいてい 頭で const ui = readRaw(...) と 1度 書き、
//     ★★下の ぜんぶで それを 使います。
//     ★あとから「この語が 無いこと」を 足すとき、★すぐ 横の ui を 使います。
//     ★★そこで 取りちがえが 起きます。★足した 本人は 気づけません。
//
//   ★★③ 禁じた語は、★かならず 注記に 書いてある。
//     ★「★『あと◯日』と 書かないこと」と 註に 書きます。★それが 当たります。
//     ★★つまり、★禁じれば 禁じるほど、★当たりやすく なります。
//     ★★_source.js の 頭に、★この 罠は 既に 書かれていました。
//       ★書いてあっても、★読む 場所と 書く 場所が ちがえば 効きません。
//
//   ★★④ だから、★注意では 止まりません。★仕掛けで 止めます。
//     ★この 見張りが、★「無いこと」の 数えに 生の本文を 使っている 所を
//     ★機械的に 見つけます。
// ---------------------------------------------------------------------------

const fs = require("fs");
const path = require("path");

const DIR = __dirname;
let failed = 0;
function ok(cond, label) {
  if (cond) { console.log("  ok  " + label); }
  else { console.log("  NG  " + label); failed++; }
}

const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".test.js"));

console.log("① 「無いこと」の 数えに、★生の本文を 使っていないか");
const bad = [];
files.forEach((f) => {
  const src = fs.readFileSync(path.join(DIR, f), "utf8");
  // ★★生のまま 読んだ 変数を 集めます。
  const rawVars = new Set();
  const codeVars = new Set();
  [...src.matchAll(/const\s+([A-Za-z_$][\w$]*)\s*=\s*readRaw\(/g)].forEach((m) => rawVars.add(m[1]));
  [...src.matchAll(/const\s+([A-Za-z_$][\w$]*)\s*=\s*fs\.readFileSync\(/g)].forEach((m) => rawVars.add(m[1]));
  [...src.matchAll(/const\s+([A-Za-z_$][\w$]*)\s*=\s*readCode\(/g)].forEach((m) => codeVars.add(m[1]));
  if (rawVars.size === 0) return;

  src.split("\n").forEach((line, i) => {
    // ★★この ファイル自身の 註は 数えません。
    if (/^\s*(\/\/|\*)/.test(line)) return;
    rawVars.forEach((v) => {
      // ★「!変数.includes(」／「!/…/.test(変数)」── ★どちらも「無いこと」の 形です。
      const neg1 = new RegExp("!\\s*" + v.replace(/\$/g, "\\$") + "\\.includes\\(([^)]*)\\)");
      const neg2 = new RegExp("!\\s*/([^/\\n]+)/[a-z]*\\.test\\(\\s*" + v.replace(/\$/g, "\\$") + "\\s*\\)");
      const hit = neg1.exec(line) || neg2.exec(line);
      // ★★探している ものが 日本語なら、★注記に かならず 書いてあります。
      //   ★★禁じた語は、★「こう 書かないこと」と 註に 引用されるからです。
      //   ★★今日の 9件は、★ぜんぶ この 形でした。
      //   ★★英字だけ（★関数名・書き方の 形）は、★注記に 出ることも ありますが、
      //     ★禁じた語の ように「かならず 出る」訳では ありません。★ここでは 見ません。
      if (hit && /[ぁ-んァ-ヶ一-龥]/.test(hit[1] || "")) {
        bad.push(f + ":" + (i + 1) + "  " + line.trim().slice(0, 90));
      }
    });
  });
});
// ★★いま 残っている 数（★2026-09-10 に 数えたもの）。
//
//   ★★28か所 ありました。★どれも「まだ 当たっていない」だけです。
//     ★その 語を 注記に 書いた 日に、★落ちます。
//   ★★いっぺんに 直すのは 危ないので、★「増やさない」形に します。
//     ★減らすのは いつでも できます。★増やすと、★ここが 落ちます。
//   ★★直したら、★この 表から その 行を 減らしてください。
const BASELINE = {
"record-v2.test.js": 5,
  "teacher-org-card.test.js": 3,
  "vocal-dose.test.js": 1,
  "start-flow.test.js": 1,
  "repertoire-identity.test.js": 1,
  "reflux-care.test.js": 1,
  "org-roster.test.js": 1,
  "notes.test.js": 1,
  "minor-docs-reconciled.test.js": 1,
  "lesson-tab.test.js": 1,
  "legal-copy-matches-source.test.js": 1,
  "learn-study.test.js": 1,
  "invitation-consent.test.js": 1,
  "free-tier-wording.test.js": 1,
  "export-summary.test.js": 1,
  "entitlements.test.js": 1,
  "core-fields-no-block.test.js": 1,
  "consent-gate.test.js": 1,
  "compare-groups.test.js": 1,
  "analysis-families.test.js": 1,
  "analysis-core.test.js": 1,
  "a03-kiroku.test.js": 1,
};

const byFile = {};
bad.forEach((b) => {
  const f = b.split(":")[0];
  byFile[f] = (byFile[f] || 0) + 1;
});
const grown = Object.keys(byFile)
  .filter((f) => byFile[f] > (BASELINE[f] || 0))
  .map((f) => f + "（いま " + byFile[f] + " ／ 前は " + (BASELINE[f] || 0) + "）");
ok(grown.length === 0,
  "★生の本文で「無いこと」を 数えている 所が、★増えていない"
  + (grown.length ? "\n      " + grown.join("\n      ")
      + "\n      ★★readCode（注記を 外した 本文）で 数えてください。"
      + "\n      ★禁じた語は、★かならず 注記に 引用されています。" : ""));

// ★★減ったら、★表を 減らしてください、と 言います。★放っておくと 増えます。
const shrunk = Object.keys(BASELINE).filter((f) => (byFile[f] || 0) < BASELINE[f]);
ok(shrunk.length === 0,
  shrunk.length === 0
    ? "★表と、いまの数が 合っている"
    : "★減りました。★BASELINE から 減らしてください：\n      "
      + shrunk.map((f) => f + "（いま " + (byFile[f] || 0) + " ／ 表は " + BASELINE[f] + "）").join("\n      "));

console.log("② 罠が、★1か所に 書いてある");
const srcHelper = fs.readFileSync(path.join(DIR, "_source.js"), "utf8");
ok(/readCode/.test(srcHelper) && /readRaw/.test(srcHelper), "★2つの 読み方が ある");
ok(/コメントを外した本文/.test(srcHelper) || /禁止語/.test(srcHelper),
  "★どちらを 使うかが 書いてある");

console.log(failed === 0 ? "\n全て ok" : "\n" + failed + "件 NG");
process.exit(failed === 0 ? 0 : 1);
