#!/usr/bin/env node
/**
 * 順位の言い方（2026-09-01）
 *
 * ★直す前は、こう書いていました。
 *     この14日間で【12番目に良い日】です（上から86%）
 *                  ↑ 太字
 *   position は上から数えた順位なので、14日中12位は★悪い日です。
 *   それを「良い日」と呼び、太字にしていました。
 *   ★悪い日ほど褒められているように見える形でした。
 */
const { readCode } = require("./_source");
let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }
function eq(a, b, label) { assertTrue(JSON.stringify(a) === JSON.stringify(b), `${label}（${JSON.stringify(a)}）`); }

const vt = readCode("components", "VocalTracker.jsx");

(async () => {
  const { rankPhrase } = await import("../../lib/rankWording.js");

  console.log("=== ★数える向きが、いる側に合っている ===");
  eq(rankPhrase(12, 14).side, "low", "14日中12位は下側");
  eq(rankPhrase(12, 14).rank, 3, "★下から3番目と数え直す");
  assertTrue(rankPhrase(12, 14).text.includes("低いほうから3番目"), "★報告どおりの文言");
  eq(rankPhrase(3, 14).side, "high", "14日中3位は上側");
  assertTrue(rankPhrase(3, 14).text.includes("高いほうから3番目"), "上側はそのまま数える");
  eq(rankPhrase(1, 14).rank, 1, "1位は1位");
  eq(rankPhrase(14, 14).rank, 1, "★最下位は「低いほうから1番目」");

  console.log("\n=== ちょうど真ん中は、どちらにも寄せない ===");
  eq(rankPhrase(4, 7).side, "middle", "7日の4位");
  assertTrue(rankPhrase(4, 7).text.includes("ちょうど真ん中"), "真ん中と書く");

  console.log("\n=== ★「良い日」「悪い日」と言わない ===");
  const code = readCode("lib", "rankWording.js");
  [[1,14],[7,14],[8,14],[14,14],[4,7]].forEach(([p, n]) => {
    const t = rankPhrase(p, n).text;
    ["良い日", "悪い日", "よい日", "わるい日"].forEach((w) => {
      assertTrue(!t.includes(w), `${p}/${n} に「${w}」が出ない`);
    });
  });

  console.log("\n=== 変な入力でも落ちない ===");
  eq(rankPhrase(null, 14).text, "", "null なら空文字");
  eq(rankPhrase(5, 0).text, "", "n=0 なら空文字");
  assertTrue(rankPhrase(99, 14).rank >= 1, "範囲外の順位でも壊れない");

  console.log("\n=== ★画面が、この仕組みを通している ===");
  assertTrue(/rankPhrase\(deviationScore\.position, deviationScore\.n\)/.test(vt),
    "★偏差値カードが通している");
  assertTrue(!vt.includes("番目に良い日"), "★古い「◯番目に良い日」が残っていない");
  // 太字を、当てはまらない側に付けていないこと
  const card = vt.slice(vt.indexOf('gateAllows("deviation.tScore"'), vt.indexOf('gateAllows("deviation.tScore"') + 900);
  assertTrue(!/<strong>\{deviationScore\.position\}/.test(card),
    "★順位そのものを太字にしていない");

  console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
  process.exit(failCount === 0 ? 0 : 1);
})();
