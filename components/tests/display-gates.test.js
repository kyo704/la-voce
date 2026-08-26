#!/usr/bin/env node
/**
 * 統合実行ルートv4 §6「表示ゲートの共通レイヤー」の回帰テスト。
 *
 * 【重要】このテストは lib/displayGates.js を実行時に読み込んで検証します。
 * `@/lib/translations` の別名解決は Next.js のビルドが行うため、ここでは
 * その import 行だけを最小のスタブに置き換えてから評価します
 * （実装をコピーせずに、常に本物のゲート定義を検証するため）。
 *
 * 実行方法：
 *   node components/tests/display-gates.test.js
 */

const fs = require("fs");
const path = require("path");

const SOURCE_PATH = path.join(__dirname, "..", "..", "lib", "displayGates.js");
const TRANSLATIONS_PATH = path.join(__dirname, "..", "..", "lib", "translations.js");

// 文言のキーが translations.js に実在することも、ここで一緒に確かめる。
const translationsSource = fs.readFileSync(TRANSLATIONS_PATH, "utf-8");
function translationKeyExists(key) {
  return new RegExp(`\\n\\s{2}${key}:\\s*\\{`).test(translationsSource);
}

let passCount = 0;
let failCount = 0;
function assertEqual(actual, expected, label) {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a === b) { console.log(`  ✓ ${label}`); passCount++; }
  else { console.log(`  ✗ ${label}`); console.log(`      期待値: ${b}`); console.log(`      実際値: ${a}`); failCount++; }
}
function assertTrue(cond, label) {
  if (cond) { console.log(`  ✓ ${label}`); passCount++; }
  else { console.log(`  ✗ ${label}`); failCount++; }
}

