#!/usr/bin/env node
/**
 * 質問票のまわりの文言（設計憲章 §2-1）
 *
 * ★なぜ要るか
 *   2026-08-29 の文言監査で、2件の違反が見つかりました。
 *     ① 「13点を超えると、喉頭咽頭逆流症（LPR）の疑いの目安とされています」
 *     ② 本人の点数の隣に「（基準値 13）」を併記し、超えると色まで変えていた
 *   どちらも、点数を見た人に医学的な判断を示唆する形でした。
 *
 * ★監査そのものにも漏れがありました。
 *   「疑い」の字面だけを探したため、EASE の「疑われる」（活用形）が
 *   1件残っていました。この試験は活用形も見ます。
 *
 * ★守りたいこと
 *   ① 質問票の説明文に、病名の「疑い」を出さない
 *   ② 文献のしきい値を、本人の点数と同じ画面に出さない（§2-1）
 *   ③ しきい値を超えたかどうかで、色を変えない（点数に合否を付けない）
 */
const { readCode, readRaw } = require("./_source");
let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

const code = readCode("components", "VocalTracker.jsx");
const raw = readRaw("components", "VocalTracker.jsx");

console.log("=== ★説明文に、禁止の語を出さない（§2-1） ===");
// cutoffNote は本人の点数と同じカードに出ます。
const notes = (code.match(/cutoffNote: "[^"]*"/g) || []);
assertTrue(notes.length >= 3, `説明文が見つかる（${notes.length}件）`);
// ★「疑い」だけでなく活用形も。監査はここを見落としました。
[["疑い", "疑い"], ["疑わ", "疑われる・疑わしい（活用形）"], ["基準値", "基準値"],
 ["リスク", "リスク"], ["正常", "正常"], ["異常", "異常"], ["早期発見", "早期発見"], ["予防", "予防"]
].forEach(([w, label]) => {
  const hit = notes.filter((n) => n.includes(w));
  assertTrue(hit.length === 0, `★説明文に「${label}」が無い${hit.length ? "（" + hit[0].slice(0, 40) + "…）" : ""}`);
});

console.log("\n=== ★しきい値の点数を、説明文に書かない ===");
// 「13点を超えると」のような書き方は、基準値の併記と同じことになります。
const withNumber = notes.filter((n) => /\d+(\.\d+)?点(を超え|以上|以下|未満)/.test(n));
assertTrue(withNumber.length === 0,
  `★説明文に、しきい値の点数が無い${withNumber.length ? "（" + withNumber[0].slice(0, 40) + "…）" : ""}`);

console.log("\n=== ★基準値を、本人の点数の隣に出さない ===");
assertTrue(!/（基準値 \{/.test(code), "★「（基準値 …）」の併記が無い");
assertTrue(!/def\.cutoff\b/.test(code), "★cutoff を画面で読んでいない");
// 超えたかどうかで色を変えていないこと。
assertTrue(!/total_score\s*>=\s*def\.cutoff/.test(code), "★しきい値との比較で色を変えていない");
assertTrue(!/total_score\s*[<>]=?\s*\w*[Cc]utoff/.test(code), "★別の書き方でも比べていない");

console.log("\n=== 点数そのものは、これまでどおり出す ===");
// ★消しすぎていないこと。本人の点数は本人のものです。
assertTrue(/\{latest\.total_score\}/.test(code), "直近の合計点は出ている");

console.log("\n=== 書き戻しの歯止め ===");
// ★コメントとして注意書きが残っていること（readRaw：コメントも位置として数える）
assertTrue(/基準値を、個人の数値と同じ画面に置かない/.test(raw),
  "★なぜ出さないかが、コードのそばに書いてある");

console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
process.exit(failCount === 0 ? 0 : 1);
