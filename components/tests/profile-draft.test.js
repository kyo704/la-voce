#!/usr/bin/env node
/**
 * プロフィール画面の下書きの分離。
 *
 * ★守りたいこと: 保存を押していない編集が、ほかのタブに出ないこと。
 *   以前は編集フォームが共有の profile を直接書き換えていました。
 *   その結果、職業を選んだだけ（保存していない）で、今日の記録の
 *   呼び名（本番→収録）と型別項目が変わって見えていました。
 *   データベースには何も入っていないので、再読み込みで元に戻ります。
 *   「変えたのに戻る」「変えていないのに変わっている」の両方が起きます。
 */
const { readRaw, stripComments } = require("./_source");
let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

const vt = stripComments(readRaw("components", "VocalTracker.jsx"));

console.log("=== 編集フォームは、共有の状態を書き換えない ===");
// ★これが本体。onChange が setProfile を呼んでいたら、元の不具合に戻っています。
// ★「最初の <ProfileFieldGroups」ではありません。オンボーディングにも
//   同じ部品があり、そちらは自前の optionalFields を持っていて正しい。
//   プロフィール画面のほうを名指しで取り出します。
const at = vt.indexOf("<ProfileFieldGroups value={profileDraft");
const picker = at < 0 ? "" : vt.slice(at, at + 320);
assertTrue(at >= 0, "プロフィール画面の編集フォームが下書きを使っている");
assertTrue(/setProfileDraft/.test(picker), "編集は下書きへ書く");
assertTrue(!/setProfile\(/.test(picker), "★編集フォームが setProfile を呼んでいない");
assertTrue(/value=\{profileDraft \|\| profile\}/.test(picker), "表示も下書きから");
// ★オンボーディングは元から自前の状態を持っています。巻き添えにしないこと。
assertTrue(/<ProfileFieldGroups value=\{optionalFields\}/.test(vt),
  "★オンボーディングは今までどおり optionalFields のまま");

console.log("\n=== 保存に成功したときだけ、共有の状態へ移す ===");
const save = vt.slice(vt.indexOf("async function handleSaveProfile"), vt.indexOf("async function handleSaveProfile") + 3000);
assertTrue(/const draft = profileDraft \|\| profile;/.test(save), "保存は下書きを読む");
assertTrue(/if \(!error\) \{[\s\S]{0,120}setProfile\(/.test(save),
  "★成功したときだけ profile に移す");
assertTrue(/setProfileDraft\(null\)/.test(save), "移したら下書きを捨てる");
assertTrue(!/draft\./.test(save.slice(0, save.indexOf("const draft"))), "draft は宣言より前で使われていない");

console.log("\n=== 分析と呼び名は、保存済みの値だけを見る ===");
// ★ここが下書きを見ると、保存前の職業で呼び名や型別項目が変わります。
assertTrue(/const currentOccupation = occupationOf\(profile\);/.test(vt),
  "★occupationOf は保存済みの profile を読む");
assertTrue(/typeFieldsFor\(mixOf\(profile\)/.test(vt),
  "★mixOf も保存済みの profile を読む");
assertTrue(!/occupationOf\(profileDraft/.test(vt), "★occupationOf に下書きを渡していない");
assertTrue(!/mixOf\(profileDraft/.test(vt), "★mixOf に下書きを渡していない");

console.log("\n=== 即時保存の2つは、これまでどおり直接書く ===");
// ★下書きを経由させると、押した瞬間に保存されるはずの設定が保存されなくなります。
["handleSaveDisplayPref", "handleSetPracticeGoal"].forEach((fn) => {
  const body = vt.slice(vt.indexOf(`function ${fn}`), vt.indexOf(`function ${fn}`) + 900);
  assertTrue(/setProfile\(/.test(body), `${fn} は profile に直接書く`);
  assertTrue(!/setProfileDraft/.test(body), `★${fn} は下書きを経由しない`);
});

console.log("\n=== 職業を選んだとき、古い列も一緒に下書きへ入る ===");
// ★学ぶ画面と分析カードは、いまも professions を見ています。
//   下書きに片方しか入らないと、保存しても記事が変わりません。
const occPick = vt.slice(vt.indexOf("voice_occupation: occ"), vt.indexOf("voice_occupation: occ") + 200);
assertTrue(/professions: \[legacy\]/.test(occPick) && /vocal_profession: legacy/.test(occPick),
  "★職業を選ぶと3つとも下書きに入る");

console.log("\n=== 保存していないことが分かる ===");
assertTrue(/保存されていません/.test(vt), "未保存の目印がある");
assertTrue(/profileDirty/.test(vt), "下書きの有無で出し分けている");

console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
process.exit(failCount === 0 ? 0 : 1);
