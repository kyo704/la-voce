#!/usr/bin/env node
/**
 * 「今日の中核」ブロックを作らない（2026-08-30 の判断）
 *
 * 出典 docs/lavoce-判断-今日の中核ブロックと画面の言葉.md
 *
 * ★なぜ要るか
 *   いちど「今日の中核」という枠を作って最上部に置きましたが、
 *   ★それ自体が誤りでした。理由は2つです。
 *     ① 5項目のうち、利用者が入力するのは3つだけ。
 *        絶対湿度は自動取得、本番の翌日かは活動の記録から導出します。
 *        入力しないものを入力欄と並べると、埋まらない欄に見えます。
 *     ② 「中核」は★設計のことばです。画面に出す言葉ではありません（§1-3・§5）。
 *
 *   器はすでにありました。かんたん（30秒）モードです。
 */
const { readCode, readRaw } = require("./_source");
let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

const vt = readCode("components", "VocalTracker.jsx");
const raw = readRaw("components", "VocalTracker.jsx");

(async () => {
  const fam = await import("../../lib/analysisFamilies.js");

  console.log("=== ★① 「中核」という枠を作っていない ===");
  assertTrue(!/SectionCard title="今日の中核"/.test(raw), "★「今日の中核」の枠が無い");
  assertTrue(!/中核/.test(vt.replace(/\{\/\*[\s\S]*?\*\/\}/g, "")),
    "★画面に出す文字に「中核」が無い（コメントは除く）");

  console.log("\n=== ★② かんたんモードに5つある ===");
  const i = vt.indexOf("30秒で記録");
  const j = vt.indexOf("もっと記録する", i);
  assertTrue(i > 0 && j > i, "かんたんモードのかたまりが見つかる");
  const quick = vt.slice(i, j);
  [
    ["labelThroatCondition", "のどの調子"],
    ["labelVoiceQuality", "声の出来"],
    ["昨夜の睡眠", "睡眠"],
    ["EdemaSelector", "むくみ"],
    ["SPEECH_MINUTE_CHOICES", "本番外の発話時間"]
  ].forEach(([needle, name]) => {
    assertTrue(quick.includes(needle), `かんたんモードに「${name}」がある`);
  });

  console.log("\n=== ★③ 増えたことを強調していない ===");
  assertTrue(!/5つ|5項目|5つだけ/.test(quick), "★「5つ」と書いていない（§1-2）");
  assertTrue(!/増え/.test(quick), "★「増えました」と書いていない");

  console.log("\n=== ★④ 入力欄を作らないもの ===");
  // 絶対湿度：専用の入力欄を作らない。環境セクションの気温・湿度だけ。
  assertTrue(!/absoluteHumidity.*NumberField|NumberField.*absoluteHumidity/.test(vt),
    "★絶対湿度そのものの入力欄が無い");
  assertTrue(/labelTemperature/.test(vt) && /labelHumidity/.test(vt),
    "★手入力の逃げ道（気温・湿度）は残っている（憲章 §4-2）");
  // 本番の翌日か：導出のみ。聞かない。
  assertTrue(/dayAfterPerformance: prevEntry \?/.test(readCode("lib", "analysisFamilies.js")),
    "★本番の翌日かは、前日の活動から導出している");
  assertTrue(!/dayAfterPerformance[\s\S]{0,120}(onChange|Selector|NumberField|Chip)/.test(vt),
    "★本番の翌日かを、利用者に聞いていない");

  console.log("\n=== 記録率の対象は、lib の一覧と揃っている ===");
  const block = vt.slice(vt.indexOf("const coreFillCounts"), vt.indexOf("const CORE_FILL_LABEL"));
  fam.CORE_FAMILY.forEach((k) => {
    assertTrue(block.includes(k + ":"), `記録率が ${k} を見ている`);
  });

  console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
  process.exit(failCount === 0 ? 0 : 1);
})();
