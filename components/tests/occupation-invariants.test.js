#!/usr/bin/env node
/**
 * 職業を声の型で切り直す §12「テストで固定すること」のうち、
 * ほかのテストが受け持っていない3つ。
 *
 *   □ 職業を変えても、過去の日次レコードが1行も変わらない
 *   □ 出力の文言に、職業名を使った比較が1つもない
 *   □ 削除対象の列について、行数を数えるクエリが実行された記録がある
 *
 * ★残りの4つは、それぞれの持ち場で固定しています。
 *     移行前後で分析結果が動かない … occupation.test.js テスト5
 *     辞書に無い職業のフォールバック … vocabulary.test.js テスト2
 *     閾値を超えた型のぶんだけ出る … type-fields.test.js テスト1
 *     型別項目が検定に入っていない … type-fields.test.js テスト5
 */
const fs = require("fs");
const path = require("path");
const { ROOT, readCode, readRaw } = require("./_source");
let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

async function main() {
  const vt = readCode("components", "VocalTracker.jsx");
  const vtRaw = readRaw("components", "VocalTracker.jsx");

  console.log("=== §12-2: ★職業を変えても、過去の日次レコードが1行も変わらない ===");
  // 職業を選ぶところが書き込むのは、プロフィールの3つだけ。
  const at = vt.indexOf("occupation: occ");
  assertTrue(at >= 0, "選ぶ画面がある");
  const block = vt.slice(at, at + 220);
  assertTrue(!/entries/.test(block), "★選ぶ画面が entries に触れていない");
  assertTrue(!/upsert|\.delete\(/.test(block), "★選ぶ画面が記録を書き換えていない");

  // 記録の変換が、職業も配合も読んでいない。読んでいなければ、
  // 職業を変えても保存される中身は変わりようがない。
  const mapStart = vt.indexOf("function entryToRow");
  const mapEnd = vt.indexOf("\n}", vt.indexOf("return {", mapStart));
  const mapper = vt.slice(mapStart, mapEnd);
  ["occupation", "voice_mix", "voiceMix", "vocal_profession", "DEFAULT_MIX", "occupationOf"].forEach((w) => {
    assertTrue(!mapper.includes(w), `★entryToRow が ${w} を読んでいない`);
  });
  const readStart = vt.indexOf("function rowToEntry");
  const reader = vt.slice(readStart, vt.indexOf("\n}", vt.indexOf("return {", readStart)));
  ["occupation", "vocal_profession", "DEFAULT_MIX"].forEach((w) => {
    assertTrue(!reader.includes(w), `★rowToEntry が ${w} を読んでいない`);
  });

  console.log("\n=== §12-6: ★出力の文言に、職業名を使った比較が1つもない（§10-3・§10-4） ===");
  // 職業名 × 比較の語 が同じ文の中に出ていないこと。
  // ★コメントを外した本文だけを見る。禁止を説明したコメント自身で落ちるため。
  const OCC_WORDS = ["声楽家", "ミュージカル", "ポップス", "声優", "ナレーター",
                     "アナウンサー", "俳優", "落語", "司会"];
  const CMP_WORDS = ["の平均", "と比べ", "より高い", "より低い", "順位", "ランキング",
                     "の方は", "の人は傾向", "全体の"];
  const files = [["components", "VocalTracker.jsx"], ["lib", "occupation.js"],
                 ["lib", "vocabulary.js"], ["lib", "typeFields.js"],
                 ["lib", "analysisFamilies.js"], ["lib", "displayGates.js"]];
  files.forEach((f) => {
    const code = readCode(...f);
    const sentences = code.split(/[。\n]/);
    const bad = sentences.filter((s) =>
      OCC_WORDS.some((o) => s.includes(o)) && CMP_WORDS.some((c) => s.includes(c)));
    assertTrue(bad.length === 0,
      `★${f.join("/")} に職業名を使った比較が無い${bad.length ? `（${bad[0].trim().slice(0, 40)}…）` : ""}`);
  });

  console.log("\n=== §12-7: 数えた記録が残っている（§6・§10-9） ===");
  // ★「消す前に数えた」ことを、あとから確かめられる形で残す。
  const countingSql = ["check_dead_field_rows.sql", "check_detail_keys.sql"];
  countingSql.forEach((f) => {
    const p = path.join(ROOT, "supabase", f);
    assertTrue(fs.existsSync(p), `数えるSQL ${f} が置いてある`);
  });
  // 消した経緯が、コードの中に残っている（何を・いつ・何件だったか）
  assertTrue(/数えた結果/.test(vtRaw), "★消した経緯（数えた結果）がコードに残っている");
  assertTrue(/0件/.test(vtRaw), "★件数が書かれている");
  // 死んでいた項目が、こっそり復活していないこと
  ["passaggioCrossings", "vocalRangeLowUsed", "vocalRangeHighUsed", "dynamicsRange"].forEach((k) => {
    assertTrue(!vt.includes(k), `★${k} が復活していない`);
  });
  // ★名前が似ているだけの別物は、生きていること（間違えて消さない）
  assertTrue(vt.includes("passaggioFeel"), "★通過感（passaggioFeel）は残っている");
  assertTrue(vt.includes("passaggioStability"), "★通過感の分析も残っている");

  console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
  process.exit(failCount === 0 ? 0 : 1);
}
main();
