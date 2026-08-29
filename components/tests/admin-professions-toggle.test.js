#!/usr/bin/env node
/**
 * 管理者の「全職業を表示」の切り替え（2026-08-29）
 *
 * ★なぜ要るか
 *   それまで、管理者は「常に」全職業が見える作りでした。
 *   そのため、自分の職業を選び直しても画面が変わらず、
 *   職業別の出し分けを自分のアカウントで確かめられません。
 *   実際、声楽を選んで保存しても アナウンサー用のチップが消えず、
 *   ★「直っていない不具合」として報告されました。原因は上書きのほうでした。
 *
 * ★守りたいこと
 *   ① 既定は「自分の職業だけ」（＝一般の利用者と同じ見え方）
 *   ② 管理者以外には、切り替えが出ない・動きも変わらない
 *   ③ 入にしたときだけ、全職業が見える
 */
const { readCode } = require("./_source");
let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

const vt = readCode("components", "VocalTracker.jsx");

console.log("=== ★既定は「自分の職業だけ」 ===");
assertTrue(/useState\(false\)/.test(vt.slice(vt.indexOf("adminShowAllProfessions"), vt.indexOf("adminShowAllProfessions") + 120)),
  "★切り替えの初期値は false");
assertTrue(/\(profile\.is_admin && adminShowAllProfessions\)/.test(vt),
  "★管理者かつ入のときだけ、全職業になる");
assertTrue(!/return profile\.is_admin \? VOCAL_PROFESSIONS/.test(vt),
  "★「管理者なら常に全職業」という古い書き方が残っていない");

console.log("\n=== ★管理者以外には、何も変わらない ===");
const memo = vt.slice(vt.indexOf("const effectiveProfessions = useMemo"), vt.indexOf("const effectiveProfessions = useMemo") + 320);
assertTrue(/: \(profile\.professions \|\| \[\]\)/.test(memo),
  "管理者でなければ、これまでどおり自分の professions を使う");
// 切り替えの枠そのものが、管理者にしか出ないこと。
// ★見出しの位置から手前を見ます。前向きに幅を決め打ちすると、
//   間の行数が増えただけで落ちます（実際に400字では足りませんでした）。
const headingAt = vt.indexOf("全職業を表示（管理者）");
assertTrue(headingAt > 0, "切り替えの見出しがある");
const beforeHeading = vt.slice(Math.max(0, headingAt - 1200), headingAt);
assertTrue(/\{profile\.is_admin && \(/.test(beforeHeading),
  "★切り替えの表示が is_admin で囲まれている");

console.log("\n=== 覚えておく場所 ===");
// ★本人のデータではなく、端末ごとの確認用の設定なので localStorage に置く。
assertTrue(/woolsong-admin-all-professions/.test(vt), "localStorage に覚える");
assertTrue(!/admin_show_all_professions/.test(vt), "★profiles に列を足していない");
// 読めない環境でも落ちないこと
const readBlock = vt.slice(vt.indexOf("woolsong-admin-all-professions"), vt.indexOf("woolsong-admin-all-professions") + 200);
assertTrue(/catch/.test(vt.slice(vt.indexOf("localStorage.getItem(\"woolsong-admin-all-professions\")") - 200,
  vt.indexOf("localStorage.getItem(\"woolsong-admin-all-professions\")") + 260)),
  "★localStorage が読めなくても落ちない");

console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
process.exit(failCount === 0 ? 0 : 1);
