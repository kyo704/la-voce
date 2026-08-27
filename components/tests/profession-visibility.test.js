#!/usr/bin/env node
/**
 * 分析カードの職業別の出し分けが、設計書とズレていないことを確認するテスト。
 *
 * 【守っているもの】
 *  1. lib/analysisCardVisibility.js の表が、docs/profession-presets.json と一致すること
 *  2. 職業IDの2つの体系（アプリ内部 / 設計書）の対応が漏れていないこと
 *  3. 実際の出し分けの挙動（声楽家に声優向けカードが出ない、など）
 *
 * 実行方法：
 *   node components/tests/profession-visibility.test.js
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
function assertTrue(c, label) {
  if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; }
}

async function main() {
  const src = fs.readFileSync(path.join(ROOT, "lib", "analysisCardVisibility.js"), "utf-8");
  const mod = await import("data:text/javascript;base64," + Buffer.from(src, "utf-8").toString("base64"));
  const { ANALYSIS_CARD_VISIBILITY, APP_TO_DESIGN_PROFESSION, isAnalysisCardVisible } = mod;
  const design = JSON.parse(fs.readFileSync(path.join(ROOT, "docs", "profession-presets.json"), "utf-8"));
  const table = design.analysisCardVisibility;

  console.log("=== テスト1: 設計書の表と実装の表が一致する ===");
  const designKeys = Object.keys(table).filter((k) => !k.startsWith("_")).sort();
  assertEqual(Object.keys(ANALYSIS_CARD_VISIBILITY).sort(), designKeys, "カードIDの一覧が一致する");
  designKeys.forEach((k) => {
    assertEqual([...(ANALYSIS_CARD_VISIBILITY[k] || [])].sort(), [...table[k]].sort(), `「${k}」の対象職業が一致する`);
  });

  console.log("\n=== テスト2: 職業IDの対応に漏れがない ===");
  const designProfessions = design.professions.map((p) => p.id).sort();
  assertEqual(Object.values(APP_TO_DESIGN_PROFESSION).sort(), designProfessions, "アプリ側の4職業が設計書の4職業に対応する");
  const trackerSrc = fs.readFileSync(path.join(ROOT, "components", "VocalTracker.jsx"), "utf-8");
  const appIds = (trackerSrc.match(/const VOCAL_PROFESSIONS = \[([^\]]*)\]/) || [])[1];
  assertTrue(!!appIds, "VOCAL_PROFESSIONS が見つかる");
  const appList = (appIds.match(/"([a-z_]+)"/g) || []).map((x) => x.replace(/"/g, "")).sort();
  assertEqual(appList, Object.keys(APP_TO_DESIGN_PROFESSION).sort(), "アプリ内部の職業IDが対応表と一致する");

  console.log("\n=== テスト3: 実際の出し分け ===");
  assertEqual(isAnalysisCardVisible("shout-recovery-curve", ["singer"]), false, "声楽家に、声優向けの叫び回復曲線は出さない");
  assertEqual(isAnalysisCardVisible("shout-recovery-curve", ["voice_actor"]), true, "声優には叫び回復曲線を出す");
  assertEqual(isAnalysisCardVisible("passaggio-stability", ["singer"]), true, "声楽家にパッサッジョを出す");
  assertEqual(isAnalysisCardVisible("passaggio-stability", ["pop_musical"]), true, "ポップスにもパッサッジョを出す（設計書の判断）");
  assertEqual(isAnalysisCardVisible("passaggio-stability", ["announcer"]), false, "アナウンサーにパッサッジョは出さない");
  assertEqual(isAnalysisCardVisible("speaking-pitch-diurnal", ["voice_actor"]), true, "声優にも話声位の日内変動を出す（設計書の判断）");
  assertEqual(isAnalysisCardVisible("performance-peaking-curve", ["announcer"]), false, "アナウンサーに本番ピーキング曲線は出さない");
  assertEqual(isAnalysisCardVisible("environment-comfort-zone", ["announcer"]), true, "環境の快適帯は全職業に出す");
  assertEqual(isAnalysisCardVisible("deviation-score", ["announcer"]), true, "表に無いカードは職業を問わず出す");
  assertEqual(isAnalysisCardVisible("shout-recovery-curve", []), false, "職業が未設定なら、職業限定カードは出さない");
  assertEqual(isAnalysisCardVisible("shout-recovery-curve", ["singer", "voice_actor"]), true, "兼業なら、どちらかに該当すれば出す");

  console.log("\n=== テスト4: 画面側が、判定を1箇所からしか受け取っていない ===");
  ["screamRecovery", "screamThreshold", "passaggio", "sffDiurnal", "tourEndurance", "peaking", "envComfort"].forEach((k) => {
    assertTrue(trackerSrc.includes(`analysisLocks.map.${k}.visible`), `${k} が analysisLocks.map の visible を参照している`);
  });
  assertTrue(!/\(effectiveProfessions \|\| \[\]\)\.includes\("voice_actor"\) && \(\s*\n\s*analysisLocks/.test(trackerSrc),
    "職業ゲートが画面側に直接書き残されていない");

  console.log("\n=== ★消した4項目が、戻ってきていないこと（§3.1） ===");
console.log("     消す前に3か所すべてで実データ0件を確認しています。");
{
  const { readCode, readRaw } = require("./_source");
  const uiCode = readCode("components", "VocalTracker.jsx");
  const tr = readCode("lib", "translations.js");
  ["vocalRangeLowUsed", "vocalRangeHighUsed", "dynamicsRange", "passaggioCrossings"].forEach((k) => {
    assertTrue(!new RegExp(`\\b${k}\\b`).test(uiCode), `★${k} が復活していない`);
  });
  ["loadVocalRangeLowUsed", "loadVocalRangeHighUsed", "loadDynamicsRange", "loadPassaggioCrossings"].forEach((k) => {
    assertTrue(!new RegExp(`\\b${k}\\b`).test(tr), `★翻訳キー ${k} も残っていない`);
  });
  // ★通過感（passaggioFeel）は、この職業の看板。消していないこと。
  const uiRaw2 = readRaw("components", "VocalTracker.jsx");
  assertTrue(/passaggioFeel/.test(uiRaw2), "★パッサッジョの通過感は残っている（この職業の看板）");
  assertTrue(/onDetailChange\(\{ passaggioFeel/.test(uiRaw2), "通過感の入力が残っている");
  assertTrue(/passaggioStability/.test(uiRaw2), "通過感を読む分析も残っている");
}

console.log(`\n合計: ${passCount}件成功 / ${failCount}件失敗`);
  if (failCount > 0) { console.log("\n⚠ 失敗があります。"); process.exit(1); }
  console.log("\n✓ すべて成功しました。");
}
main().catch((e) => { console.error(e); process.exit(1); });
