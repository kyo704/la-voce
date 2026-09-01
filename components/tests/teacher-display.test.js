#!/usr/bin/env node
/**
 * 退会した先生の見せ方（2026-09-01）
 *
 * ★先生が退会すると lessons.teacher_id が null になります
 *   （行は残す。レッスンの日時は「過ぎた事実」で、生徒側の記録でもある）。
 *
 * ★null のときに何も出さない、をしてはいけません。
 *   「誰とのレッスンか」の欄が、ある日から急に空白になります。
 *   生徒には、消えたのか壊れたのかが分かりません。
 */
const { readCode, readRaw } = require("./_source");
let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }
function eq(a, b, label) { assertTrue(JSON.stringify(a) === JSON.stringify(b), `${label}（${JSON.stringify(a)}）`); }

const vt = readCode("components", "VocalTracker.jsx");

(async () => {
  const td = await import("../../lib/teacherDisplay.js");
  const resolve = (id) => ({ t1: "山田", t2: "" })[id];

  console.log("=== ★null のときも、必ず何かを出す ===");
  eq(td.teacherWithHonorific("t1", resolve), "山田先生", "通常");
  eq(td.teacherWithHonorific(null, resolve), "退会した先生", "★退会した先生");
  eq(td.teacherWithHonorific(undefined, resolve), "退会した先生", "undefined でも同じ");
  eq(td.teacherWithHonorific("", resolve), "退会した先生", "空文字でも同じ");
  assertTrue(td.teacherWithHonorific("t9", resolve).length > 0, "★名前が引けなくても空にしない");
  assertTrue(td.teacherWithHonorific("t2", resolve).length > 0, "★名前が空文字でも空にしない");

  console.log("\n=== ★「先生」を二重に付けない ===");
  eq(td.teacherWithHonorific("t9", resolve), "先生", "名前未取得のときは「先生」だけ");
  assertTrue(!td.teacherWithHonorific("t9", resolve).includes("先生先生"), "★「先生先生」にならない");
  assertTrue(!td.teacherWithHonorific(null, resolve).includes("先生先生"), "★退会した先生にも重ねない");

  console.log("\n=== ★集計で null を捨てない ===");
  const rows = [{ teacher_id: "t1" }, { teacher_id: null }, { teacher_id: "t1" }, { teacher_id: null }];
  const g = td.groupByTeacher(rows);
  eq(g.reduce((s, x) => s + x.count, 0), rows.length, "★合計が元の件数と合う（捨てていない）");
  assertTrue(g.some((x) => x.departed && x.count === 2), "★退会した先生も1つの群として数える");
  assertTrue(g.filter((x) => x.departed).length === 1,
    "★退会した先生は1つにまとめる（名前が無いので区別できない）");
  eq(td.teacherGroupKey(null), td.DEPARTED_TEACHER_KEY, "null の鍵");
  assertTrue(td.isDepartedKey(td.teacherGroupKey(null)), "鍵から退会と分かる");

  console.log("\n=== ★画面が、この仕組みを通している ===");
  assertTrue(/teacherWithHonorific\(l\.teacher_id, getTeacherName\)/.test(vt),
    "★カレンダーが通している");
  assertTrue(/teacherWithHonorific\(l\.teacher_id, orgDisplayName\)/.test(vt),
    "★レッスン一覧が通している");
  // 古い「teacher_id があるときだけ出す」書き方が残っていないこと
  assertTrue(!/l\.teacher_id && <span>/.test(vt),
    "★「teacher_id があるときだけ出す」書き方が残っていない");
  assertTrue(!/getTeacherName && l\.teacher_id &&/.test(vt),
    "★カレンダー側の同じ書き方も残っていない");
  // orgDisplayName が null で落ちない
  assertTrue(/if \(!userId\) return DEPARTED_TEACHER_LABEL;/.test(vt),
    "★orgDisplayName が null で落ちない");

  console.log("\n=== 監査は created_at で見る ===");
  // ★方針そのものはコメントに書かれています。readCode はコメントを外すので、
  //   ここは readRaw で見ます（_source.js の使い分け）。
  const delRaw = readRaw("lib", "accountDeletion.js");
  assertTrue(/監査は created_at/.test(delRaw),
    "★created_by を外す代わりに created_at で見る、と書いてある");
  // lessons.created_by は読み出されていないこと（＝監査に使われていない）
  assertTrue(!/l\.created_by|lesson\.created_by/.test(vt),
    "★画面で lessons.created_by を読んでいない");

  console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
  process.exit(failCount === 0 ? 0 : 1);
})();
