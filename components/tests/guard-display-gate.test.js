#!/usr/bin/env node
/**
 * 守りのテスト③ ｜ ゲートを通っていないのに、文章を出さない
 * （守りのテスト3本.md §5。統合実行ルート v4 §6）
 *
 * ★文書の例は evaluateGate({nA, nB, effectSize, q}) → {pass, sentence} を
 *   想定していましたが、この製品の形は違います。
 *     evaluateGate(key, ctx, t) → { key, passed, reason, remaining, message, label }
 *   ctx は { days, n1, n0, effectSize, rho, fdrPass }。
 *   意図（3つの門を全部通ったときだけ語る）はそのままに、形を合わせています。
 *
 * ★「通らないとき、数値も返さない」を省略していません。
 *   文章を止めても数字が出ていれば、読む人は同じ結論に至ります。
 */
const { readCode, readRaw } = require("./_source");
let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }
function assertEqual(a, b, label) {
  if (JSON.stringify(a) === JSON.stringify(b)) { console.log(`  ✓ ${label}`); passCount++; }
  else { console.log(`  ✗ ${label}  期待:${JSON.stringify(b)} 実際:${JSON.stringify(a)}`); failCount++; }
}

async function main() {
  // ★displayGates.js は "@/lib/translations" を別名 import しており、
  //   data: URL からは解決できません。翻訳だけをスタブに差し替えて読み込みます
  //   （display-gates.test.js が既に採っているやり方に合わせています）。
  const raw = readRaw("lib", "displayGates.js");
  const stubbed = raw.replace(
    /import \{ createTranslator \} from "@\/lib\/translations";/,
    "const createTranslator = () => (key) => key;"
  );
  if (stubbed === raw) throw new Error("translations の import 行が見つかりません。スタブの差し替えに失敗しています。");
  const m = await import("data:text/javascript;base64," + Buffer.from(stubbed, "utf-8").toString("base64"));
  const { evaluateGate, gateAllows, NARRATIVE_MIN_N_PER_GROUP, NARRATIVE_MIN_EFFECT_SIZE, NARRATIVE_FDR_Q } = m;

  // 3つの門を全部持つゲートを、定義の中から選ぶ（キー名を決め打ちしない）
  const narrativeKey = (m.GATES.find((g) => g.minNPerGroup != null && g.minEffectSize != null && g.requiresFdrPass) || {}).key;
  assertTrue(!!narrativeKey, `3つの門を全部持つゲートがある（${narrativeKey}）`);
  const base = { n1: 20, n0: 20, effectSize: 0.6, fdrPass: true, days: 400 };

  console.log("=== 3つ全部そろえば通る ===");
  assertEqual(evaluateGate(narrativeKey, base).passed, true, "件数・効果量・多重比較が揃えば通る");

  console.log("\n=== ★件数が足りなければ通らない ===");
  const few = evaluateGate(narrativeKey, { ...base, n1: NARRATIVE_MIN_N_PER_GROUP - 1 });
  assertEqual(few.passed, false, `片群が ${NARRATIVE_MIN_N_PER_GROUP - 1} なら通らない`);
  assertEqual(few.reason, "count", "理由は件数");
  console.log("\n=== ★片方の群が空でも通らない ===");
  assertEqual(evaluateGate(narrativeKey, { ...base, n0: 0 }).passed, false, "片群が0なら通らない");

  console.log("\n=== ★効果量が足りなければ通らない ===");
  const weak = evaluateGate(narrativeKey, { ...base, effectSize: NARRATIVE_MIN_EFFECT_SIZE - 0.01 });
  assertEqual(weak.passed, false, `|g| が ${NARRATIVE_MIN_EFFECT_SIZE} 未満なら通らない`);
  assertEqual(weak.reason, "effect", "理由は効果量");

  console.log("\n=== ★多重比較を通っていなければ通らない ===");
  const noFdr = evaluateGate(narrativeKey, { ...base, fdrPass: false });
  assertEqual(noFdr.passed, false, "FDR を通っていなければ通らない");
  assertEqual(noFdr.reason, "fdr", "理由は多重比較");
  assertEqual(evaluateGate(narrativeKey, { ...base, fdrPass: undefined }).passed, false,
    "★FDR が未計算のときも通らない（無いものを通したことにしない）");

  console.log("\n=== ★通らないとき、数値を1つも返さない ===");
  console.log("     文章を止めても数字が出ていれば、読む人は同じ結論に至ります。");
  [few, weak, noFdr].forEach((r, i) => {
    const numeric = Object.entries(r).filter(([k, v]) =>
      typeof v === "number" && !["remaining"].includes(k));
    assertEqual(numeric.map(([k]) => k), [], `★${i + 1}件目が、数値を返していない`);
    assertTrue(!/[0-9]+\.[0-9]+/.test(String(r.message || "")),
      `★${i + 1}件目の文章に、効果量やpの値が入っていない`);
  });

  console.log("\n=== ★境界はどちらに倒れるか ===");
  assertEqual(evaluateGate(narrativeKey, { ...base, n1: NARRATIVE_MIN_N_PER_GROUP, n0: NARRATIVE_MIN_N_PER_GROUP }).passed,
    true, `n = ${NARRATIVE_MIN_N_PER_GROUP} ちょうどは通る`);
  assertEqual(evaluateGate(narrativeKey, { ...base, effectSize: NARRATIVE_MIN_EFFECT_SIZE }).passed,
    true, `|g| = ${NARRATIVE_MIN_EFFECT_SIZE} ちょうどは通る`);

  console.log("\n=== 効果量は絶対値で見る（悪い方向の発見も、発見） ===");
  assertEqual(evaluateGate(narrativeKey, { ...base, effectSize: -0.6 }).passed, true, "負の効果量でも通る");

  console.log("\n=== ★知らないゲートは通さない ===");
  assertEqual(evaluateGate("そんなゲートは無い", base).passed, false, "未定義のキーは通らない");
  assertEqual(gateAllows("そんなゲートは無い", base), false, "短縮形でも通らない");

  console.log("\n=== ★通らなかったときは、必ず「あと◯で何が見えるか」を返す（§6-3） ===");
  assertTrue(!!few.message, "件数不足のときに文章がある");
  assertTrue(!/データ不足/.test(String(few.message)), "★「データ不足」とは書かない");
  assertTrue(!!weak.message, "効果量不足のときにも文章がある");

  console.log("\n=== ★画面が、条件を自前で書いていない ===");
  const ui = readCode("components", "VocalTracker.jsx");
  // ★件数のしきい値を、画面に直接書いていないこと。
  //   書くと、§6-1 のしきい値を変えたときに片方だけ古いまま残る。
  assertTrue(!/n1 >= 10|n0 >= 10|n1 < 10|n0 < 10/.test(ui),
    "★件数のしきい値（10）を画面に直接書いていない");
  assertTrue(/NARRATIVE_MIN_N_PER_GROUP/.test(ui), "件数のしきい値は定数を参照している");
  // ※ correlationLabel の 0.4 / 0.7 は「相関の強さの言い方」の帯で、
  //   ρ の別の尺度。displayGates のしきい値とは別物なので対象外。
  const usesGate = (ui.match(/gateAllows\(|evaluateGate\(|gateMessage\(/g) || []).length;
  assertTrue(usesGate >= 8, `画面が表示ゲートを${usesGate}箇所で経由している`);
  assertTrue(/NARRATIVE_FDR_Q/.test(ui), "FDR のしきい値も、定数を参照している");

  console.log(`\n合計: ${passCount}件成功 / ${failCount}件失敗`);
  if (failCount > 0) { console.log("\n⚠ 失敗があります。"); process.exit(1); }
  console.log("\n✓ すべて成功しました。");
}
main().catch((e) => { console.error(e); process.exit(1); });
