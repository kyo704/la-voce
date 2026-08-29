#!/usr/bin/env node
/**
 * 「複数の条件を組み合わせて見えてきたこと」は、文章を出さない（2026-08-30）
 *
 * ★なぜ
 *   このカードは タンパク質・カロリー・心の余裕・睡眠時間 を組み合わせます。
 *   このうち中核5項目は睡眠時間だけです。残る3つはどの族にも入りません
 *   （＝探索族）。設計憲章 §3-1 は、こう書いています。
 *
 *     ★族をまたいで補正しない
 *     → ★文章を出してよいのは、ここだけ（中核5項目）
 *     explore → ★文章も数字も出さない。「まだ調べています」だけ
 *
 * ★ゲート（combo.narrative）を通っても、文章を出してはいけません。
 *   3ゲートは族の中でだけ意味を持ちます。族が違えば、通過は
 *   「語ってよい」を意味しません。
 *
 * ★このアプリの約束は「言えることだけを言う」です。
 *   ここを戻すと、その約束そのものが崩れます。
 */
const { readCode, readRaw } = require("./_source");
let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

const vt = readCode("components", "VocalTracker.jsx");
const raw = readRaw("components", "VocalTracker.jsx");

// このカードの計算部だけを切り出す
const at = vt.indexOf("const compositePatternInsight = useMemo");
const end = vt.indexOf("}, [compositeConditionDaily", at);
const body = vt.slice(at, end);
console.log("=== カードの計算部が読めること ===");
assertTrue(at > 0 && end > at, "compositePatternInsight を切り出せた");

console.log("\n=== ★文章を出さずに必ず返す ===");
// ゲートの評価より後、最初の return が「文章なし」であること。
const gateAt = body.indexOf('evaluateGate("combo.narrative"');
assertTrue(gateAt > 0, "combo.narrative のゲートを評価している");
const afterGate = body.slice(gateAt);
const firstReturn = afterGate.slice(afterGate.indexOf("return"), afterGate.indexOf("return") + 130);
assertTrue(/sentences: \[\]/.test(firstReturn),
  "★ゲートのあと、最初に返すのは「文章なし」");
assertTrue(/EXPLORE_NOTE/.test(firstReturn),
  "★ゲートを通った場合も「まだ調べています」を返す");
// ★「通らなかったときだけ返す」形に戻っていないこと。これが元の姿でした。
assertTrue(!/if \(!comboGate\.passed\) return \{ gateMessage: comboGate\.message, sentences: \[\] \};/.test(body),
  "★「ゲートを通らなければ返す」という古い形が残っていない");

console.log("\n=== ★文章を組み立てても、画面へは出さない ===");
// 計算は残してよい（族の判断が変わったときのため）。ただし到達しないこと。
const sentencesReturn = body.lastIndexOf("return { gateMessage: null, sentences }");
assertTrue(sentencesReturn > 0, "文章を返す行は、記録として残っている");
assertTrue(sentencesReturn > body.indexOf("EXPLORE_NOTE"),
  "★その行は、必ず返す行より後にある（＝到達しない）");

console.log("\n=== 画面側 ===");
// 画面は gateMessage と sentences のどちらかを出す作りのまま。
assertTrue(/compositePatternInsight\.gateMessage \?/.test(vt),
  "画面は gateMessage があればそれを出す");

console.log("\n=== 根拠が、コードのそばに書いてあること ===");
assertTrue(/族をまたいで補正しない/.test(raw), "★§3-1 の根拠が書いてある");
assertTrue(/文章を出してよいのは、ここだけ/.test(raw), "★中核族だけ、と書いてある");
assertTrue(/判断依頼-配布後の残課題\.md の11番/.test(raw), "★戻す前に読む先が書いてある");

console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
process.exit(failCount === 0 ? 0 : 1);
