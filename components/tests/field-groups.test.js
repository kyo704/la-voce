#!/usr/bin/env node
/**
 * かんたん記録／しっかり記録の切り替え（統合実行ルートv4 G2-8）のテスト。
 *
 * 【守っているもの】
 *  1. かんたん記録では、コアの3項目だけが出る（30秒で終わる道・§2 瞬間④）
 *  2. しっかり記録では、本人が畳んだもの以外は全部出る（既存の見え方を壊さない）
 *  3. 表示判定が画面側に直書きされていないこと（記録項目の再設計v2 §3.3）
 *  4. かんたん記録に「満タンにできない目盛り」を見せていないこと（§11）
 */
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..", "..");
let passCount = 0, failCount = 0;
function assertEqual(a, b, label) {
  const x = JSON.stringify(a), y = JSON.stringify(b);
  if (x === y) { console.log(`  ✓ ${label}`); passCount++; }
  else { console.log(`  ✗ ${label}`); console.log(`      期待値: ${y}`); console.log(`      実際値: ${x}`); failCount++; }
}
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

async function main() {
  const src = fs.readFileSync(path.join(ROOT, "lib", "fieldGroups.js"), "utf-8");
  const mod = await import("data:text/javascript;base64," + Buffer.from(src, "utf-8").toString("base64"));
  const { FIELD_GROUPS, CORE_GROUP_KEYS, isFieldGroupVisible, fieldGroupDetail, DEFAULT_RECORD_MODE } = mod;
  const tracker = fs.readFileSync(path.join(ROOT, "components", "VocalTracker.jsx"), "utf-8");

  console.log("=== テスト1: 既定は「しっかり記録」（既存ユーザーの見え方を変えない） ===");
  assertEqual(DEFAULT_RECORD_MODE, "full", "既定は full");
  assertEqual(isFieldGroupVisible("meal", {}), true, "モード未設定でも、これまでどおり全部出る");
  assertEqual(isFieldGroupVisible("meal", { mode: "wrong-value" }), true, "想定外の値でも既定に倒れる");

  console.log("\n=== テスト2: かんたん記録はコアの3つだけ ===");
  assertEqual([...CORE_GROUP_KEYS].sort(), ["activity", "sleep", "voice"], "コアは 声・活動・睡眠 の3つ");
  CORE_GROUP_KEYS.forEach((k) => assertEqual(isFieldGroupVisible(k, { mode: "simple" }), true, `かんたんでも「${k}」は出る`));
  FIELD_GROUPS.filter((g) => g.tier !== "core").forEach((g) => {
    assertEqual(isFieldGroupVisible(g.key, { mode: "simple" }), false, `かんたんでは「${g.key}」を出さない`);
  });

  console.log("\n=== テスト3: しっかり記録では、畳んだものだけが消える ===");
  assertEqual(isFieldGroupVisible("cpps", { mode: "full", foldedGroups: [] }), true, "畳んでいなければCPPSは出る");
  assertEqual(isFieldGroupVisible("cpps", { mode: "full", foldedGroups: ["cpps"] }), false, "畳んだCPPSは出ない");
  assertEqual(isFieldGroupVisible("env", { mode: "full", foldedGroups: ["environment"] }), false, "環境は foldKey で畳める");
  assertEqual(isFieldGroupVisible("voice", { mode: "full", foldedGroups: ["voice"] }), true, "コアは畳めない（誤って消えない）");
  assertEqual(isFieldGroupVisible("unknown-new-group", { mode: "full" }), true, "未知のキーは出す（新項目が黙って消えない）");

  console.log("\n=== テスト4: Detail（0=記録しない / 1=簡易 / 2=詳細） ===");
  assertEqual(fieldGroupDetail("meal", { mode: "simple" }), 0, "かんたんでは食事は 0（記録しない）");
  assertEqual(fieldGroupDetail("voice", { mode: "simple" }), 1, "かんたんの声は 1（簡易）");
  assertEqual(fieldGroupDetail("voice", { mode: "full" }), 2, "しっかりの声は 2（詳細）");

  console.log("\n=== テスト5: 画面側に表示判定が直書きされていない ===");
  // 設定画面（「記録する項目を増やす」の一覧）は folded_groups を直接見てよい。
  // 記録画面の表示判定として直書きされていないことだけを確かめる。
  const directUses = (tracker.match(/!\(profile\.folded_groups \|\| \[\]\)\.includes\(/g) || []).length;
  const settingsUses = (tracker.match(/FOLDABLE_GROUP_LABELS\)\.filter\(\(key\) => !\(profile\.folded_groups/g) || []).length;
  assertEqual(directUses, settingsUses, "folded_groups の直接判定は設定画面の一覧だけ（記録画面には無い）");
  assertTrue(tracker.includes("const showGroup ="), "showGroup 経由に集約されている");
  assertTrue(tracker.includes('isFieldGroupVisible'), "lib/fieldGroups.js を参照している");

  console.log("\n=== テスト6: かんたん記録に減点表示を出していない（v4 §11） ===");
  assertTrue(tracker.includes("countedSectionTotal"), "目盛りの分母がモードで変わる");
  assertTrue(/countFilledSections\(formData, profile\.record_mode\)/.test(tracker), "数える側もモードを見ている");
  assertTrue(/record_mode === "simple"\s*\n?\s*\? null/.test(tracker), "かんたんでは「もう少しで◯◯」を出さない");
  ["完了度", "未入力"].forEach((w) => assertTrue(!tracker.includes(w + "</"), `UIに「${w}」を出していない`));

  console.log(`\n合計: ${passCount}件成功 / ${failCount}件失敗`);
  if (failCount > 0) { console.log("\n⚠ 失敗があります。"); process.exit(1); }
  console.log("\n✓ すべて成功しました。");
}
main().catch((e) => { console.error(e); process.exit(1); });
