#!/usr/bin/env node
/**
 * 用語辞書（職業を声の型で切り直す.md §4）のテスト。
 *
 * ★いちばん守りたいのは「呼び名を変えても、保存される値は変わらない」こと。
 *   このアプリでは「本番」「リハーサル」「レッスン」が、画面の文字であると
 *   同時に activity_type / activity.kind の値そのものです。発声負荷の重み
 *   ACTIVITY_LOAD_WEIGHT も、この文字列を鍵にしています。辞書が kind を
 *   書き換えると、過去の記録の重みが変わり、分析結果が動きます。
 *
 * ★次に守りたいのは、職業の一覧とのズレ。
 *   lib/vocabulary.js は lib/occupation.js を import しません（lib の各
 *   モジュールは1つずつ独立して読めるようにしてある）。import しない代わりに、
 *   ここで両方を読んで、取りこぼしが無いことを確かめます。
 */
const fs = require("fs");
const path = require("path");
const { ROOT, readCode, readRaw } = require("./_source");
let passCount = 0, failCount = 0;
function assertEqual(a, b, label) {
  if (JSON.stringify(a) === JSON.stringify(b)) { console.log(`  ✓ ${label}`); passCount++; }
  else { console.log(`  ✗ ${label}  期待:${JSON.stringify(b)} 実際:${JSON.stringify(a)}`); failCount++; }
}
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }
const load = (f) => import("data:text/javascript;base64," +
  Buffer.from(fs.readFileSync(path.join(ROOT, "lib", f), "utf-8"), "utf-8").toString("base64"));

async function main() {
  const V = await load("vocabulary.js");
  const O = await load("occupation.js");

  console.log("=== テスト1: 職業の一覧との取りこぼし（★ズレの検出） ===");
  O.OCCUPATIONS.forEach((occ) => {
    const missing = V.TERM_KEYS.filter((k) => !V.term(occ, k));
    assertEqual(missing, [], `${occ} の呼び名が全部そろっている`);
  });
  assertEqual(V.TERM_KEYS.length, 6, "差し替える語は6つ");

  console.log("\n=== テスト2: 辞書に無いものは声楽の言葉に落ちる（§4） ===");
  const base = Object.fromEntries(V.TERM_KEYS.map((k) => [k, V.term("classical", k)]));
  ["actorScreen", "mc", "other"].forEach((occ) => {
    assertEqual(Object.fromEntries(V.TERM_KEYS.map((k) => [k, V.term(occ, k)])), base,
      `${occ}（表に列が無い）が声楽の言葉に落ちる`);
  });
  assertEqual(V.term("trombone", "performanceDay"), "本番", "知らない職業でも落ちる");
  assertEqual(V.term("classical", "knownNothing"), "", "知らない語は空文字（勝手に作らない）");

  console.log("\n=== テスト3: 仕様書 §4 の表のとおりか ===");
  const TABLE = {
    classical:  ["本番", "合わせ", "レッスン", "練習以外で話した時間", "発声", "本番の翌日"],
    musical:    ["本番", "稽古", "レッスン", "練習以外で話した時間", "ウォームアップ", "公演の翌日"],
    actorStage: ["公演", "稽古", "稽古", "稽古以外で話した時間", "発声", "公演の翌日"],
    voiceActor: ["収録", "テスト", "レッスン", "収録以外で話した時間", "喉ならし", "収録の翌日"],
    narrator:   ["収録", "下読み", "レッスン", "練習以外で話した時間", "喉ならし", "収録の翌日"],
    announcer:  ["生放送", "打ち合わせ", "研修", "放送以外で話した時間", "発声", "放送の翌日"],
    rakugo:     ["高座", "ネタ稽古", "稽古", "練習以外で話した時間", "声出し", "高座の翌日"],
    pops:       ["ライブ", "リハ", "レッスン", "練習以外で話した時間", "ウォームアップ", "ライブの翌日"]
  };
  Object.entries(TABLE).forEach(([occ, words]) => {
    assertEqual(V.TERM_KEYS.map((k) => V.term(occ, k)), words, `${occ} の行が表のとおり`);
  });

  console.log("\n=== テスト4: ★保存される値を書き換えていない（§4） ===");
  const code = readCode("lib", "vocabulary.js");
  ["activity_type", "activity.kind", "ACTIVITY_LOAD_WEIGHT", "entryToRow", "upsert"].forEach((w) => {
    assertTrue(!code.includes(w), `★「${w}」に触れていない`);
  });
  // 辞書が返すのは文字列だけで、保存に使える形を作らない
  assertTrue(typeof V.term("voiceActor", "performanceDay") === "string", "返すのは文字列だけ");

  console.log("\n=== テスト5: 多言語の仕組みの上に載っている（§4） ===");
  const t = (key) => `T(${key})`;
  assertEqual(V.termLabel("voiceActor", "performanceDay", "ja", t, "activityPerformance"), "収録",
    "日本語では辞書の言葉");
  assertEqual(V.termLabel("voiceActor", "performanceDay", "en", t, "activityPerformance"), "T(activityPerformance)",
    "日本語以外ではこれまでの訳語");
  assertEqual(V.termLabel("voiceActor", "performanceDay", "en", null, "activityPerformance"), "収録",
    "訳語が引けないときは辞書に落ちる");

  console.log("\n=== テスト6: lib は1つずつ独立して読める ===");
  const raw = readRaw("lib", "vocabulary.js");
  assertTrue(!/^\s*import .* from ["']\.\//m.test(raw),
    "★ほかの lib を相対 import していない（テストが1ファイルだけ読み込めるため）");

  console.log("\n=== テスト7: ★他人と比べない・職業名で語らない（§10-3・§10-4） ===");
  ["平均", "順位", "偏差値", "ランキング", "比べて"].forEach((w) => {
    assertTrue(!code.includes(w), `★「${w}」が本文に出ていない`);
  });

  console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
  process.exit(failCount === 0 ? 0 : 1);
}
main();
