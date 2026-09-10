#!/usr/bin/env node
// ============================================================================
// 削除17点 ── 消したものが、戻ってこないための 見張り
//
//   ★出どころ docs/opus/woolsong-00-実行ルート-v5（9月7日・夜・正）.md §7
//   ★2026-09-09、坂本さんのお決め：「推奨（すべて消す・止める）で進めてください」
//
//   ★★消し方の 決め ── 記録そのものは、★1つも 消しません。
//     ★列も、★これまでに 書かれた値も、★書き出しも、★そのままです。
//     ★消したのは「こちらから 言う言葉」と「呼ばれない 計算」だけです。
//
//   ★★禁じた語は、★必ずコメントを外した本文で 探すこと（★_source.js）。
//     ★消したことを 説明するコメントに、★消したはずの名前が 書いてあります。
// ============================================================================

const { readCode, readRaw } = require("./_source");

let ok = 0, ng = 0;
function t(cond, label) {
  if (cond) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label); ng++; }
}

const code = readCode("components", "VocalTracker.jsx");
const paused = readCode("lib", "pausedFeatures.js");

console.log("=== 1 エネルギー可用性 ===");
t(!/摂取エネルギーが、推定の必要量を下回る/.test(code),
  "★「必要量を下回る」と 言わない");
t(!/\benergyAvailabilityAnalysis\b/.test(code), "計算そのものが 無い");
t(!/\bcomputeEnergyAvailability\b/.test(code), "computeEnergyAvailability が 無い");
t(!/\bcomputeFFM\b/.test(code), "computeFFM が 無い");
t(!/\bestimateBodyFatPct\b/.test(code), "estimateBodyFatPct が 無い");
t(/\bcomputeBMI\b/.test(code), "★computeBMI は 残っている（★記録画面が読む）");
// ★記録は 消していないこと
t(/\bweightKg\b/.test(code), "★体重の記録は 残っている");
t(/\bbodyFatPct\b/.test(code), "★体脂肪率の記録は 残っている");

console.log("\n=== 3 AIアドバイス ===");
t(!/\{activeTab === "advice" &&/.test(code), "画面が 無い");
t(!/setActiveTab\("advice"\)/.test(code), "入口も 無い");
t(!/const AI_ADVICE_ENABLED/.test(code), "止めの札が 無い");
t(!/\badviceText\b|\badviceLoading\b|\badviceGeneratedAt\b/.test(code), "覚えが 無い");
t(!/\bhandleGenerateAdvice\b/.test(code), "呼び出しが 無い");

console.log("\n=== 4 声の調子スコア 69/100 ===");
t(!/\bvocalConditionScore\b/.test(code), "計算そのものが 無い");
t(!/scoreCompVoice|scoreCompThroat/.test(code), "内訳の 見出しも 無い");

console.log("\n=== 2' 栄養の「不足」の判定 ===");
t(!/\bevaluateIntake\b/.test(code), "判定そのものが 無い");
t(!/evalInsufficient/.test(code), "「不足」の 語を 呼ばない");
// ★撤回された2番（栄養素の合計）は、★残っていること
t(/\brecordedMacroTotals\b/.test(code), "★栄養素の合計は 残っている（★9月8日の撤回・2番）");
t(/\busualMacroTotals\b/.test(code), "★「ふだん」も 残っている");
t(!/\bmealTotals\b/.test(code), "呼ばれない mealTotals は 無い");

console.log("\n=== 10 環境の快適帯 ===");
t(!/\bcomfortZone2D\b/.test(code), "2次元マップの 計算が 無い");
t(!/\benvEntries\b/.test(code), "その材料も 無い");
t(/\bhumidity\b/.test(code), "★湿度の記録は 残っている");
t(/\btemperature\b/.test(code), "★気温の記録は 残っている");

console.log("\n=== 14 音色の均一感 ===");
t(/TONE_EVENNESS_INPUT_ENABLED/.test(paused), "止めの札が lib にある");
t(/"record\.toneEvenness"/.test(paused), "止めている一覧に 入っている");
t(/TONE_EVENNESS_INPUT_ENABLED &&/.test(code), "★画面は、その札に 尋ねている");
t(!/entry\.toneEvenness \?\? 3[\s\S]{0,80}onChange/.test(code.replace(/TONE_EVENNESS_INPUT_ENABLED &&[\s\S]{0,600}?\)\}/g, "")),
  "★札を通さずに 尋ねる所が 無い");
// ★書かれた値を 消していないこと
t(/\btoneEvenness\b/.test(code), "★列の 読み書きは 残っている（★消していない）");
t(/tone_evenness は消しません/.test(readRaw("lib", "pausedFeatures.js")),
  "★消さないと 書いてある");

console.log("\n=== 7・12 文は 残す（★坂本さんのお決め・現状のまま） ===");
t(/\btopLagFinding\b/.test(code), "★時差の文は 残っている（★9番は撤回）");
t(/\beffectiveHabitRanking\b/.test(code), "★効いた習慣の文は 残っている");

console.log("\n=== 16・17 撤回された2点は 残す ===");
t(/computeEntryPoints/.test(readCode("lib", "character.js")), "★ポイント制は 残っている");
t(/labelTodayWeight/.test(code), "★体重の記録は 残っている");

console.log("\n=== 数え上げ2か所 ── ★1つは 消えました ===");
// ★★2026-09-09、★坂本さんは「数え上げ2か所は 残す」と お決めに なりました。
//   ★★2026-09-10、★その うちの 1つを 消す、と お決めが 変わりました ──
//     「nextUnlock（◯日で『◯◯』が 開きます）も 削除してください。
//       ★⑫と 同じ 原則（あと◯日を 出さない）に 明確に 抵触するため」
//   ★★見張りを 消さずに、★新しい お決めの ほうへ 向け直します。
//     ★戻ってきたら 気づけるように、★「無いこと」を 見ます。
t(!/がひらきます/.test(code), "★「あと◯日でひらきます」は 消えた（★2026-09-10）");
t(!/nextUnlock/.test(code), "★もとの 計算も 消えた");

console.log(ng === 0 ? `\n✅ 全て通りました  成功:${ok} 失敗:0` : `\n❌ 失敗あり  成功:${ok} 失敗:${ng}`);
process.exit(ng > 0 ? 1 : 0);
