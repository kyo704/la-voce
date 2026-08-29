#!/usr/bin/env node
/**
 * 相関の図に出る「要因の名前」（2026-08-30）
 *
 * ★何が起きたか
 *   2026-08-29 の用語の統一（a94dbbf）で、labelResonanceScore を
 *   「声の出来（0〜10）」から「声の調子」に変えました。
 *   labelVoiceQuality も もとから「声の調子」でした。
 *   その結果、★相関の棒グラフに「声の調子」という棒が2本並びました。
 *
 *   この2つは、同じ rep.quality を別のきざみで持ったものです。
 *     voiceQuality   = quality10ToFiveScale(rep.quality)  5段階
 *     resonanceScore = rep.quality                        0〜10
 *   値がほぼ同じなので、棒の長さも近くなります（0.67 と 0.72 など）。
 *   利用者からは「声の調子が自分自身と相関している」ように見えます。
 *
 * ★コミットメッセージは「表示だけ。計算も列名も変えていません」でした。
 *   本当ですが、★図の軸そのものが表示です。表示だけの変更でも図は壊れます。
 *
 * ★この試験は、a94dbbf が入った瞬間に落ちる形にしてあります。
 */
const { readRaw, readCode } = require("./_source");
let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

const vt = readCode("components", "VocalTracker.jsx");
const tr = readRaw("lib", "translations.js");

// FACTORS の (key, labelKey) を読み出す
const block = vt.slice(vt.indexOf("const FACTORS"), vt.indexOf("];", vt.indexOf("const FACTORS")));
const factors = [...block.matchAll(/key: "(\w+)", labelKey: "(\w+)"/g)].map((m) => ({ key: m[1], labelKey: m[2] }));

// 翻訳表から、その鍵の各言語の文字列を取る
function labelsOf(labelKey) {
  const m = tr.match(new RegExp(`\\n  ${labelKey}: \\{([^}]*)\\}`));
  if (!m) return null;
  const out = {};
  for (const mm of m[1].matchAll(/(\w+): "([^"]*)"/g)) out[mm[1]] = mm[2];
  return out;
}

console.log("=== 要因の一覧が読めること ===");
assertTrue(factors.length >= 10, `FACTORS を読み出せた（${factors.length}件）`);
factors.forEach((f) => assertTrue(!!labelsOf(f.labelKey), `${f.key} の名前が翻訳表にある`));

console.log("\n=== ★同じ名前の要因が2つ以上ない（どの言語でも） ===");
// ★日本語だけ見ないこと。英語やドイツ語だけ衝突する、が起こり得ます。
const LANGS = ["ja", "en", "zh", "it", "de", "fr", "es", "ko", "ru"];
LANGS.forEach((lang) => {
  const seen = {};
  factors.forEach((f) => {
    const l = labelsOf(f.labelKey);
    const v = l && l[lang];
    if (!v) return;
    (seen[v] = seen[v] || []).push(f.key);
  });
  const dup = Object.entries(seen).filter(([, keys]) => keys.length > 1);
  assertTrue(dup.length === 0,
    `${lang}：同じ名前の要因が無い${dup.length ? "　★" + dup.map(([v, k]) => `「${v}」= ${k.join(" / ")}`).join("、") : ""}`);
});

console.log("\n=== ★同じ値から作られる2つは、きざみが名前で分かること ===");
// voiceQuality と resonanceScore は同じ rep.quality から作られます。
// 別の棒として並ぶ以上、どちらがどちらか名前で分からなければいけません。
const vq = labelsOf("labelVoiceQuality");
const rs = labelsOf("labelResonanceScore");
assertTrue(vq && rs && vq.ja !== rs.ja, "★日本語で区別できる");
assertTrue(/[0-9０-９]/.test(rs.ja) || /[0-9０-９]/.test(vq.ja),
  "きざみ（5段階 / 0〜10）が名前に入っている");
// 概念の名前そのものは、統一したまま保つこと（用語の統一を巻き戻さない）
assertTrue(vq.ja.includes("声の調子") && rs.ja.includes("声の調子"),
  "★概念の名前は「声の調子」で揃ったまま（統一を巻き戻していない）");
assertTrue(!/声の出来/.test(vq.ja) && !/声の出来/.test(rs.ja),
  "★「声の出来」は復活していない");

console.log("\n=== ★散布図のY軸が、選んだ対象に追従する ===");
assertTrue(!/yLabel=\{t\("labelThroatCondition"\)\}/.test(vt),
  "★Y軸の名前を決め打ちしていない");
assertTrue(/yLabel=\{yLabelForTarget\}/.test(vt), "Y軸は対象から作っている");
["targetPerformance", "targetEase", "targetThroat"].forEach((k) => {
  assertTrue(new RegExp(`t\\("${k}"\\)`).test(vt), `${k} を使い分けている`);
});

console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
process.exit(failCount === 0 ? 0 : 1);
