#!/usr/bin/env node
/**
 * 他人が変えたものは、戻ってきたら新しくなる（2026-09-02）
 *
 * ★実地で分かったこと
 *   先生が予定の日付を変えても、生徒の画面は★古いままでした。
 *   DB は正しく書き換わっていました（直接引いて確認）。読む側だけの問題です。
 *
 * ★原因は2つ重なっていました
 *   ① 戻ってきたときの取り直しに、fetchTeacherLinks しか入っていなかった。
 *      ★同じ形が6つありました。
 *   ② アプリの中のタブは★状態（activeTab）で、画面遷移ではありません。
 *      だから再マウントせず、focus も visibilitychange も起きません。
 *      「タブを移って戻れば新しくなる」が、そもそも成り立っていませんでした。
 *
 * ★守ること
 *   ・取り直す対象は1か所に並べる（別々に足すと、次に増えたものが漏れる）
 *   ・他人が変えるものは全部入れる／自分しか変えないものは入れない
 *   ・アプリ内のタブ移動でも取り直す
 */
const { readCode } = require("./_source");

let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

const src = readCode("components", "VocalTracker.jsx");

console.log("=== ★取り直す対象は、1か所に並んでいる ===");
{
  assertTrue(/async function refreshSharedData\(\) \{/.test(src), "一覧が1つの関数になっている");
  const start = src.indexOf("async function refreshSharedData()");
  const body = src.slice(start, src.indexOf("}", src.indexOf("Promise.all", start)));
  [
    ["fetchTeacherLinks", "先生とのつながり"],
    ["fetchMyAllLessons", "★自分のレッスン（先生が動かす）"],
    ["fetchMyTeachingLessons", "教えているレッスン"],
    ["fetchMyOrgs", "所属する教室"],
    ["fetchMyEnrollments", "在籍"],
    ["fetchMyOrgEvents", "★教室の予定（今回の不具合）"]
  ].forEach(([fn, label]) => assertTrue(body.includes(fn), `${label} を取り直す`));
  // ★自分しか変えないものは入れない（無駄に投げない）
  assertTrue(!body.includes("fetchLearnState"),
    "★自分しか変えないもの（学ぶ）は入れていない");
}

console.log("\n=== ★戻ってきたときに走る ===");
{
  assertTrue(/document\.addEventListener\("visibilitychange", refresh\)/.test(src), "visibilitychange で走る");
  assertTrue(/window\.addEventListener\("focus", refresh\)/.test(src), "focus で走る");
  assertTrue(/await refreshSharedData\(\);/.test(src), "★一覧を呼んでいる（個別に並べ直していない）");
  // 重ねて走らせない
  assertTrue(/if \(running\) return;/.test(src), "★重ねて走らせない");
  assertTrue(/removeEventListener\("visibilitychange", refresh\)/.test(src), "listener を外している");
}

console.log("\n=== ★アプリの中でタブを移っても走る ===");
{
  // タブは状態なので、focus も visibilitychange も起きない
  assertTrue(/const \[activeTab, setActiveTab\] = useState\("home"\)/.test(src),
    "タブは状態（＝再マウントしない）");
  assertTrue(/const showsSharedData =/.test(src), "共有のものを見せる画面かを見ている");
  assertTrue(/activeTab === "notes" && notesSubTab === "calendar"/.test(src),
    "★カレンダーを開いたときに取り直す");
  assertTrue(/activeTab === "lesson"/.test(src), "★レッスンを開いたときに取り直す");
  assertTrue(/\}, \[userId, activeTab, notesSubTab\]\);/.test(src),
    "★開いたときだけ（毎描画では走らない）");
}

console.log("\n=== ★書き込みが0行だったことを、見えるようにした ===");
{
  // RLS で弾かれた更新は error にならない。0行変わって error は null。
  assertTrue(/\.eq\("id", ev\.id\)\s*\n\s*\.select\("id"\)/.test(src),
    "★日付の変更は .select() で行数を見る");
  assertTrue(/if \(!moved \|\| moved\.length === 0\)/.test(src), "0行なら、そう分かる");
  assertTrue(/この予定を変える権限がありません/.test(src),
    "★何が起きたかを画面に出す（黙って成功に見せない）");
  assertTrue(/if \(!withdrawn \|\| withdrawn\.length === 0\)/.test(src), "取り下げも同じ");
}

console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
process.exit(failCount === 0 ? 0 : 1);
