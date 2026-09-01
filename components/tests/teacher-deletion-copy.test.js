#!/usr/bin/env node
/**
 * 指導者の退会画面の3つの区分（Opus 判断・2026-09-01）
 *
 * ★なぜ3つに分けるか
 *   これまでは「消えるもの／残るもの」の2つでした。
 *   ★真ん中が抜けていました——「すぐに切れて、戻らないもの」です。
 *
 *   生徒との紐付けは、猶予の30日を待たずにその場で切れ、
 *   30日以内に取り消しても★戻りません（severConnections）。
 *   続いている関係は、生徒の側に continuously 影響するためです。
 *
 *   一方、レッスンの日時は「過ぎた事実」なので、猶予明けに
 *   名前だけを外します（lessons.teacher_id を null に）。
 *
 *   ★この2つを同じ欄に書くと、取り消せば戻ると誤解されます。
 */
const { readCode } = require("./_source");
let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

const vt = readCode("components", "VocalTracker.jsx");

console.log("=== ★3つの区分がある ===");
["消えるもの", "すぐに切れて、戻らないもの", "残るもの"].forEach((h) => {
  assertTrue(vt.includes(h), `見出し「${h}」がある`);
});

console.log("\n=== ★指定どおりの文言 ===");
[
  "あなたのアカウント、プロフィール、あなたが書いた記録のすべて",
  "生徒との紐付け。30日以内に取り消しても、戻りません",
  "もう一度つながるには、招待からやり直しになります",
  "あなたが行ったレッスンの「日時・所要時間・場所」の記録",
  "あなたの名前は消えます。生徒側の記録として残ります"
].forEach((line) => {
  assertTrue(vt.includes(line), `「${line.slice(0, 22)}…」`);
});

console.log("\n=== ★順番（消える → 切れる → 残る）===");
const a = vt.indexOf("消えるもの");
const b = vt.indexOf("すぐに切れて、戻らないもの");
const c = vt.indexOf("残るもの");
assertTrue(a > 0 && a < b && b < c, "★3つがこの順に並んでいる");

console.log("\n=== ★指導者のときだけ出す ===");
// 生徒側の退会には「生徒との紐付け」という概念がない
// ★退会の画面（deleteStep2）の中だけを見る。
//   同じ myStudentLinks.length > 0 が、指導者ダッシュボードにもあります。
const stepStart = vt.indexOf('t("deleteStep2Title")');
const stepEnd = vt.indexOf('t("deleteStep2Reregister")');
assertTrue(stepStart > 0 && stepEnd > stepStart, "退会の第2画面が見つかる");
const step2 = vt.slice(stepStart, stepEnd);
const teacherAt = step2.indexOf("{myStudentLinks.length > 0 && (");
const studentAt = step2.indexOf("{myTeacherLinks.length > 0 && (");
const threeAt = step2.indexOf("すぐに切れて、戻らないもの");
assertTrue(teacherAt >= 0 && threeAt > teacherAt,
  "★指導者（myStudentLinks）の分岐の中に3区分がある");
assertTrue(studentAt < 0 || threeAt < studentAt,
  "★生徒（myTeacherLinks）の分岐には入っていない");

console.log("\n=== 古い2区分の文言を使っていない ===");
assertTrue(!/t\("deleteStep2Teacher"\)/.test(vt),
  "★古い deleteStep2Teacher を呼んでいない");

console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
process.exit(failCount === 0 ? 0 : 1);
