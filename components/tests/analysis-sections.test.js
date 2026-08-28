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

console.log("\n=== §3-I 散布図（相関を出すとき）===");
{
  const i = ui.indexOf("CorrelationScatter pairs=");
  assertTrue(i > 0, "選んだ項目の散布図を出している");
  const block = ui.slice(i - 900, i + 900);
  console.log("     ★回帰直線を引かない。引いた瞬間に「予測」になり、3ゲートの外に出る。");
  ["回帰", "近似曲線", "trendline", "ReferenceLine", "regression"].forEach((w) => {
    assertTrue(!block.includes(w), `★散布図に「${w}」が無い`);
  });
  assertTrue(/mayStateFinding\(sel\.key\)/.test(block),
    "★探索族には ρ の数値を出さない（図だけ）");
  assertTrue(/EXPLORE_NOTE/.test(block), "探索族には「まだ調べています」とだけ出す");
}

console.log("\n=== §3-G 周期ごとの並び ===");
{
  const i = ui.indexOf("PeriodBands rows=");
  assertTrue(i > 0, "周期を帯と点で並べている");
  const block = ui.slice(i - 1200, i + 700);
  console.log("     ★この図に解釈の文章を添えない。並べれば本人が気づく（§3-G）。");
  ["卵胞", "黄体", "排卵", "月経期"].forEach((w) => {
    assertTrue(!ui.includes(w), `★位相の呼び名「${w}」を書いていない`);
  });
  assertTrue(!/傾向があります|関係があります|影響しています/.test(block),
    "★図に解釈の文章を添えていない");
  assertTrue(/何日目か/.test(block), "横軸が「何日目か」だと書いてある（日付ではない）");
  assertTrue(!ui.includes("cycleGroupStats"),
    "★4分割して平均を比べる古い計算が、残っていない");
}

console.log("\n=== ロック中のカードは1種類（型も見た目も）===");
{
  const impl = (ui.match(/function LockedCard/g) || []).length;
  assertTrue(impl === 1, `★実装は1つだけ（いま ${impl} 個）`);

  console.log("     ★ボタンを1枚だけ足さない。「なぜこれだけ特別なのか」が生まれる。");
  const body = ui.slice(ui.indexOf("function LockedCard"), ui.indexOf("function LockedCard") + 1800);
  // ★aria-label の中の ${action.label} と、描画されるボタンを取り違えないこと。
  //   最初これで誤検出した。見るのは「子要素として描かれているか」。
  assertTrue(!/<button type="button" onClick=\{action\.onClick\}/.test(body),
    "★カードの中に、行き先ボタンを置いていない");
  assertTrue(!/ChevronRight/.test(body), "ボタンの矢印も残っていない");
  assertTrue(/const Tag = action \? "button" : "div"/.test(body),
    "行き先があるときは、カードごと押せる");

  console.log("     ★高さは文字の側が決める。飾りが決めない。");
  assertTrue(/aria-hidden="true" className="absolute inset-0 p-4"/.test(body),
    "★ぼかした飾りが、うしろに回っている（高さを決めていない）");
  assertTrue(!/className="absolute inset-0 flex flex-col/.test(body),
    "★文字の側を absolute で重ねていない（重ねると、飾りの高さで刈られる）");
  assertTrue(/height: "4em"/.test(body) && /width: "0\.6em"/.test(body),
    "飾りの寸法も em（文字と一緒に伸びる）");
  assertTrue(!/height: 64/.test(body), "★px 固定の高さが残っていない");
  assertTrue(/aria-label/.test(body),
    "★見た目は同じでも、支援技術からは辿れる（目に見えない押し場所にしない）");

  console.log("     ★行き先は §5.3 の R3。分析画面から記録画面へ直行する。");
  assertTrue(/jumpToRecordSection\(c\.section\)/.test(ui),
    "該当する記録セクションへ飛ぶ（R3 が消えていない）");
  const calls = (ui.match(/<LockedCard/g) || []).length;
  assertTrue(calls >= 2, `どの一覧でも同じ型を使っている（${calls}箇所）`);
}

console.log(`\n合計: ${passCount}件成功 / ${failCount}件失敗`);
if (failCount > 0) { console.log("\n⚠ 失敗があります。"); process.exit(1); }
console.log("\n✓ すべて成功しました。");
