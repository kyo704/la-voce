#!/usr/bin/env node
// ============================================================================
// 本番のかたちの見張り
// ============================================================================

const fs = require("fs");
const path = require("path");
let failed = 0;
function ok(condition, label) {
  if (condition) console.log("  ✓ " + label);
  else { console.log("  ✗ " + label); failed++; }
}

(async () => {
  const source = fs.readFileSync(
    path.join(__dirname, "..", "..", "lib", "performanceForm.js"), "utf8"
  );
  const m = await import("data:text/javascript;base64," + Buffer.from(source).toString("base64"));

  console.log("① 選ぶ形");
  ok(JSON.stringify(m.PERFORMANCE_FORMS) === JSON.stringify(["ソロ", "合唱・アンサンブル"]),
    "形は見本どおり2つ");
  ok(m.isPerformanceForm("ソロ"), "ソロを受け入れる");
  ok(m.isPerformanceForm("合唱・アンサンブル"), "合唱・アンサンブルを受け入れる");
  ok(!m.isPerformanceForm("なし"), "なしを本番の形にしない");
  ok(!m.isPerformanceForm("独唱"), "未知の形を受け入れない");

  console.log("\n② 記録から読む");
  ok(m.performanceFormOf({
    activities: [{ kind: "本番", detail: { performanceForm: "ソロ" } }]
  }) === "ソロ", "本番のソロを読む");
  ok(m.performanceFormOf({
    activities: [{ kind: "本番", detail: { performanceForm: "合唱・アンサンブル" } }]
  }) === "合唱・アンサンブル", "本番の合唱を読む");
  ok(m.performanceFormOf({
    activities: [{ kind: "レッスン", detail: { performanceForm: "ソロ" } }]
  }) === null, "レッスンの形を本番として読まない");
  ok(m.performanceFormOf({ activities: [] }) === null, "本番が無い日はnull");
  ok(m.performanceFormOf(null) === null, "壊れた入力でもnull");

  console.log("\n③ 説明");
  ok(m.PERFORMANCE_FORM_LABEL === "本番の かたち", "見出しが決まっている");
  ok(m.PERFORMANCE_FORM_NOTE.includes("どちらが よい・わるい では ありません"),
    "優劣を付けない注記");
  console.log(failed === 0 ? "\n★すべて通りました" : `\n★${failed}件、落ちました`);
  process.exit(failed ? 1 : 0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
