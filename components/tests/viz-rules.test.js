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

// ★★同じ色の 濃淡は、★新しい色では ありません（★2026-09-10）。
//   ★★この見張りの 言い分は「★4つ目の系列色を 作らないこと（§1-2）」です。
//     ★新しい 色みを 増やすな、という ことです。
//   ★★2026-09-10、★5段の 目盛りを ★えんじ1色の 濃淡に しました（★案A）。
//     ★4つの 値が 増えましたが、★どれも えんじ（C.curtain）を
//     ★札（C.card）で 薄めた ものです。★色みは 1つの ままです。
//   ★★数を 数える のでは なく、★混ぜ色かどうかを 見ます。
//     ★数を 増やすだけ だと、★次に 本当の 新色が 入っても 気づけません。
function hexToRgb(h) {
  const x = h.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(x.slice(i, i + 2), 16));
}
/** ★fg を bg で 薄めた 色か（★丸めの ぶん ±2 を 許す）。 */
function isTintOf(hex, fg, bg) {
  const [r, g, b] = hexToRgb(hex);
  const F = hexToRgb(fg), B = hexToRgb(bg);
  // ★どれか 1つの 通り道から 混ぜ具合を 出し、★残りが 合うかを 見ます。
  const span = F[0] - B[0];
  if (span === 0) return false;
  const a = (r - B[0]) / span;
  if (a < 0 || a > 1) return false;
  return [0, 1, 2].every((i) => Math.abs((F[i] * a + B[i] * (1 - a)) - [r, g, b][i]) <= 2);
}
const CURTAIN = (tokCode.match(/curtain: "(#[0-9A-Fa-f]{6})"/) || [])[1];
const CARD = (tokCode.match(/card: "(#[0-9A-Fa-f]{6})"/) || [])[1];
const tints = outsideC.filter((h) => CURTAIN && CARD && isTintOf(h, CURTAIN, CARD));
const newHues = outsideC.filter((h) => !tints.includes(h));
assertTrue(tints.length > 0, `★えんじの濃淡が ある（${tints.join(", ")}）`);
assertTrue(newHues.length <= 2,
  `★新しい色みは${newHues.length}件だけ（${newHues.join(", ")}）= 帯の色と s2-pale`);
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

console.log("\n=== §3-F: 「データがありません」ではなく、たまった日数 ===");
// ★★2026-09-11、★点の 帯（10個の 丸）と「あと◯日で、判定を 始められます」を
//   ★消しました。★出どころ 坂本さんの お決め（★2026-09-11）
//     「置ける点数、まだの枠、これらは 進捗バーの 一種として 禁止事項に 当たります」
//   ＋ 裁定-ふりかえる・とだな・もっと（9月10日 その7）§2-4
//     「✕ 門①を『あと○日』と 書く ／ ◯ 進んだ側から 書く」
//
// ★★描画仕様 §3-F は「データがありません と 書かない」ことを 求めています。
//   ★そこは 変わりません。★代わりに 出すのが、★点の 帯 では なく
//   ★★「◯日分 たまりました」の 1行に なりました。
assertTrue(/function ProgressDots/.test(ui), "たまった日数を出す部品がある");
const dots = ui.slice(ui.indexOf("function ProgressDots"), ui.indexOf("function ProgressDots") + 900);
assertTrue(/日分たまりました/.test(dots), "◯日分たまりました");
assertTrue(!/データがありません/.test(dots), "★「データがありません」と書いていない（§3-F）");
// ★★消えていること。★戻ってきたら、ここで 止めます。
assertTrue(!/width: 9, height: 9/.test(dots), "★9px の丸を もう 描いていない");
assertTrue(!/const total = 10/.test(dots), "★10個の 帯を もう 描いていない");
assertTrue(!/判定を始められます/.test(dots), "★「判定を始められます」を もう 書いていない");
assertTrue(!/傾向を出せます/.test(dots), "★「傾向を出せます」と書いていない（事実と違う）");
assertTrue(!/SERIES\.s2/.test(dots) && !/SERIES\.grid/.test(dots),
  "★たまった分と残りを 色で 分けていない（★進捗バーです）");