async function main() {
  const raw = fs.readFileSync(SOURCE_PATH, "utf-8");
  // 翻訳の別名 import だけを、キーをそのまま返すスタブに差し替える。
  const stubbed = raw.replace(
    /import \{ createTranslator \} from "@\/lib\/translations";/,
    'const createTranslator = () => (key) => key;'
  );
  if (stubbed === raw) throw new Error("translations の import 行が見つかりませんでした。スタブの置き換えに失敗しています。");
  const mod = await import("data:text/javascript;base64," + Buffer.from(stubbed, "utf-8").toString("base64"));
  const { GATES, getGate, evaluateGate, gateAllows, NARRATIVE_MIN_N_PER_GROUP, NARRATIVE_MIN_EFFECT_SIZE, NARRATIVE_FDR_Q } = mod;

  console.log("=== テスト1: §6-1 の3条件が、確定した数値のまま保たれている ===");
  assertEqual(NARRATIVE_MIN_N_PER_GROUP, 10, "各群の件数の下限は 10");
  assertEqual(NARRATIVE_MIN_EFFECT_SIZE, 0.4, "効果量の下限は |g| ≥ 0.4");
  assertEqual(NARRATIVE_FDR_Q, 0.10, "BH-FDR の q は 0.10");

  console.log("\n=== テスト2: 白米の例（件数は足りるが効果量ゼロ）は、文章を出さない ===");
  const riceLike = evaluateGate("diet.narrative", { n1: 40, n0: 40, effectSize: 0.02, fdrPass: true });
  assertEqual(riceLike.passed, false, "n が十分でも、効果量が小さければ通さない");
  assertEqual(riceLike.reason, "effect", "落ちた理由は効果量である");
  assertTrue(!!riceLike.message, "通らなかったときは、必ず置き換えの文章が返る（§6-3）");

  console.log("\n=== テスト3: 3条件のうち1つでも欠けたら通さない（fail closed） ===");
  const base = { n1: 12, n0: 12, effectSize: 0.8, fdrPass: true };
  assertEqual(evaluateGate("diet.narrative", base).passed, true, "3条件すべてを満たせば通る");
  assertEqual(evaluateGate("diet.narrative", { ...base, n0: 4 }).reason, "count", "片群の件数不足は count で落ちる");
  assertEqual(evaluateGate("diet.narrative", { ...base, fdrPass: false }).reason, "fdr", "FDR を通っていなければ落ちる");
  assertEqual(evaluateGate("diet.narrative", { ...base, fdrPass: undefined }).reason, "fdr", "FDR の結果が渡されていない場合も落ちる");
  assertEqual(evaluateGate("diet.narrative", { n1: 12, n0: 12, fdrPass: true }).reason, "effect", "効果量が渡されていない場合も落ちる");
  assertEqual(evaluateGate("diet.narrative", { ...base, n1: undefined }).reason, "count", "両群が揃っていなければ落ちる（§6-1 ①）");

  console.log("\n=== テスト4: |ρ| ≥ 0.3 でも文章を出してよい（§6-1 ②の「または」） ===");
  assertEqual(evaluateGate("lag.narrative", { days: 20, n: 12, rho: 0.35, fdrPass: true }).passed, true, "ρ が 0.3 以上なら通る");
  assertEqual(evaluateGate("lag.narrative", { days: 20, n: 12, rho: 0.12, fdrPass: true }).reason, "effect", "ρ が 0.3 未満なら落ちる");

  console.log("\n=== テスト5: 日数のゲートは「あと◯日」を返す（§6-3） ===");
  const acwr8 = evaluateGate("acwr", { days: 8 });
  assertEqual(acwr8.passed, false, "記録8日では ACWR は通らない");
  assertEqual(acwr8.reason, "days", "落ちた理由は日数である");
  assertEqual(acwr8.remaining, 20, "あと20日と算出される（28 − 8）");
  assertEqual(evaluateGate("acwr", { days: 28 }).passed, true, "28日そろえば通る");

  console.log("\n=== テスト6: §6-4 の対象箇所が、すべてゲートとして定義されている ===");
  const required = [
    "combo.narrative", "rest.average", "location.average", "symptom.cooccurrence",
    "mentalTag.trend", "timeOfDay.badge", "deviation.tScore", "forecast.hitRate", "acwr"
  ];
  required.forEach((key) => assertTrue(!!getGate(key), `ゲート「${key}」が定義されている`));
  assertEqual(evaluateGate("forecast.hitRate", { n: 13 }).passed, false, "的中率は13件では出さない");
  assertEqual(evaluateGate("forecast.hitRate", { n: 14 }).passed, true, "的中率は14件から出す");
  assertEqual(evaluateGate("deviation.tScore", { n: 29 }).passed, false, "偏差値の数値は29件では出さない（順位のみ）");
  assertEqual(evaluateGate("deviation.tScore", { n: 30 }).passed, true, "偏差値の数値は30件から出す");

  console.log("\n=== テスト7: §9のゲート条件「記録8日のアカウントで断定的な文が1つも出ない」 ===");
  // 実機確認の前に、ロジックの上で確かめておくための再現テスト。
  // 記録8日では、どの群も10件に届かないため、文章で語るゲートはすべて閉じているはず。
  const EIGHT_DAYS = 8;
  const narrativeKeys = GATES.filter((g) => g.narrative).map((g) => g.key);
  assertTrue(narrativeKeys.length > 0, "文章で語るゲートが定義されている");
  narrativeKeys.forEach((key) => {
    // 8日ぶんの記録では、両群に分けてもそれぞれ最大で8件。効果量が大きくても通ってはいけない。
    const verdict = evaluateGate(key, { days: EIGHT_DAYS, n: EIGHT_DAYS, n1: 5, n0: 3, effectSize: 1.9, rho: 0.9, fdrPass: true });
    assertEqual(verdict.passed, false, `記録8日では「${key}」の文章を出さない`);
    assertTrue(!!verdict.message, `「${key}」は代わりに「あと◯で見える」文章を返す`);
  });
  assertEqual(evaluateGate("acwr", { days: EIGHT_DAYS }).passed, false, "記録8日ではACWRの警告も出ない（パネルと同一フラグ）");
  assertEqual(evaluateGate("forecast.hitRate", { n: EIGHT_DAYS }).passed, false, "記録8日では的中率も出ない");
  assertEqual(evaluateGate("deviation.tScore", { n: EIGHT_DAYS }).passed, false, "記録8日では偏差値の数値も出ない（順位のみ）");

  console.log("\n=== テスト8: 未定義のキーは通さない（画面ごとの条件書きを防ぐ） ===");
  const originalWarn = console.warn;
  console.warn = () => {};
  assertEqual(gateAllows("does.not.exist", { days: 999 }), false, "未定義のゲートは常に false");
  console.warn = originalWarn;

  console.log("\n=== テスト9: すべてのゲートの labelKey が translations.js に実在する ===");
  GATES.forEach((g) => assertTrue(translationKeyExists(g.labelKey), `${g.key} の labelKey「${g.labelKey}」が存在する`));
  ["gateNeedDays", "gateNeedRecords", "gateNoClearTrend", "gateRankOnlyNote"].forEach((k) =>
    assertTrue(translationKeyExists(k), `文言キー「${k}」が存在する`));

  console.log("\n=== テスト10（G2-4）: 白米の例が、実装として再現しないこと ===");
  // 「毎日食べる主食」は比較そのものが成り立たない。実装が主食を除外していることを、
  // VocalTracker.jsx のソースから直接確かめる（コピーではなく本物を読む）。
  const trackerSource = fs.readFileSync(path.join(__dirname, "..", "VocalTracker.jsx"), "utf-8");
  assertTrue(!trackerSource.includes("dietGoodBadFoodStats"), "回数だけで比べていた旧実装が残っていない");
  assertTrue(trackerSource.includes("DIET_STAPLE_RATIO"), "主食を除外する閾値が実装されている");
  assertTrue(/const dietFoodEffects[\s\S]{0,3000}computeHedgesG/.test(trackerSource), "食事の比較が効果量（Hedges' g）で行われている");
  assertTrue(/const dietFoodEffects[\s\S]{0,3000}benjaminiHochberg/.test(trackerSource), "食事の比較に多重比較の補正が入っている");
  assertTrue(/const dietFoodEffects[\s\S]{0,3000}addDays\(date, 1\) !== nextDate/.test(trackerSource), "前夜→翌日の方向に固定されている");
  const translationsSrc = fs.readFileSync(path.join(__dirname, "..", "..", "lib", "translations.js"), "utf-8");
  assertTrue(!/compositeGoodFoodSentence:\s*\{/.test(translationsSrc), "「良かった日に食べていることが多い」の文言が削除されている");
  assertTrue(!/compositeBadFoodSentence:\s*\{/.test(translationsSrc), "「反対に悪かった日にも多い」の文言が削除されている");
  // 効果量ゼロ付近＝良い日にも悪い日にも同じだけ出る食品は、件数が十分でも通らない。
  assertEqual(evaluateGate("diet.narrative", { n1: 30, n0: 30, effectSize: 0.05, fdrPass: true }).passed, false,
    "良い日にも悪い日にも同じだけ出る食品は、件数が十分でも文章にならない");
  assertEqual(evaluateGate("diet.narrative", { n1: 14, n0: 16, effectSize: 0.62, fdrPass: true }).passed, true,
    "効果量・件数・多重比較がそろえば、食事についても語ってよい");

  console.log(`\n合計: ${passCount}件成功 / ${failCount}件失敗`);
  if (failCount > 0) {
    console.log("\n⚠ 失敗したテストがあります。表示ゲートは信頼性の土台なので、必ず直してから次へ進んでください。");
    process.exit(1);
  }
  console.log("\n✓ すべて成功しました。");
}

main().catch((err) => { console.error(err); process.exit(1); });
