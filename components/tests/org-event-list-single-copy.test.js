#!/usr/bin/env node
/**
 * 教室の予定の一覧は、実体が1つだけ（2026-09-02）
 *
 * ★同じ一覧を2か所に出します（ノートのカレンダー・レッスンのタブ）。
 *   書き写すと、片方だけ直る日が来ます。この repo で何度も起きている形です。
 *
 * ★レッスンのタブだけにはできません。
 *   タブが出る条件（hasLessonTab）は teacher_student_links と指導者ベータだけを
 *   見ており、★教室に在籍しているだけの人にはタブがありません。
 *   その人たちにも予定は届いているので、カレンダー側は残します。
 */
const { readCode, readRaw } = require("./_source");

let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

const list = readCode("components", "OrgEventList.jsx");
const tracker = readCode("components", "VocalTracker.jsx");
const flags = readCode("lib", "featureFlags.js");

console.log("=== ★実体は1つ ===");
{
  // 「出ます／出る」を描いているのは、部品の中だけであること
  const inList = (list.match(/"出ます"/g) || []).length;
  const inTracker = (tracker.match(/\{joined \? "出ます" : "出る"\}/g) || []).length;
  assertTrue(inList >= 1, "部品が「出ます／出る」を描いている");
  assertTrue(inTracker === 0, "★VocalTracker には、その描画が残っていない");

  assertTrue(!/WITHDRAWN_MESSAGE/.test(tracker),
    "★取り下げの文言を、VocalTracker が持っていない");
  assertTrue(!/movedMessage\(/.test(tracker),
    "★日付変更の文言を、VocalTracker が持っていない");
}

console.log("\n=== ★2か所から、同じ部品を呼んでいる ===");
{
  const calls = (tracker.match(/<OrgEventList\b/g) || []).length;
  assertTrue(calls === 2, `★2か所で使っている（いま ${calls} か所）`);
  assertTrue(/import OrgEventList from "@\/components\/OrgEventList"/.test(tracker),
    "部品を読み込んでいる");
}

console.log("\n=== ★出す・出さないの判定も、1か所 ===");
{
  assertTrue(/orgEventState/.test(list), "部品が orgEventState を使う");
  assertTrue(!/orgEventState/.test(tracker),
    "★VocalTracker 側に、同じ判定が残っていない");
  assertTrue(/if \(visible\.length === 0\) return null;/.test(list),
    "★何も無ければ、部品自身が null を返す（呼ぶ側に条件を書かせない）");
}

console.log("\n=== ★見え方を、2か所で変えていない ===");
{
  // 読むだけ版を作らないこと（取り下げが片方にしか出なくなる）
  assertTrue(!/readOnly|readonly|compact/.test(list),
    "★「読むだけ」の版を作っていない");
  assertTrue(!/onToggleJoin=\{null\}|onToggleJoin=\{undefined\}/.test(tracker),
    "★片方だけ押せなくしていない");
}

console.log("\n=== ★カレンダー側を消していないこと ===");
{
  // hasLessonTab は在籍を見ていない。だからカレンダー側が要る。
  assertTrue(!/enrollment/i.test(flags),
    "★機能フラグは在籍（enrollments）を見ていない（＝タブが出ない人が居る）");
  assertTrue(/notesSubTab === "calendar"/.test(tracker),
    "カレンダーの画面は残っている");
}

console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
process.exit(failCount === 0 ? 0 : 1);
