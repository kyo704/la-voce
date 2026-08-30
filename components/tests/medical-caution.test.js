#!/usr/bin/env node
/**
 * 「これは診断ではありません」の文言が、1つに揃っているか（2026-08-30）
 *
 * ★なぜ要るか
 *   同じ注意が、言い回しだけ変えて4か所にありました。
 *   いちばん弱い言い方（「診断ではありません」）だけを読んだ人が、
 *   「では治療の代わりにはなるのか」と受け取る余地が残ります。
 *   ★表記ゆれではなく、安全にかかわる問題として扱います。
 *
 * ★1か所を直して他を直し忘れる、が起きないようにするためのテストです。
 */
const { readCode } = require("./_source");
let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

(async () => {
  const mc = await import("../../lib/medicalCaution.js");
  const hi = await import("../../lib/healthInfoContent.js");
  const tr = await import("../../lib/translations.js");

  console.log("=== ★注意書きは9言語そろっている ===");
  assertTrue(mc.CAUTION_LANGS.length === 9, "9言語ある");
  mc.CAUTION_LANGS.forEach((l) => {
    const v = mc.MEDICAL_CAUTION[l];
    assertTrue(typeof v === "string" && v.length > 0, `${l} の注意書きがある`);
  });
  assertTrue(mc.medicalCaution("zz") === mc.MEDICAL_CAUTION.ja, "知らない言語でも空にならない");

  console.log("\n=== ★4か所すべてに、同じ注意書きが入っている ===");
  const sites = [
    ["健康情報の冒頭", hi.HEALTH_INFO_CONTENT.disclaimer],
    ["対策の見出し", hi.HEALTH_INFO_CONTENT.s1Para4Intro],
    ["症状の節", hi.HEALTH_INFO_CONTENT.s2Note],
  ];
  sites.forEach(([name, row]) => {
    assertTrue(Object.keys(row).length === 9, `${name}：9言語ある`);
    mc.CAUTION_LANGS.forEach((l) => {
      assertTrue(row[l].includes(mc.MEDICAL_CAUTION[l]),
        `${name}（${l}）に、注意書きが一字一句そのまま入っている`);
    });
  });

  console.log("\n=== 声のスコア：画面の側で注意書きを足している ===");
  // ★lib/translations.js は他のモジュールを import できません
  //   （terminology.test.js が data:URL で読むため）。
  //   なので、注意書きは画面の側で足します。それが消えていないことを見ます。
  const vt = readCode("components", "VocalTracker.jsx");
  assertTrue(/\{t\("noteVocalScoreDisclaimer"\)\}\{medicalCaution\(language\)\}/.test(vt),
    "★声のスコアの下に、注意書きを足している");
  assertTrue(Object.keys(tr.TRANSLATIONS.noteVocalScoreDisclaimer).length === 9,
    "声のスコアの文そのものは9言語ある");
  assertTrue(!/診断/.test(tr.TRANSLATIONS.noteVocalScoreDisclaimer.ja),
    "★translations.js 側に「診断」を書き戻していない");

  console.log("\n=== ★弱い言い換えが残っていない ===");
  // ★コメントを外した本文で見ます（このテスト自身の説明に当たらないため）。
  const hiCode = readCode("lib", "healthInfoContent.js");
  const trCode = readCode("lib", "translations.js");
  [
    "診断や治療の代わりにはなりません",
    "診断ではありません。",
    "診断や絶対的な評価を示すものではなく"
  ].forEach((weak) => {
    assertTrue(!hiCode.includes(weak) && !trCode.includes(weak),
      `★古い言い回し「${weak}」が残っていない`);
  });

  console.log("\n=== 受診の案内は消していない（注意書きとは別の情報） ===");
  assertTrue(hi.HEALTH_INFO_CONTENT.disclaimer.ja.includes("耳鼻咽喉科"),
    "耳鼻咽喉科への案内が残っている");
  assertTrue(hi.HEALTH_INFO_CONTENT.s2Note.ja.includes("2週間"),
    "2週間の目安が残っている");

  console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
  process.exit(failCount === 0 ? 0 : 1);
})();
