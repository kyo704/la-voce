#!/usr/bin/env node
/**
 * 分析タブの節見出し（作業中の状態 §5.10）。
 *
 * ★中身が1つも無い節は、見出しごと消える。
 *   見出しだけが残ると、空のカードが上に居座っているように見えます。
 *
 * ★節ごとに条件を並べるやり方をやめた、という検査です。
 *   カードが増えるたびに条件を足す形だと、足し忘れて同じ不具合が戻ります。
 *   「子が0件なら節ごと消す」を CSS に1回だけ書いています。
 */
const { readRaw, stripComments } = require("./_source");
let passCount = 0, failCount = 0;
function assertTrue(c, label) {
  if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; }
}

const ui = stripComments(readRaw("components", "VocalTracker.jsx"));
const css = readRaw("app", "globals.css");

console.log("\n=== 分析タブの節見出し ===");

// 6つの節すべてに印が付いていること
const HEADS = ["groupHeaderVoice", "groupHeaderBody", "sectionMental", "groupHeaderOverall",
  "groupHeaderPerformance", "groupHeaderEnvironment"];
const marked = (ui.match(/analysis-section-head/g) || []).length;
assertTrue(marked === HEADS.length,
  `★6つの節すべてに印が付いている（いま ${marked} 個）`);

HEADS.forEach((k) => {
  // ★最初に見つかった1つで判断しない。sectionMental は記録画面のカード名
  //   としても使われていて、そちらが先に出てくる。h2 の側だけを見る。
  const i = ui.indexOf(`<h2 className="ff-display italic text-xl mb-1" style={{ color: C.ink }}>{t("${k}")}`);
  if (i < 0) { assertTrue(false, `${k} の見出しが見つからない`); return; }
  const before = ui.slice(Math.max(0, i - 260), i);
  assertTrue(/analysis-section-head/.test(before), `${k} の節に印が付いている`);
});

console.log("     ★消す判断は CSS に1回だけ書く（節ごとに条件を並べない）。");
assertTrue(/\.analysis-section-head:has\(\+ \.analysis-section-head\)/.test(css),
  "見出しの次がまた見出しなら、その節は空だと判定している");
assertTrue(/\.analysis-section-head:last-child/.test(css),
  "見出しが最後の要素なら、その節は空だと判定している");
assertTrue(/display: none/.test(css.slice(css.indexOf(".analysis-section-head"))),
  "空の節を消している");

console.log(`\n合計: ${passCount}件成功 / ${failCount}件失敗`);
if (failCount > 0) { console.log("\n⚠ 失敗があります。"); process.exit(1); }
console.log("\n✓ すべて成功しました。");
