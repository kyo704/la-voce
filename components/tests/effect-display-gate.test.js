#!/usr/bin/env node
/**
 * 効果量を出してよいか、の3つの表示状態（2026-08-30）
 *
 * ★何が起きていたか
 *   「効いた習慣ランキング」が、n=3 で こう出していました。
 *     「この行動があった日（3件）は、翌日の声が平均で良く記録されています
 *       （効果量 g=0.62）」  ★☆☆☆〜★★★★ の星つき
 *
 *   原因は、古い lavoce-指標設計図.md の n≥3 と4段階の星が、この
 *   カードの中にだけ残っていたことです。共通の displayGates を通らず、
 *   自前の `r.n1 >= 3 && r.n0 >= 3` を持っていました。
 *
 * ★設計憲章 §3-4 の表示状態は3つだけです。星は4段階の目盛りで、
 *   ①待機／②通過／③不通過 のどれとも一致しません。
 * ★③でも数字（効果量・q値）を出しません。
 * ★③を「関係なし」と書きません。見えなかったことと、無いことは違います。
 */
const fs = require("fs");
const path = require("path");
const { ROOT, readCode } = require("./_source");
let passCount = 0, failCount = 0;
function assertEqual(a, b, label) {
  if (JSON.stringify(a) === JSON.stringify(b)) { console.log(`  ✓ ${label}`); passCount++; }
  else { console.log(`  ✗ ${label}  期待:${JSON.stringify(b)} 実際:${JSON.stringify(a)}`); failCount++; }
}
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

async function main() {
  // ★displayGates は翻訳を読み込むので、差し替えてから読み込む（他の試験と同じやり方）。
  const src = fs.readFileSync(path.join(ROOT, "lib", "displayGates.js"), "utf-8")
    .replace(/import \{ createTranslator \} from "@\/lib\/translations";/,
             "const createTranslator = () => (k) => k;");
  const G = await import("data:text/javascript;base64," + Buffer.from(src, "utf-8").toString("base64"));

  console.log("=== ★3つの状態（設計憲章 §3-4） ===");
  assertEqual(G.effectStateOf({ n1: 3, n0: 3, g: 0.9, fdrPass: true }), G.EFFECT_WAITING,
    "★n=3 は「待機」（以前はここで断定していた）");
  assertEqual(G.effectStateOf({ n1: 10, n0: 10, g: 0.9, fdrPass: true }), G.EFFECT_SHOWN, "3つ通れば「通過」");
  assertEqual(G.effectStateOf({ n1: 10, n0: 10, g: 0.2, fdrPass: true }), G.EFFECT_INCONCLUSIVE, "効果量が小さければ「不通過」");
  assertEqual(G.effectStateOf({ n1: 10, n0: 10, g: 0.9, fdrPass: false }), G.EFFECT_INCONCLUSIVE, "FDRを通らなければ「不通過」");
  assertEqual(G.effectStateOf({ n1: 10, n0: 3, g: 0.9, fdrPass: true }), G.EFFECT_WAITING, "★片群だけ足りないのも「待機」");
  assertEqual(G.effectStateOf(null), G.EFFECT_WAITING, "何も無ければ「待機」");
  assertEqual(G.effectStateOf({ n1: 10, n0: 10, g: null, fdrPass: true }), G.EFFECT_INCONCLUSIVE, "効果量が無ければ「不通過」");

  console.log("\n=== ★数字を出してよいのは、通ったときだけ ===");
  assertEqual(G.mayShowEffectNumbers({ n1: 3, n0: 3, g: 0.9, fdrPass: true }), false, "★n=3 では数字を出さない");
  assertEqual(G.mayShowEffectNumbers({ n1: 10, n0: 10, g: 0.9, fdrPass: false }), false, "★不通過でも数字を出さない");
  assertEqual(G.mayShowEffectNumbers({ n1: 10, n0: 10, g: 0.9, fdrPass: true }), true, "通れば出してよい");

  console.log("\n=== しきい値は displayGates の定数と同じか ===");
  assertEqual(G.NARRATIVE_MIN_N_PER_GROUP, 10, "各群 n ≥ 10");
  assertEqual(G.NARRATIVE_MIN_EFFECT_SIZE, 0.4, "|g| ≥ 0.4");
  assertEqual(G.NARRATIVE_FDR_Q, 0.10, "q < 0.10");
  // ★しきい値を直に書き換えても通る、という自己参照にしないため、値を固定する
  const src2 = readCode("lib", "displayGates.js");
  assertTrue(/NARRATIVE_MIN_N_PER_GROUP = 10;/.test(src2), "★n の下限が 10 と書いてある");
  assertTrue(/NARRATIVE_MIN_EFFECT_SIZE = 0\.4;/.test(src2), "★効果量の下限が 0.4 と書いてある");

  console.log("\n=== ★星は、どこにも残っていない ===");
  const vt = readCode("components", "VocalTracker.jsx");
  assertTrue(!/"★"\.repeat/.test(vt), "★「★」を並べる描画が無い");
  assertTrue(!/"☆"\.repeat/.test(vt), "★「☆」を並べる描画が無い");
  assertTrue(!/\.stars\b/.test(vt), "★stars を読んでいる場所が無い");
  assertTrue(!/function starRatingForEffect/.test(vt), "★星を数える関数が無い");
  assertTrue(!/★★★★/.test(vt), "★「あと◯日で★★★★」が無い");

  console.log("\n=== ★カードが、自前の件数のしきい値を持っていない ===");
  assertTrue(!/r\.n1 >= 3 && r\.n0 >= 3/.test(vt), "★n≥3 の自前の絞り込みが無い");
  // 効いた習慣ランキングが displayGates を通っていること
  assertTrue(/effectStateOf\(r\)/.test(vt), "カードが effectStateOf を通している");
  assertTrue(/mayShowEffectNumbers\(r\)/.test(vt), "数字の出し分けも通している");

  console.log("\n=== ★不通過のときの言い方 ===");
  assertTrue(/はっきりした関係は見えませんでした/.test(vt), "§3-4 ③ の言い方を使っている");
  // ★禁止語の検査は、必ずコメントを外した本文で行うこと（_source.js の注意書き）。
  //   生のまま調べると、★この規則を説明している自分のコメントで落ちます。
  //   実際に落ちました。同じ取り違えを、このリポジトリで繰り返しています。
  assertTrue(!/関係はありませんでした|関係なし/.test(vt), "★「関係なし」と書いていない");

  console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
  process.exit(failCount === 0 ? 0 : 1);
}
main();
