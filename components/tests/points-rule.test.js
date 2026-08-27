#!/usr/bin/env node
/**
 * ポイント計算ルールの移行テスト（統合実行ルートv4 §11）。
 *
 * 【守っているもの】
 *  1. かんたん記録が、しっかり記録より不利にならないこと
 *  2. 切替日より前に貯まったポイントが、1ptも変わらないこと
 */
const fs = require("fs");
const path = require("path");
let passCount = 0, failCount = 0;
function assertEqual(a, b, label) {
  if (JSON.stringify(a) === JSON.stringify(b)) { console.log(`  ✓ ${label}`); passCount++; }
  else { console.log(`  ✗ ${label}`); console.log(`      期待値: ${JSON.stringify(b)}`); console.log(`      実際値: ${JSON.stringify(a)}`); failCount++; }
}
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

async function main() {
  const src = fs.readFileSync(path.join(__dirname, "..", "..", "lib", "character.js"), "utf-8");
  const mod = await import("data:text/javascript;base64," + Buffer.from(src, "utf-8").toString("base64"));
  const { computeEntryPoints, computeTotalEarned, POINTS_RULE_V2_FROM, DAILY_POINTS, hasAnyRecord } = mod;

  // かんたん記録の1日（コア3項目のみ）
  const simpleDay = { voiceEntries: [{ id: "v1" }], sleepHours: 7, activities: [{ id: "a1", kind: "自主練習" }] };
  // しっかり記録の1日（旧ルールなら満点に近い）
  const fullDay = { ...simpleDay, waterBySlot: { total: 1800 }, meals: [{ id: "m" }], exercises: [{ id: "e" }],
    weightKg: 58, notes: "メモ", wakeNote: "A3", resonanceScore: 7, throatSymptoms: ["乾燥"] };

  console.log("=== テスト1: 新ルールでは、かんたんとしっかりで差がつかない ===");
  const after = "2026-09-01";
  assertEqual(computeEntryPoints(simpleDay, after), DAILY_POINTS, "かんたん記録の日も1日分もらえる");
  assertEqual(computeEntryPoints(fullDay, after), DAILY_POINTS, "しっかり記録の日も同じ1日分");
  assertEqual(computeEntryPoints(simpleDay, after), computeEntryPoints(fullDay, after), "★項目数で差がつかない");
  assertEqual(computeEntryPoints({}, after), 0, "何も記録していない日は0");
  assertEqual(computeEntryPoints(null, after), 0, "記録が無い日は0");

  console.log("\n=== テスト2: 切替日より前は、旧ルールのまま（過去の残高を動かさない） ===");
  const before = "2026-08-26";
  assertTrue(computeEntryPoints(fullDay, before) > computeEntryPoints(simpleDay, before),
    "切替日より前は、項目が多いほど多い（＝旧ルールが生きている）");
  assertEqual(computeEntryPoints(fullDay, before), 10, "旧ルールの満点は10pt のまま");
  assertEqual(computeEntryPoints(simpleDay, before), 2, "旧ルールでのかんたん相当は2pt のまま");
  assertEqual(computeEntryPoints(fullDay), 10, "日付を渡さなければ旧ルール（過去データの再計算を壊さない）");

  console.log("\n=== テスト3: 切替日そのものは新ルール ===");
  assertEqual(computeEntryPoints(simpleDay, POINTS_RULE_V2_FROM), DAILY_POINTS, "切替日当日から新ルール");
  assertEqual(computeEntryPoints(simpleDay, "2026-08-26"), 2, "その前日は旧ルール");

  console.log("\n=== テスト4: 合計は、過去分＋新ルール分の足し算になる ===");
  const entries = { "2026-08-20": fullDay, "2026-08-26": fullDay, "2026-08-27": simpleDay, "2026-09-01": simpleDay };
  const total = computeTotalEarned(entries);
  // 旧: 10 + 10 = 20 ／ 新: 5 + 5 = 10 ／ 初回使用ボーナスは別枠
  const firstUse = mod.computeFirstUseBonus(entries);
  assertEqual(total - firstUse, 20 + 10, "過去は旧ルール、以降は新ルールで合算される");
  assertTrue(firstUse > 0, "初回使用ボーナスは別枠で残っている");

  console.log("\n=== テスト5: hasAnyRecord は「開いてくれた日」を落とさない ===");
  assertEqual(hasAnyRecord({ throatCondition: 3 }), true, "喉の記録だけでも、記録した日");
  assertEqual(hasAnyRecord({ notes: "つらい" }), true, "メモだけでも、記録した日");
  assertEqual(hasAnyRecord({ weightKg: 58 }), true, "体重だけでも、記録した日");
  assertEqual(hasAnyRecord({}), false, "本当に空なら記録した日ではない");

  console.log(`\n合計: ${passCount}件成功 / ${failCount}件失敗`);
  if (failCount > 0) { console.log("\n⚠ 失敗があります。"); process.exit(1); }
  console.log("\n✓ すべて成功しました。");
}
main().catch((e) => { console.error(e); process.exit(1); });
