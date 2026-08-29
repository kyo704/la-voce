#!/usr/bin/env node
/**
 * 曲目の最高音を入れる欄（2026-08-29 の一連の不具合）
 *
 * ★何が起きていたか
 *   ① テッシトゥーラだけを入れると、登録ボタンが押せない
 *   ② 歌唱言語を先に登録した曲は、最高音の欄が二度と出ない
 *   ③ 2回目・4回目に使う曲にも、欄が出ない
 *   ④ 曲目ごとの使用回数が、2曲以上を記録した日には常に0
 *
 * ★①は、呼ぶ先と条件が食い違っていたもの。
 *   handleSaveRepertoire は「最高音・テッシトゥーラ・3択のどれか1つ」で
 *   受け付けるのに、ボタンだけがテッシトゥーラを数えていませんでした。
 *
 * ★②は、「行がある」と「音の高さを記録済み」を同じものとして扱っていたもの。
 *   このリポジトリで繰り返している、1つの判断が2つの意味を持つ形です。
 *
 * ★④は、旧列 entries.repertoire を数えていたもの。あれは その日の全曲を
 *   「、」でつないだ文字列で、曲ごとの鍵になりません。
 */
const { readCode, readRaw } = require("./_source");
let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }
function assertEqual(a, b, label) {
  if (JSON.stringify(a) === JSON.stringify(b)) { console.log(`  ✓ ${label}`); passCount++; }
  else { console.log(`  ✗ ${label}  期待:${JSON.stringify(b)} 実際:${JSON.stringify(a)}`); failCount++; }
}
const code = readCode("components", "VocalTracker.jsx");
const raw = readRaw("components", "VocalTracker.jsx");

console.log("=== ★① テッシトゥーラだけでも登録できる ===");
assertTrue(/disabled=\{tessituraSaving \|\| \(!topNoteInput && !tessituraOptionalInput && dOverrideChoice == null\)\}/.test(code),
  "★ボタンの条件が、テッシトゥーラも数えている");
assertTrue(!/disabled=\{tessituraSaving \|\| \(!topNoteInput && dOverrideChoice == null\)\}/.test(code),
  "★古い条件が残っていない");
// 見た目（薄さ）も同じ条件であること。片方だけ直すと、押せるのに薄いままになる。
const opacityLine = (code.match(/opacity: tessituraSaving \|\|[^}]*\}/) || [""])[0];
assertTrue(/!topNoteInput && !tessituraOptionalInput && dOverrideChoice == null/.test(opacityLine),
  "★薄さの条件も揃っている");
// 呼ぶ先の条件と食い違っていないこと。★ここがずれていたのが原因。
// ★「直す」を足したとき replace が付きました。条件そのものは同じです。
assertTrue(/if \(!replace && !topNote && !tessituraNote && dOverride == null\) return;/.test(code),
  "呼ぶ先（handleSaveRepertoire）は3つのどれか1つで受け付ける");

console.log("\n=== ★② 「行がある」と「音の高さを記録済み」を分ける ===");
assertTrue(/const hasPitch = !!\(record && \(record\.topNote \|\| record\.tessituraNote \|\| record\.dOverride != null\)\);/.test(code),
  "★音の高さが入っているか、を別に持っている");
// ★「直す」を足したので、登録済みでも editingPitch のあいだは開きます。
assertTrue(/\{name && \(!hasPitch \|\| editingPitch\) && \(\(\) => \{/.test(code),
  "★欄の出し分けが hasPitch を見ている（直しているときも開く）");
assertTrue(!/\{name && !record && \(\(\) => \{/.test(code),
  "★「行が無いときだけ」という古い条件が残っていない");
// 歌唱言語だけでも行ができることを、根拠として固定する。
assertTrue(/setRepertoireTessituraMap\(\(prev\) => \(\{ \.\.\.prev, \[repertoireName\]: \{ \.\.\.\(prev\[repertoireName\] \|\| \{\}\), singingLanguage: language \} \}\)\)/.test(code),
  "歌唱言語の登録でも、行ができる（＝record だけでは判断できない）");

console.log("\n=== ★③ 使う回数で欄を閉じない ===");
assertTrue(!/usageSoFar === 0 \|\| usageSoFar === 2/.test(code),
  "★1回目と3回目にしか出さない、という条件が消えている");
assertTrue(/if \(repertoireSkipped\[norm\]\) return null;/.test(code),
  "「あとで」を押したときは、その場で消える（催促にしない）");

console.log("\n=== ★④ 使用回数を、曲ごとに数える ===");
assertTrue(!/const raw = \(e\.repertoire \|\| ""\)\.trim\(\);/.test(code),
  "★旧列 entries.repertoire を数えていない");
assertTrue(/\(a\.items \|\| \[\]\)\.forEach\(\(it\) => \{/.test(code),
  "activities[].items[] を歩いている");
assertTrue(/seenToday/.test(code), "同じ日に同じ曲が何度出ても、1日は1回と数える");
// 旧列が「、」でつないだ文字列であることを、根拠として固定する。
assertTrue(/\.join\("、"\)/.test(code), "旧列は全曲を「、」でつないだ文字列（曲ごとの鍵にならない）");

console.log("\n=== 数え方を、実際に動かして確かめる ===");
// 画面と同じ計算を写して確かめる（2曲の日が、両方1回と数えられること）
function countUsage(entries, normalizeTitle) {
  const counts = {};
  Object.values(entries).forEach((e) => {
    const seenToday = new Set();
    (e.activities || []).forEach((a) => {
      (a.items || []).forEach((it) => {
        const rawName = (it.repertoireName || "").trim();
        if (!rawName) return;
        const norm = normalizeTitle(rawName);
        if (!norm || seenToday.has(norm)) return;
        seenToday.add(norm);
        if (!counts[norm]) counts[norm] = { count: 0, displayName: rawName };
        counts[norm].count += 1;
      });
    });
  });
  return counts;
}
const nt = (s) => s.trim().toLowerCase();
const sample = {
  "2026-08-01": { activities: [{ items: [{ repertoireName: "椿姫" }, { repertoireName: "蝶々夫人" }] }] },
  "2026-08-02": { activities: [{ items: [{ repertoireName: "椿姫" }] }, { items: [{ repertoireName: "椿姫" }] }] },
  "2026-08-03": { activities: [] }
};
const got = countUsage(sample, nt);
assertEqual(got["椿姫"].count, 2, "★2曲の日でも、椿姫が数えられる（2日）");
assertEqual(got["蝶々夫人"].count, 1, "★同じ日のもう1曲も数えられる（1日）");
assertTrue(!got["椿姫、蝶々夫人"], "★つないだ文字列が鍵になっていない");

console.log("\n=== 元の不具合が戻っていないこと ===");
assertTrue(/if \(existingNorm === norm\) return false;/.test(raw),
  "その曲自身を「似た別の曲」と見なさない（d636bee）");
assertTrue(/singing_language: existing\.singingLanguage \|\| null/.test(code),
  "最高音を保存しても、歌唱言語が消えない");

console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
process.exit(failCount === 0 ? 0 : 1);
