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

console.log("\n=== ★ホームの表示（2026-09-02 に、数からカードへ） ===");
{
  // ★前は「所属教室: 2」という数の1行でした。
  //   裁定が変わり、教室の名前と担当の先生を出すカードになりました。
  //   ★数だけでは、探しに行く手間が残ります。
  assertTrue(!/所属教室: \{myEnrollments\.length\}/.test(src),
    "★数だけの1行は、もう出していない");
  assertTrue(/つながりを見る →/.test(src), "カードになっている");
}

console.log("\n=== ★点は置かない（2026-09-02・裁定の見直し） ===");
{
  // ★点は「未読」に読めます。教室のつながりに未読はありません。
  //   消えない点は、止まらない催促です（今日の「急かさない」と同じ線）。
  // ★そもそも、タブの上の点は★そのタブが見えている人にしか効きません。
  //   困っていたのは「タブが見えない人」でした。
  assertTrue(!/tab\.key === "more" && myEnrollments\.length > 0/.test(src),
    "★もっと に点を出していない");
  assertTrue(!/所属教室: \{myEnrollments\.length\}/.test(src),
    "★ホームの「所属教室: 2」も出していない（カードに置き換え）");
}

console.log("\n=== ★もっと を右端に固定する ===");
{
  // ★もっと は「ここから先がある」と知らせる入口なのに、
  //   その入口自身が画面の外に出ていました。
  assertTrue(/displayTabs\.filter\(\(tab\) => tab\.key !== "more"\)/.test(src),
    "流れる側から もっと を外している");
  assertTrue(/displayTabs\.filter\(\(tab\) => tab\.key === "more"\)/.test(src),
    "★もっと を、帯の外に別で置いている");
  const pinned = src.slice(src.indexOf('displayTabs.filter((tab) => tab.key === "more")'),
                           src.indexOf('displayTabs.filter((tab) => tab.key === "more")') + 1000);
  assertTrue(/shrink-0/.test(pinned), "縮まない");
  assertTrue(!/overflow-x-auto/.test(pinned), "★流れる帯の中に入れていない");
  // ★狭い画面では「…」だけ。三本線にしないこと（「全部の献立」を思わせる）。
  assertTrue(/icon: MoreHorizontal/.test(src), "★アイコンは「…」（MoreHorizontal）");
  // ★src 全体を見ると practiceMenu（練習メニュー）に当たります。
  //   見るのは★タブの定義だけ。ここで三本線を選んでいないこと。
  const tabDefs = src.slice(src.indexOf("const TABS = ["), src.indexOf("const TABS = [") + 400);
  assertTrue(/icon: MoreHorizontal/.test(tabDefs), "★もっと のアイコンは「…」");
  assertTrue(!/icon: (Menu|AlignJustify|List)\b/.test(tabDefs), "★三本線を選んでいない");
  assertTrue(/<span className="hidden sm:inline">/.test(pinned),
    "★狭い画面では文字を出さない（sm 以上では出す）");
  assertTrue(/aria-label=\{tab\.labelKey \? t\(tab\.labelKey\) : tab\.label\}/.test(pinned),
    "★文字が消えても、読み上げには名前が残る");
  // ★並び順は変えていないこと（9月28日まで保留）
  assertTrue(/key: "home"[\s\S]{0,400}key: "more"/.test(src),
    "★TABS の並びは変えていない");
}

console.log("\n=== ★1文字だけ切れるのを直す ===");
{
  // ★全部見えれば「これで全部」、半分見えれば「まだ続く」と読めますが、
  //   1文字だけはみ出るのは、どちらにも読めません。
  // ★詰めるのは、狭い画面だけ（2026-09-02 の追加指示）。
  //   PC・iPad は元のままにします。あちらは幅が足りていて、
  //   ★そもそも見えなくなる問題が起きていません。
  assertTrue(/gap-1 px-\[11px\] text-xs sm:gap-1\.5 sm:px-3\.5 sm:text-sm/.test(src),
    "★狭い画面だけ詰め（余白 11px）、sm 以上は元に戻している");
  assertTrue(!/className="flex items-center gap-1 px-3 py-2 rounded-full text-xs/.test(src),
    "★どの幅でも詰める書き方が残っていない");
  // ★ラベルそのものは変えないこと
  assertTrue(/tabLesson/.test(src), "★「レッスン」の呼び名は変えていない");
  // ★ホーム・今日・分析 の文字は消さない（案A は却下）。
  //   機械に強くない方（年配の先生・落語家・声優）に、絵だけで
  //   「今日の記録」と「分析」を見分けさせないため。
  const scrolling = src.slice(src.indexOf('displayTabs.filter((tab) => tab.key !== "more")'),
                              src.indexOf('displayTabs.filter((tab) => tab.key === "more")'));
  assertTrue(!/hidden sm:inline/.test(scrolling),
    "★流れる側のタブから、文字を消していない");
}

console.log("\n=== ★在籍の取得で、黙って消えないこと ===");
{
  // ★埋め込み（org:organizations）は、organizations が読めないと
  //   要求ごと落ち、在籍が0件になります。
  //   → レッスンのタブも、ホームのカードも、黙って消えます。
  assertTrue(!/from\("enrollments"\)\.select\("\*, org:organizations/.test(src),
    "★在籍の取得に、埋め込みを使っていない");
  assertTrue(/from\("enrollments"\)\.select\("\*"\)/.test(src), "素で取っている");
  assertTrue(/★在籍を読めませんでした/.test(src), "★読めなかったら、記録に残す");
  assertTrue(/教室の名前を読めませんでした（在籍は読めています）/.test(src),
    "★名前が読めなくても、在籍は消えない");
}

console.log("\n=== ★ホームのカード（探しに行かなくても分かる） ===");
{
  assertTrue(/つながりを見る →/.test(src), "行き先が書いてある");
  assertTrue(/en\.org \? en\.org\.name/.test(src), "★教室の名前を出している");
  assertTrue(/assignedTeacherLabel"\)\}：\{orgDisplayName\(tid\)\}/.test(src),
    "★担当の先生を出している");
  assertTrue(/setActiveTab\("lesson"\); setLessonRoleChoice\("learn"\)/.test(src),
    "★押すと、習う側が開く（探させない）");
  assertTrue(/myEnrollments\.length > 0 && \(\s*<button/.test(src),
    "在籍しているときだけ出す");
}

console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
process.exit(failCount === 0 ? 0 : 1);
