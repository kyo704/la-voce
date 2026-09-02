#!/usr/bin/env node
/**
 * 廃止した「公開範囲」を、画面の文言に残さない（2026-09-02）
 *
 * ★共有範囲（shareScope）は 2026-09-01 に廃止しました。
 *   先生に、記録への常時アクセスはありません。ひとつもありません。
 *   ★仕組みを消しても、それを説明する文言が残っていると、
 *     利用者は「まだある」と読みます。
 *   実際、生徒一覧の空の画面に
 *     「生徒が公開範囲を変更・解除すると、この画面の表示もすぐに切り替わります」
 *   が残っていました。★2か所まちがっています。
 *     ① 公開範囲は、もうありません
 *     ② 「すぐに切り替わります」も本当ではありません（購読が1つもない）
 *
 * ★検査はコメントを外したソースで行います。
 *   この repo では、自分の説明コメントに引っかかる失敗を3回やっています。
 */
const { readCode } = require("./_source");

let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

const tracker = readCode("components", "VocalTracker.jsx");
const trans = readCode("lib", "translations.js");

console.log("=== ★廃止した仕組みを、案内していないこと ===");
{
  [
    ["公開範囲", "公開範囲（shareScope の言い方）"],
    ["共有範囲を変更", "共有範囲を変更"],
    ["共有する項目を選び直", "共有する項目を選び直す"]
  ].forEach(([phrase, label]) => {
    assertTrue(!tracker.includes(phrase), `★画面に「${label}」が無い`);
    assertTrue(!trans.includes(phrase), `★翻訳表に「${label}」が無い`);
  });
}

console.log("=== ★「すぐに切り替わる」と書かないこと ===");
{
  // 購読は1つもない。見ている最中には変わらない。
  assertTrue(!/すぐに切り替わります/.test(tracker), "★「すぐに切り替わります」が無い");
  assertTrue(!/リアルタイムで反映/.test(tracker), "★「リアルタイムで反映」が無い");
  assertTrue(!/\.channel\(|postgres_changes/.test(tracker),
    "★購読を足していない（足すなら、文言も一緒に直すこと）");
}

console.log("=== 何が出る一覧なのかを、書いてあること ===");
{
  assertTrue(/招待コードでつながった生徒だけです/.test(tracker),
    "1対1のつながりだけ、と書いてある");
  assertTrue(/「担当」に割り当てられた生徒は、ここには出ません/.test(tracker),
    "★教室の担当とは別だ、と書いてある");
}

console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
process.exit(failCount === 0 ? 0 : 1);
