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
  // ★空文字は「出さないと決めた」という答えなので、取りこぼしではありません。
  //   undefined（書き忘れ）だけを取りこぼしとして数えます。
  O.OCCUPATIONS.forEach((occ) => {
    const missing = V.TERM_KEYS.filter((k) => typeof V.term(occ, k) !== "string");
    assertEqual(missing, [], `${occ} の呼び名が全部そろっている`);
  });
  assertEqual(V.TERM_KEYS.length, 9, "差し替える語は9つ（2026-08-30 に3つ追加）");

  console.log("\n=== テスト2: 辞書に無いものは声楽の言葉に落ちる（§4） ===");
  // ★2026-08-30：actorScreen / mc / other は、辞書に明示しました。
  //   「その他」の人に「テッシトゥーラ」が出ていたためです（用語辞書の拡張 §1-4）。
  //   落ちる規則そのものは変えていないので、★本当に知らない職業で確かめます。
  const base = Object.fromEntries(V.TERM_KEYS.map((k) => [k, V.term("classical", k)]));
  assertEqual(Object.fromEntries(V.TERM_KEYS.map((k) => [k, V.term("trombone", k)])), base,
    "★辞書に無い職業は、いまも声楽の言葉に落ちる");
  assertEqual(V.term("trombone", "performanceDay"), "本番", "知らない職業でも落ちる");
  assertEqual(V.term("classical", "knownNothing"), "", "知らない語は空文字（勝手に作らない）");

  console.log("\n=== テスト3: 仕様書 §4 の表のとおりか ===");
  const TABLE = {
    classical:  ["本番", "合わせ", "レッスン", "練習以外で話した時間", "発声", "本番の翌日"],
    musical:    ["本番", "稽古", "レッスン", "練習以外で話した時間", "ウォームアップ", "公演の翌日"],
    actorStage: ["公演", "稽古", "稽古", "稽古以外で話した時間", "発声", "公演の翌日"],
    voiceActor: ["収録", "テスト", "レッスン", "収録以外で話した時間", "喉ならし", "収録の翌日"],
    narrator:   ["収録", "下読み", "レッスン", "練習以外で話した時間", "喉ならし", "収録の翌日"],
    // ★「打ち合わせ」は声を出さないので、下読みに訂正しました（2026-08-30）。
    announcer:  ["生放送", "下読み", "研修", "放送以外で話した時間", "発声", "放送の翌日"],
    rakugo:     ["高座", "ネタ稽古", "稽古", "練習以外で話した時間", "声出し", "高座の翌日"],
    pops:       ["ライブ", "リハ", "レッスン", "練習以外で話した時間", "ウォームアップ", "ライブの翌日"]
  };
  // ★表は最初の6語ぶんです。2026-08-30 に足した3語は、下のテスト3-2 で見ます。
  const TABLE_KEYS = V.TERM_KEYS.slice(0, 6);
  Object.entries(TABLE).forEach(([occ, words]) => {
    assertEqual(TABLE_KEYS.map((k) => V.term(occ, k)), words, `${occ} の行が表のとおり`);
  });

  console.log("\n=== テスト3-2: 2026-08-30 に足した語（用語辞書の拡張 §1-4） ===");
  // カードの見出し
  const CARDS = { classical: "曲目", musical: "曲目", pops: "曲目", voiceActor: "役",
    narrator: "案件", announcer: "番組", actorStage: "作品", actorScreen: "作品",
    rakugo: "演目", mc: "案件", other: "演目" };
  Object.entries(CARDS).forEach(([occ, w]) =>
    assertEqual(V.term(occ, "repertoireCard"), w, `${occ} のカードは「${w}」`));
  // ★「テッシトゥーラ」は声楽とミュージカルだけ。ほかでは絶対に出しません。
  O.OCCUPATIONS.filter((o) => o !== "classical" && o !== "musical").forEach((occ) => {
    assertTrue(V.term(occ, "tessitura") !== "テッシトゥーラ",
      `★${occ} に「テッシトゥーラ」を出さない`);
  });
  assertEqual(V.term("pops", "tessitura"), "よく出てくる高さ", "ポップスは「よく出てくる高さ」");
  // ★仕様書 §1・§2 の表と、1行ずつ突き合わせます。
  //   逐語の文書を読む前は、actorStage を「作品」、other を「演目・非表示」と
  //   推測していました。★どちらも表と違いました。推測を固定しないための表です。
  const SPEC = {
    classical:  ["曲目", "曲を追加", "テッシトゥーラ"],
    musical:    ["曲目", "曲を追加", "テッシトゥーラ"],
    pops:       ["曲目", "曲を追加", "よく出てくる高さ"],
    voiceActor: ["役", "役を追加", ""],
    actorStage: ["演目", "演目を追加", "台詞の高さ"],
    actorScreen:["作品", "作品を追加", "台詞の高さ"],
    narrator:   ["案件", "案件を追加", ""],
    announcer:  ["番組", "番組を追加", ""],
    rakugo:     ["演目", "演目を追加", ""],
    mc:         ["案件", "案件を追加", ""],
    other:      ["曲目", "曲を追加", "よく出てくる高さ"]
  };
  Object.entries(SPEC).forEach(([occ, [card, add, tess]]) => {
    assertEqual([V.term(occ, "repertoireCard"), V.term(occ, "repertoireAdd"), V.term(occ, "tessitura")],
      [card, add, tess], `${occ} が仕様書の表のとおり`);
  });
  assertEqual(V.term("actorStage", "tessitura"), "台詞の高さ", "舞台俳優は「台詞の高さ」");
  // ★落語と声優は、坂本さんの確認待ち。空文字＝出さない、で止めています。
  assertEqual(V.term("rakugo", "tessitura"), "", "★落語は空（確認待ちなので出さない）");
  assertEqual(V.term("voiceActor", "tessitura"), "", "★声優も空（確認待ちなので出さない）");
  assertEqual(V.term("narrator", "tessitura"), "", "ナレーターは出さない");
  assertEqual(V.term("announcer", "tessitura"), "", "アナウンサーは出さない");

  console.log("\n=== ★アナウンサーの「打ち合わせ」の訂正 ===");
  // 打ち合わせは声を出さない。この欄は「声を使ったか」を記録する場所。
  assertEqual(V.term("announcer", "rehearsalDay"), "下読み", "★下読みに直っている");
  O.OCCUPATIONS.forEach((occ) =>
    assertTrue(V.term(occ, "rehearsalDay") !== "打ち合わせ", `★${occ} に「打ち合わせ」が無い`));

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
