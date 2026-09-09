#!/usr/bin/env node
// ============================================================================
// 質問票の 名前 ── 病名と 原尺度名を、画面から 外す（2026-09-09）
//
//   ★出どころ docs/opus/woolsong-裁定-分析機能へのFableの査読（9月9日・夜）.md §4・§6
//     §4「✕ 画面の題名に 病名を出す → ★出しません」
//     §6「★私たちは 合計点も 閾値も 出しません。★つまり『尺度として 使っていません』。
//        → ★なら、★項目文を そのまま 借りる理由が ありません。」
//
//   ★★残すもの
//     ★既往症の一覧（CONDITION_OPTIONS）は ★残します。
//       ★ご本人が「私は これです」と 書く欄です。★こちらが 言うのとは 別です。
//     ★出典（原尺度名・論文）は「学ぶ」の記事と、収集データ拡張案に 残します（★§6）。
//
//   ★★項目文そのものの 書き直しは 11月です（★坂本さんのお決め・9月9日）。
//     ★この見張りは 名前だけを 見ます。★項目文には 触れません。
// ============================================================================

const { readCode, readRaw } = require("./_source");

let ok = 0, ng = 0;
function t(cond, label) {
  if (cond) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label); ng++; }
}

const vt = readCode("components", "VocalTracker.jsx");

console.log("=== ① 新しい4つの 名前 ===");
["のどのようす", "声のつかれ", "歌うことの困りごと", "歌いやすさ"].forEach((n) => {
  t(new RegExp(`name: "${n}"`).test(vt), `「${n}」が 入っている`);
});

console.log("\n=== ② 画面に出る文字列に、原尺度名・病名が 無い ===");
// ★★文字列（" で囲まれたもの）だけを 見ます。
//   ★VERSION は RSI を 字として 含みます。★素の grep では 拾えません。
const strings = (vt.match(/"[^"\n]*"/g) || []);
const bad = strings.filter((x) =>
  /(^|[^A-Za-z])(RSI|VFI|EASE|SVHI)([^A-Za-z]|$)/.test(x) || /逆流症状/.test(x));
t(bad.length === 0, `画面の文字列に 原尺度名が 無い${bad.length ? "：" + bad.slice(0, 3).join(" / ") : ""}`);

console.log("\n=== ③ 出典は 画面から 外れている ===");
t(!/\{def\.fullName\}/.test(vt), "★原尺度名（fullName）を 画面に 出していない");
t(!/\{def\.citation\}/.test(vt), "★出典（citation）を 画面に 出していない");
// ★★消してはいません。★持っています。★出していないだけです。
t(/citation: "/.test(vt), "★出典そのものは、★消さずに 持っている");

console.log("\n=== ④ 消してはいけないもの ===");
t(/key: "gerd", label: "逆流性食道炎"/.test(vt),
  "★既往症の一覧は 残っている（★ご本人が 書く欄）");
t(/key: "lpr"/.test(vt), "★咽喉頭酸逆流も 残っている");

console.log("\n=== ⑤ 出典の 置き場所 ===");
const shu = readRaw("docs", "lavoce-収集データ拡張案.md");
t(/Reflux Symptom Index/.test(shu), "★収集データ拡張案に、原尺度名が 残っている");
t(/のどのようす/.test(shu), "★新しい名前との 対応表が ある");
t(/歌いやすさ/.test(shu), "★4つとも 対応表に ある");
// ★★よそと くらべる 言い方が、★取り消されていること
t(/~~「あなたのVFIは同年代の演奏家の平均より低い」/.test(shu),
  "★★「同年代の平均より」は 取り消されている（★よそと くらべない）");
const learn = readRaw("lib", "learnContent.js");
t(/Reflux Symptom Index|RSI（逆流症状インデックス）/.test(learn),
  "★「学ぶ」の記事に、出典が 残っている（★§6）");

console.log(ng === 0 ? `\n✅ 全て通りました  成功:${ok} 失敗:0` : `\n❌ 失敗あり  成功:${ok} 失敗:${ng}`);
process.exit(ng > 0 ? 1 : 0);
