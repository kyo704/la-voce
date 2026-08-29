#!/usr/bin/env node
/**
 * 読み込み中の formData（2026-08-29 の落ちる不具合）
 *
 * ★何が起きたか
 *   ホームで「30秒で記録する」を、読み込みが終わる前に押すと落ちていました。
 *     TypeError: Cannot read properties of null (reading 'voiceEntries')
 *
 * ★なぜ null なのか
 *   formData は useState(null) で始まり、:5219 の効果が
 *     if (loading) return;
 *   で待つため、entries の読み込みが終わるまで null のままです。
 *   ★そのあいだも画面は全部描かれます。読み込み中の画面はありません。
 *
 * ★この試験が守ること
 *   描画の中で formData を直に読むところは、必ず formData の有無で
 *   囲まれていること。1か所ずつ直すのではなく、増えたら落ちるようにします。
 *   （99か所あり、目で数え直すことはできません）
 */
const { readRaw } = require("./_source");

/**
 * ★コメントを、行数を保ったまま消す。
 *   _source.js の stripComments は複数行のコメントを丸ごと削るので、
 *   行番号がずれます。ここは「何行目が守られているか」を数えるため、
 *   行数を変えずに中身だけ空にします。
 *   （注意書きの中に formData. と書いただけで落ちていました）
 */
function maskComments(rawLines) {
  let inBlock = false;
  return rawLines.map((line) => {
    let out = line;
    if (inBlock) {
      const end = out.indexOf("*/");
      if (end === -1) return "";
      inBlock = false;
      out = out.slice(end + 2);
    }
    for (;;) {
      const start = out.indexOf("/*");
      if (start === -1) break;
      const end = out.indexOf("*/", start + 2);
      if (end === -1) { inBlock = true; out = out.slice(0, start); break; }
      out = out.slice(0, start) + out.slice(end + 2);
    }
    return /^\s*\/\//.test(out) ? "" : out;
  });
}
let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

const rawLines = readRaw("components", "VocalTracker.jsx").split("\n");
// ★注意書きの中の formData. を数えないため、コメントを空にした写しで探す。
//   行数は変えないので、行番号はそのまま使えます。
const lines = maskComments(rawLines);

console.log("=== 前提：formData は読み込み中 null のまま ===");
const effectAt = lines.findIndex((l) => l.includes("setFormData(buildFormData(selectedDate, entries));"));
assertTrue(effectAt > 0, "formData を作る効果がある");
assertTrue(lines[effectAt - 1].includes("if (loading) return;"),
  "★読み込み中は作らない（＝そのあいだ null）");
assertTrue(lines.some((l) => l.includes("const [formData, setFormData] = useState(null)")),
  "★初期値は null");
// ★読み込み中の画面が無いことも、前提として書き留めておく。
//   もし将来「読み込み中は描かない」を入れたら、この試験は不要になります。
assertTrue(!lines.some((l) => /if \(loading\) return \(/.test(l) || /if \(loading\) return </.test(l)),
  "読み込み中に描画を止める作りは無い（だから1つずつ守る必要がある）");

console.log("\n=== ★描画の中の formData. は、すべて守られている ===");
// 描画（return( 以降）だけを見ます。上の計算部は useMemo が自前で守っています。
const renderStart = lines.findIndex((l, i) => i > 9000 && /^  return \($/.test(l));
assertTrue(renderStart > 0, "描画の開始が見つかる");

// formData の有無で囲まれた範囲を、波かっこの数で求める。
const guardedRanges = [];
lines.forEach((l, i) => {
  if (i < renderStart) return;
  if (!/formData &&/.test(l)) return;
  let depth = 0;
  for (let j = i; j < lines.length; j++) {
    depth += (lines[j].match(/\{/g) || []).length - (lines[j].match(/\}/g) || []).length;
    if (j > i && depth <= 0) { guardedRanges.push([i, j]); break; }
  }
});
// 即時関数の中で `if (!formData) return null;` としているものも、そこから
// 閉じかっこまでを守られた範囲として数える。
lines.forEach((l, i) => {
  if (i < renderStart || !/if \(!formData\) return null;/.test(l)) return;
  // ★守りの行からではなく、その即時関数の始まりから数える。
  //   1行手前から数えると、開きかっこを取りこぼして範囲が空になります。
  let openAt = i;
  while (openAt > renderStart && !/\(\(\) => \{/.test(lines[openAt])) openAt--;
  let depth = 0;
  for (let j = openAt; j < lines.length; j++) {
    depth += (lines[j].match(/\{/g) || []).length - (lines[j].match(/\}/g) || []).length;
    if (j > openAt && depth <= 0) { guardedRanges.push([openAt, j]); break; }
  }
});
const isGuarded = (n) => guardedRanges.some(([a, b]) => a <= n && n <= b);

const unguarded = [];
for (let i = renderStart; i < lines.length; i++) {
  if (!/(?<![\w.])formData\./.test(lines[i])) continue;
  if (!isGuarded(i)) unguarded.push(`${i + 1}: ${lines[i].trim().slice(0, 80)}`);
}
assertTrue(unguarded.length === 0,
  `★守られていない formData. の読み取りが無い${unguarded.length ? "\n      " + unguarded.join("\n      ") : ""}`);

console.log("\n=== 落ちていた2か所 ===");
assertTrue(lines.some((l) => l.includes("{!isRecordedToday && formData && (")),
  "★ホームの「30秒で記録」が守られている");
assertTrue(lines.some((l) => l.includes("if (!formData) return null;")),
  "★「今日」の進み具合が守られている");

console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
process.exit(failCount === 0 ? 0 : 1);
