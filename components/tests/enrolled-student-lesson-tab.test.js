#!/usr/bin/env node
/**
 * 在籍しているだけの生徒にも、教室が見えること（2026-09-02）
 *
 * ★何が起きていたか
 *   「所属している教室」を出す画面は、レッスンのタブの中★1つだけです。
 *   ところがタブが出る条件（canLearnLessons）は、
 *   teacher_student_links と指導者ベータしか見ていませんでした。
 *   ★在籍しているのに、その教室をどこからも見られない人が生まれます。
 *
 * ★これは teacher_student_links と enrollments の使い分けを決めたもの
 *   ではありません（その判断は保留中）。★数え忘れを直しただけです。
 */
const { readCode } = require("./_source");

let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

const src = readCode("components", "VocalTracker.jsx");

// ---- 条件をそのまま写して動かす ----
function canSeeTeacherFeatures(beta, hasTeacherLinks, hasStudentLinks) {
  return beta || hasTeacherLinks || hasStudentLinks;
}
function canLearn({ beta = false, teacherLinks = 0, studentLinks = 0, lessons = 0, enrollments = 0 }) {
  const isEnrolled = enrollments > 0;
  return (canSeeTeacherFeatures(beta, teacherLinks > 0, studentLinks > 0) || isEnrolled)
    && (lessons > 0 || teacherLinks > 0 || isEnrolled || beta);
}

console.log("=== ★在籍だけの人にも出る ===");
{
  assertTrue(canLearn({ enrollments: 1 }) === true,
    "★在籍だけ（つながりも、ベータも、レッスンも無い）→ 出る");
  assertTrue(canLearn({ enrollments: 2 }) === true, "2つの教室に在籍 → 出る");
}

console.log("\n=== これまでどおり出る場合 ===");
{
  assertTrue(canLearn({ teacherLinks: 1 }) === true, "先生とつながっている → 出る");
  assertTrue(canLearn({ beta: true }) === true, "指導者ベータ → 出る");
  assertTrue(canLearn({ teacherLinks: 1, enrollments: 2 }) === true, "両方 → 出る");
}

console.log("\n=== ★出ない場合（広げすぎていないこと） ===");
{
  assertTrue(canLearn({}) === false, "★何も無い人には出さない");
  assertTrue(canLearn({ studentLinks: 1 }) === false,
    "★生徒を持っているだけ（先生側）では、習う側は出さない");
  assertTrue(canLearn({ lessons: 1 }) === false,
    "レッスンだけあって、つながりも在籍も無い → 出さない");
}

console.log("\n=== ★宣言の順（実行時に落ちないこと） ===");
{
  // ★const は巻き上がりません。使う場所より下で宣言すると
  //   ReferenceError になります。next build は通ってしまいます。
  const declAt = src.indexOf("const [myEnrollments, setMyEnrollments]");
  const useAt = src.indexOf("const isEnrolledInOrg = myEnrollments.length > 0;");
  assertTrue(declAt > -1 && useAt > -1, "両方ある");
  assertTrue(declAt < useAt, "★宣言が、使う場所より前にある");
}

console.log("\n=== ★コード側にも入っている ===");
{
  assertTrue(/const isEnrolledInOrg = myEnrollments\.length > 0;/.test(src), "在籍の判定が1か所");
  // ★2つある条件の両方に足すこと。片方だけだと、在籍だけの人は通らない。
  const block = src.slice(src.indexOf("const isEnrolledInOrg"), src.indexOf("const hasLessonTab"));
  assertTrue((block.match(/isEnrolledInOrg/g) || []).length >= 3,
    "★前half と後half の両方で見ている");
}

console.log("\n=== ★ホームにも数を出す（タブ1つに頼らない） ===");
{
  assertTrue(/所属教室: \{myEnrollments\.length\}/.test(src), "ホームに数を出している");
  assertTrue(/レッスン → 習う で見られます/.test(src), "★どこで見られるかを書いている");
  assertTrue(!/所属教室: 0/.test(src), "0のときは出さない（条件つき）");
  // ★押せる案内にしないこと（行き先を2つ作らない）
  const homeBlock = src.slice(src.indexOf("所属教室:") - 400, src.indexOf("所属教室:") + 200);
  assertTrue(!/<button|onClick/.test(homeBlock), "★押せるものにしていない");
}

console.log("\n=== ★もっと の点（在籍しているときだけ） ===");
{
  assertTrue(/tab\.key === "more" && myEnrollments\.length > 0/.test(src),
    "在籍が1つ以上のときだけ出す");
  // ★数を出さないこと。数は「片づけるもの」に見えます（連続記録と同じ理由）。
  const dot = src.slice(src.indexOf('tab.key === "more" && myEnrollments'),
                        src.indexOf('tab.key === "more" && myEnrollments') + 420);
  assertTrue(!/myEnrollments\.length\}/.test(dot), "★点に数を出していない");
  assertTrue(/borderRadius: "50%"/.test(dot), "丸い点である");
  assertTrue(/width: 6, height: 6/.test(dot), "小さい（6px）");
  assertTrue(/aria-hidden="true"/.test(dot),
    "★読み上げには出さない（意味は隣の文字が持っている）");
  // ★押させる催促にしないこと
  assertTrue(!/animate|pulse|blink/.test(dot), "★点滅させていない");
  // ホームの表示とは別物であること（役割が違う）
  assertTrue(/所属教室: \{myEnrollments\.length\}/.test(src),
    "ホームの表示は、これまでどおり数を出す");
}

console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
process.exit(failCount === 0 ? 0 : 1);
