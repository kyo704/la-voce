#!/usr/bin/env node
/**
 * 検定の族（分析の検出力と族の設計.md §1）。
 *
 * ★BH-FDR を族ごとに独立してかけるための土台です。
 *   全部を1つの族にしていたため、項目が増えるほど検出力が落ち、
 *   何も出なくなる方向に働いていました。
 *
 * ★3ゲート（件数・効果量・FDR）は変えていません。§6-1 のままです。
 *   変えるのは「何を検定するか」と「どう説明するか」だけです。
 */
const { readRaw } = require("./_source");
let passCount = 0, failCount = 0;
function assertTrue(c, label) {
  if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; }
}
function assertEqual(a, b, label) {
  if (JSON.stringify(a) === JSON.stringify(b)) { console.log(`  ✓ ${label}`); passCount++; }
  else { console.log(`  ✗ ${label}  期待:${JSON.stringify(b)} 実際:${JSON.stringify(a)}`); failCount++; }
}

async function main() {
  const m = await import("data:text/javascript;base64," +
    Buffer.from(readRaw("lib", "analysisFamilies.js"), "utf-8").toString("base64"));

  console.log("\n=== 族の分け方 ===");
  assertEqual(m.CORE_FAMILY.length, 5, "中核は5項目（仕様どおり）");
  assertEqual(m.familyOf("sleepHours"), "core", "睡眠時間は中核");
  assertEqual(m.familyOf("cyclePhase"), "cycle", "周期は別の族");
  assertEqual(m.familyOf("refluxFlags"), "reflux", "食事と就寝は別の族");
  assertEqual(m.familyOf("weightKg"), "explore", "そのほかは探索族");
  console.log("     ★周期と食事と就寝を中核に混ぜない。使っている人だけの分析なので、");
  console.log("       中核族の検出力を下げてしまう（同書 §1-2）。");

  console.log("\n=== 探索族は検定しない ===");
  const grouped = m.groupByFamily([{ key: "sleepHours" }, { key: "cyclePhase" }, { key: "weightKg" }]);
  assertTrue(!JSON.stringify(grouped).includes("weightKg"),
    "★探索族が、検定の対象に入っていない（計算もしない）");
  assertEqual(m.mayStateFinding("sleepHours"), true, "中核は文章を出してよい");
  assertEqual(m.mayStateFinding("weightKg"), false, "★探索族は文章も数字も出さない");
  assertTrue(/まだ調べています/.test(m.EXPLORE_NOTE), "探索族には「まだ調べています」とだけ出す");

  console.log("\n=== 中核の値を、記録から取り出す ===");
  console.log("     ★同じ湿度50%でも、気温が違えば実際の水分量は違う。");
  const warm = m.absoluteHumidityOf(30, 50), cold = m.absoluteHumidityOf(5, 50);
  assertTrue(warm > cold * 3, `30℃50% は 5℃50% よりずっと湿っている（${warm.toFixed(1)} vs ${cold.toFixed(1)} g/m³）`);
  assertEqual(m.absoluteHumidityOf(null, 50), null, "気温が無ければ出さない");

  const e = { sleepHours: 7, nonPerformanceSpeechMinutes: 90, temperature: 20, humidity: 40, activities: [] };
  const v = m.coreFactorValues(e, { activities: [{ kind: "本番" }] });
  assertEqual(v.sleepHours, 7, "① 睡眠時間");
  assertEqual(v.offStageVoiceMinutes, 90, "② 本番外の発話時間");
  assertTrue(typeof v.absoluteHumidity === "number", "③ 絶対湿度（気温と湿度から導く）");
  assertEqual(v.dayAfterPerformance, 1, "④ 本番の翌日");
  assertEqual(m.coreFactorValues(e, { activities: [] }).dayAfterPerformance, 0, "④ 本番でない日の翌日");

  console.log("     ★『記録していない』を 0 で埋めないこと。");
  assertEqual(m.coreFactorValues(e, null).dayAfterPerformance, null,
    "★前日の記録が無ければ null（0 にしない。何もしなかった日と区別する）");
  assertEqual(m.coreFactorValues({}, null).sleepHours, null, "記録が無ければ null");
  assertEqual(m.coreFactorValues(e, null).morningEdema, null,
    "⑤ むくみは、まだ記録する場所が無いので常に null（作業中の状態 §5.14）");
  assertTrue(!m.availableCoreFactors().includes("morningEdema"),
    "★記録できないものを、検定できるものとして数えない");
  assertEqual(m.availableCoreFactors().length, 4, "いま検定できる中核は4項目");

  console.log("\n=== 二分の仕方 ===");
  const rows = [{ v: 1, y: 3 }, { v: 2, y: 4 }, { v: 3, y: 5 }, { v: 4, y: 2 }];
  const split = m.splitAtMedian(rows, (r) => r.v, (r) => r.y);
  assertEqual(split.median, 2.5, "中央値で分ける");
  assertEqual(split.low.length + split.high.length, 4, "全部がどちらかに入る");
  assertEqual(m.splitAtMedian([{ v: 1, y: 1 }], (r) => r.v, (r) => r.y), null,
    "件数が少なすぎるときは分けない");
  const bin = m.splitAtBinary([{ v: 1, y: 3 }, { v: 0, y: 4 }, { v: 1, y: 5 }, { v: 0, y: 2 }],
    (r) => r.v, (r) => r.y);
  assertEqual(bin.high.length, 2, "二値は 1 の群");
  assertEqual(bin.low.length, 2, "二値は 0 の群");

  console.log(`\n合計: ${passCount}件成功 / ${failCount}件失敗`);
  if (failCount > 0) { console.log("\n⚠ 失敗があります。"); process.exit(1); }
  console.log("\n✓ すべて成功しました。");
}
main().catch((e) => { console.error(e); process.exit(1); });
