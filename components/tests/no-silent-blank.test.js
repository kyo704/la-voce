#!/usr/bin/env node
/**
 * 押せるものの先が、無言で空にならないこと（2026-08-31）
 *
 * ★4回の調査で見つからなかった不具合の再発防止です。
 *
 *   相関の強さの3つのボタンは、権限のチェックの★外にありました。
 *   中身だけが中にあり、こう書かれていました：
 *
 *     {chartData.length === 0 ? (空状態の文) : !can(...) ? null : (カード)}
 *
 *   その結果：
 *     データが無い  → 空状態の文が出る（何か出る）
 *     データが有る  → null（★何も出ない）
 *
 *   ★「データが少ないほど何か出て、増えると無言になる」という逆転です。
 *   押しても何も起きないので「切り替えが壊れている」と見えました。
 *   コンソールにエラーも出ません（null は React の正常な動作）。
 *
 * ★守ること
 *   ① 権限で出し分けるときは、操作するものごと出し分ける（§4）
 *   ② 待っている状態は、必ず何かを出す（憲章 §3-4）。無言にしない
 */
const { readCode, readRaw } = require("./_source");
let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

const vt = readCode("components", "VocalTracker.jsx");

console.log("=== ★① 権限で null を返していない ===");
// ★「権限が無ければ null」という書き方そのものを禁じます。
//   出さないなら、操作するものごと出さないこと。
assertTrue(!/!can\(viewer, "[a-z.]+"\) \? null/.test(vt),
  "★「権限が無ければ null」という分岐が無い");

console.log("\n=== ★② まとまりは、誰にでも必ず出る ===");
// ★1日で3回作り替えた場所です。経緯：
//   ① ボタンは外・中身だけ権限の中 → 押しても無言
//   ② 権限をいちばん外へ → ボタンごと消えた
//   ③ いまの形：まとまりは常に出し、中身だけ状態で分ける
const btn = vt.indexOf('setAnalysisTarget("performance")');
const head = vt.indexOf('<h3 className="ff-display italic text-lg mb-2">{t("titleCorrelationStrength")}</h3>');
assertTrue(btn > 0, "切り替えボタンがある");
assertTrue(head > 0 && head < btn, "★見出しがボタンより先にあり、常に出る");
// 見出しとボタンの手前に can( の && ゲートが無いこと
const before = vt.slice(Math.max(0, head - 600), head);
assertTrue(!/can\(viewer, "analysis\.relations"\)\s*&&\s*\(<>/.test(before),
  "★見出しとボタンが、権限のゲートで囲われていない");

console.log("\n=== ★②-2 中身は3つの状態に必ず分かれる ===");
const branch = vt.slice(vt.indexOf('!can(viewer, "analysis.relations") ? ('),
                        vt.indexOf('!can(viewer, "analysis.relations") ? (') + 1400);
assertTrue(branch.length > 100, "3分岐のかたまりが見つかる");
assertTrue(/この見かたは、いまは一部の方に/.test(branch),
  "★権限が無いときも、理由の文が出る（null にしない）");
assertTrue(/chartData\.length === 0 \? \(/.test(branch), "データが無いときの枝がある");

console.log("\n=== ★③ 待っている状態は、無言にしない（憲章 §3-4） ===");
const empty = vt.slice(vt.indexOf("chartData.length === 0 ? ("),
                       vt.indexOf("chartData.length === 0 ? (") + 1200);
assertTrue(/noteEmptyPerformanceCorr/.test(empty) && /noteEmptyGeneralCorr/.test(empty),
  "空のときに文が出る");
assertTrue(/いまの記録：/.test(empty),
  "★いま何日ぶんあるかを、事実として出している");
assertTrue(!/\?\s*null\s*:/.test(empty.slice(0, 400)),
  "★空の分岐で null を返していない");

console.log("\n=== ★④ ほかの can() も、操作ごと囲っている ===");
// can(...) && ( の形であること（&& の右にすべてが入る）
const uses = vt.match(/can\(viewer, "[a-z.]+"\)[^\n]*/g) || [];
assertTrue(uses.length >= 5, `can() の使用箇所を見つけた（${uses.length}件）`);
uses.forEach((u) => {
  // ★許すのは2つの形だけ：
  //   can(...) && ( …全部… )        操作ごと出し分ける
  //   !can(...) ? ( …理由… ) : …    出さない代わりに、必ず理由を出す
  const gated = /can\(viewer, "[a-z.]+"\)\s*&&/.test(u) || /&&\s*can\(viewer/.test(u);
  const explained = /can\(viewer, "[a-z.]+"\)\s*\?\s*\(/.test(u);
  assertTrue(gated || explained, `★出し分けの形が正しい: ${u.trim().slice(0, 60)}`);
});

console.log("\n=== 3ゲート（n≥10）とは別のしくみであること ===");
// ★混同しないこと。棒が出る条件は「対になる日が3日以上」で、
//   n≥10 は「文章を出してよいか」の判定です。段が違います。
assertTrue(/pairs\.length >= 3/.test(vt), "棒が出る条件は、対になる日が3日以上");
const gates = readCode("lib", "displayGates.js");
assertTrue(/NARRATIVE_MIN_N_PER_GROUP = 10/.test(gates), "n≥10 は文章のためのしきい値");

console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
process.exit(failCount === 0 ? 0 : 1);
