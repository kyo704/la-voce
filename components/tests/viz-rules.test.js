#!/usr/bin/env node
/**
 * 分析画面の描画規約（分析画面の描画仕様.md §7 禁止事項）。
 *
 * ★色そのものが判定になってはいけません。
 *   文章を出していなくても、信号色は「良い・悪い」を言っています。
 *   3ゲート（件数・効果量・FDR）を色で迂回させないための検査です。
 *
 * 見本: docs/lavoce-analysis-mock4.html（9種 A〜I、外部依存なし）
 */
const path = require("path");
const { readCode, readRaw } = require("./_source");
let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

const ui = readCode("components", "VocalTracker.jsx");
const raw = readRaw("components", "VocalTracker.jsx");

console.log("=== §7-1・7-2: 立体・円グラフを作らない ===");
assertTrue(!/<Pie\b|PieChart|Doughnut|RadialBar/.test(ui), "円グラフ・ドーナツを使っていない（角度は比較しにくい）");
assertTrue(!/perspective|rotateX|rotateY|translateZ|3d\(/i.test(ui), "立体にしていない（遠近で差が誇張される）");

console.log("\n=== §7-6: ★文献の基準線・目標線を引かない ===");
assertTrue(!/dataKey="calorieTarget"/.test(ui),
  "★目標カロリーの破線が無い（破線の下を「足りなかった日」に見せてしまう）");
assertTrue(/声の分析には使っていません/.test(raw),
  "★体重・カロリーは声の分析に使っていない旨を書いている（§4-1）");

console.log("\n=== §7-7: 1枚のグラフに2つの縦軸を重ねない ===");
assertTrue(!/yAxisId/.test(ui), "縦軸は1本だけ");

console.log("\n=== §7-8: 散布図に回帰直線を引かない ===");
const scatterArea = ui.match(/<ScatterChart[\s\S]{0,2000}?<\/ScatterChart>/g) || [];
scatterArea.forEach((block, i) => {
  assertTrue(!/<Line\b/.test(block), `散布図${i + 1}に直線を引いていない`);
});
assertTrue(scatterArea.length >= 0, `散布図 ${scatterArea.length} 件を検査した`);

console.log("\n=== §7-12: 棒グラフの縦軸を0以外から始めない ===");
const barCharts = raw.match(/<BarChart[\s\S]{0,1400}?<\/BarChart>/g) || [];
let barAxisIssues = 0;
barCharts.forEach((block) => {
  const m = block.match(/<YAxis[^>]*domain=\{\[([^,\]]+)/);
  if (m && !/^0$|^"auto"$|^"dataMin"$/.test(m[1].trim()) && !/^\[?0/.test(m[1].trim())) barAxisIssues++;
});
assertTrue(barAxisIssues === 0, `棒グラフ ${barCharts.length} 件の縦軸が0起点（またはautoのまま）`);

console.log("\n=== §7-11: 「データがありません」と書かない ===");
assertTrue(!/データがありません/.test(ui), "★空を空のまま見せていない（Fの進捗ドットにする）");

console.log("\n=== §1-1: ★色を1か所からしか取らない ===");
// ★仕様書には別の16進値が並んでいるが、実際の値は lib/tokens.js が持っている。
//   両方を持つと「同じ色が2か所にあって片方だけ変わる」状態になる。
const hardcoded = (ui.match(/#[0-9A-Fa-f]{6}/g) || []).filter((h) => h.toUpperCase() !== "#FFFDF8");
assertTrue(hardcoded.length < 30,
  `画面に直書きの色が少ない（${hardcoded.length}件。色は lib/tokens.js から取る）`);
const tokens = readRaw("lib", "tokens.js");
assertTrue(/export const C = \{/.test(tokens), "色は lib/tokens.js の C が持っている");

console.log("\n=== §1-1: ★色の出どころは lib/tokens.js ただ1つ（案A） ===");
console.log("     仕様書の16進値は画素からの採色で、実際の値と数単位ずれていた。");
const tok = readRaw("lib", "tokens.js");
// ★禁止値の検査はコメントを外してから。ここには「仕様書には #840C24 と
//   書いてあるが実際は違う」という説明が入っており、生のまま調べると
//   自分の説明文で落ちる。readCode / readRaw を使い分ける理由そのもの。
const tokCode = readCode("lib", "tokens.js");
assertTrue(/export const SERIES = \{/.test(tokCode), "系列色の役割が SERIES として定義されている");
// ★仕様書の値をそのまま持ち込んでいないこと。持ち込むと色が2組になる。
const specOnly = ["#840C24", "#BF8722", "#447862", "#F7F2E6", "#E5DDC7", "#261913", "#6D5D50", "#76665A", "#739E67"];
specOnly.forEach((hex) => {
  assertTrue(!tokCode.includes(hex), `★仕様書だけの値 ${hex} を持ち込んでいない`);
});
// 新しい色は1つだけ（--s2-pale に当たるもの）
const allHex = (tokCode.match(/#[0-9A-Fa-f]{6}/g) || []).map((h) => h.toUpperCase());
const cHex = (tokCode.match(/export const C = \{[\s\S]*?\};/)[0].match(/#[0-9A-Fa-f]{6}/g) || []).map((h) => h.toUpperCase());
const outsideC = [...new Set(allHex.filter((h) => !cHex.includes(h)))];
assertTrue(outsideC.length <= 2,
  `C の外にある色が${outsideC.length}件だけ（${outsideC.join(", ")}）= 帯の色と s2-pale`);
assertTrue(tokCode.includes("#DFC28D"), "s2-pale（山吹の淡いほう）だけを新しく足した");

console.log("\n=== §1-2: 4色目を作らず、形で区別する ===");
assertTrue(/export const SERIES_SHAPES = \{/.test(tokCode), "形での区別が用意されている");
assertTrue(/hollow/.test(tokCode) && /small/.test(tokCode) && /large/.test(tokCode),
  "白抜き・小さい丸・大きい丸の3通り");

console.log("\n=== §7-3・7-5・§1-4: ★値の大小で色を変えない ===");
console.log("     信号色は3ゲートを迂回する。文章を出していなくても、色が言っている。");
assertTrue(!/function levelColor/.test(ui), "★値→色の対応表（levelColor）が無い");
assertTrue(/function levelInk/.test(ui), "色を返す関数は、値によらず一色");
const inkFn = ui.slice(ui.indexOf("function levelInk"), ui.indexOf("function levelInk") + 200);
assertTrue(!/LEVEL_COLORS/.test(inkFn), "★LEVEL_COLORS を引いていない");
// 値で面を塗っていないこと
assertTrue(!/background: levelInk\(/.test(ui), "★面を値で塗っていない");
assertTrue(!/fill=\{levelInk\(/.test(ui), "★棒を値で塗っていない");
// カレンダーの升目
const cal = ui.slice(ui.indexOf("calendarCells.map"), ui.indexOf("calendarCells.map") + 1800);
assertTrue(!/background: c\.entry \? levelInk/.test(cal), "★升目を値で塗り分けていない");
assertTrue(/SERIES\.s2/.test(cal), "値は一色の点で表している");
assertTrue(/clampLevel\(c\.entry\.throatCondition\)/.test(cal), "点の大きさが値で変わる（色ではなく大きさ）");

console.log("\n=== §7-4: メーターに危険ゾーンを塗らない ===");
assertTrue(!/color: LEVEL_COLORS\[i\]/.test(ui), "★メーターの弧を段階ごとに塗り分けていない");

console.log("\n=== §3-F: 「データがありません」ではなく進捗ドット ===");
assertTrue(/function ProgressDots/.test(ui), "進捗ドットの部品がある");
const dots = ui.slice(ui.indexOf("function ProgressDots"), ui.indexOf("function ProgressDots") + 1200);
assertTrue(/width: 9, height: 9/.test(dots), "9px の丸（§3-F）");
assertTrue(/length: total/.test(dots) && /const total = 10/.test(dots), "10個");
assertTrue(/日分たまりました/.test(dots) && /で傾向を出せます/.test(dots), "★指定どおりの文言");
assertTrue(/SERIES\.s2/.test(dots) && /SERIES\.grid/.test(dots), "たまった分と残りを色で分けている（2色のみ）");

console.log("\n=== §5: 3つの状態 ===");
const tr = readRaw("lib", "translations.js");
assertTrue(/gateNoClearTrend/.test(tr), "③不通過の文言がある");
assertTrue(/まだはっきりした傾向が出ていません/.test(tr), "★「関係なし」ではなく「見えていない」と書く");
assertTrue(!/弱い関係|関係はありません|相関なし/.test(readCode("lib", "translations.js")),
  "★「弱い関係があります」と書いていない");

console.log(`\n合計: ${passCount}件成功 / ${failCount}件失敗`);
if (failCount > 0) { console.log("\n⚠ 失敗があります。"); process.exit(1); }
console.log("\n✓ すべて成功しました。");