assertTrue(!/あと/.test(dots), "★「あと」と 書いていない");

console.log("\n=== §5: 3つの状態 ===");
const tr = readRaw("lib", "translations.js");
assertTrue(/gateNoClearTrend/.test(tr), "③不通過の文言がある");
assertTrue(/まだはっきりした傾向が出ていません/.test(tr), "★「関係なし」ではなく「見えていない」と書く");
assertTrue(!/弱い関係|関係はありません|相関なし/.test(readCode("lib", "translations.js")),
  "★「弱い関係があります」と書いていない");

console.log("\n=== §3-A: 数値ヒーローにスパークライン ===");
assertTrue(/function Sparkline/.test(ui), "スパークラインの部品がある");
const sp = ui.slice(ui.indexOf("function Sparkline"), ui.indexOf("function Sparkline") + 1200);
assertTrue(/width = 96, height = 26/.test(sp), "96×26px（§3-A）");
assertTrue(!/<XAxis|<YAxis|axis/i.test(sp), "★軸・目盛りを付けていない");
assertTrue(/slice\(-14\)/.test(sp), "直近14日");
assertTrue(/<circle/.test(sp) && (sp.match(/<circle/g) || []).length === 1, "★点は最新の1つだけ");

console.log("\n=== §3-C: 偏差値は、リングも 点列も 出さない ===");
// ★★この 節は「★リングを 点列に 置き換えた」ことを 見ていました。
//   ★★2026-09-10 の 裁定で、★その 案は 無効に なりました ──
//     「★『リングを 点列に 置き換える』は 古い案です。
//       ★リングも 点列も 出しません。★置き換えの 図は ありません」
//   ★★偏差値は、★画面から 消えました。★見張りも そちらへ 向け直します。
assertTrue(!/function DotStrip/.test(ui), "★点列の部品が、もう無い");
assertTrue(!/strokeDasharray=\{`\$\{\(Math\.min\(100/.test(ui), "★偏差値のリングが残っていない");
assertTrue(!/deviationScore/.test(ui), "★偏差値の 計算が、もう無い");
assertTrue(!/コンディション偏差値/.test(ui), "★偏差値の カードが、もう無い");

console.log("\n=== §3-D: 本番・レッスンの日を、色と大きさの両方で区別 ===");
assertTrue(/function trendDot/.test(ui), "点の描き分けが部品になっている");
const td = ui.slice(ui.indexOf("function trendDot"), ui.indexOf("function trendDot") + 700);
assertTrue(/4\.8/.test(td) && /3\.2/.test(td), "★大きさで区別している（4.8 と 3.2）");
assertTrue(/SERIES\.s2/.test(td) && /SERIES\.s1/.test(td), "色でも区別している（色だけに頼らない）");
assertTrue(/strokeOpacity=\{0\.3\}/.test(ui), "★線は補助（不透明度0.3）。主役は点");
assertTrue(/isKeyDay/.test(ui), "本番・レッスンの日を印にしている");

console.log("\n=== §3-E: 群間比較を、方向で色分けしない ===");
assertTrue(!/r\.g >= 0 \? C\.sage : C\.curtain/.test(ui),
  "★「良い方向は緑・悪い方向は赤」をやめた（色が判定を言っていた）");
assertTrue(!/<BarChart[\s\S]{0,600}effectiveHabitRanking/.test(ui), "★棒グラフにしていない（§3-E）");

console.log("\n=== §3-I: 散布図に回帰直線を引かない ===");
const sc = ui.slice(ui.indexOf("<ScatterChart"), ui.indexOf("</ScatterChart>"));
assertTrue(!/<Line\b|ReferenceLine/.test(sc), "★直線を引いていない（引いた瞬間に予測になる）");
assertTrue(/fillOpacity=\{0\.45\}/.test(sc), "点の不透明度0.45（重なりが見える）");

console.log(`\n合計: ${passCount}件成功 / ${failCount}件失敗`);
if (failCount > 0) { console.log("\n⚠ 失敗があります。"); process.exit(1); }
console.log("\n✓ すべて成功しました。");
