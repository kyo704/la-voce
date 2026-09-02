#!/usr/bin/env node
/**
 * 作りかけの教室は「見えるが、押せない」（2026-09-02・案B）
 *
 * ★なぜ見せるのか
 *   一覧は memberships を見ています。オーナーとして入るところで失敗すると、
 *   教室はあるのに★持ち主の一覧から消えます。見えなければ直せません。
 *
 * ★なぜ押せなくするのか
 *   操作の権限は membership が根拠です。この教室にはそれがありません。
 *   ボタンを置くと、★押しても必ず失敗するボタンになります。
 *   今朝の「参加に失敗しました。もう一度お試しください。」と同じ形です。
 */
const { readCode } = require("./_source");

let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

const src = readCode("components", "VocalTracker.jsx");

console.log("=== ★見える ===");
{
  assertTrue(/const \[myOrphanOrgs, setMyOrphanOrgs\] = useState\(\[\]\)/.test(src),
    "作りかけの教室を持つ状態がある");
  assertTrue(/\.from\("organizations"\)\.select\("\*"\)\.eq\("created_by", userId\)/.test(src),
    "★created_by で拾っている（membership が無くても見つかる）");
  assertTrue(/myOrphanOrgs\.map\(/.test(src), "画面に出している");
}

console.log("\n=== ★押せない ===");
{
  // 表示ブロックだけを切り出して、操作の入口が無いことを見る
  const start = src.indexOf("myOrphanOrgs.map(");
  const end = src.indexOf("myOrgs.filter((m) => m.role === \"owner\"", start);
  assertTrue(start > -1 && end > start, "表示ブロックを取り出せる");
  const block = src.slice(start, end);
  assertTrue(!/<button/.test(block), "★ボタンが1つも無い");
  assertTrue(!/onClick/.test(block), "★押せる場所が無い");
  assertTrue(!/<select|<input/.test(block), "★入力も無い");
  assertTrue(!/ensureOwnOrg|handleGenerateOrgInvite|handleChangeRole/.test(block),
    "★失敗する処理を呼んでいない");
}

console.log("\n=== ★言い方 ===");
{
  assertTrue(/消えてはいません/.test(src), "★消えたと思わせない");
  // ★ファイル全体を見ないこと。通信の失敗など、再試行が正しい場面は他にあります。
  //   見るのは「必ず失敗する経路」だけです。
  const orphanBlockStart = src.indexOf("myOrphanOrgs.map(");
  const orphanBlockEnd = src.indexOf("myOrgs.filter((m) => m.role === \"owner\"", orphanBlockStart);
  assertTrue(!/もう一度お試しください/.test(src.slice(orphanBlockStart, orphanBlockEnd)),
    "★作りかけの教室の表示で、再試行をすすめていない");
  // ensureOwnOrg が失敗したときの文言も、同じ理由で再試行を勧めない
  assertTrue(/同じ操作を繰り返しても直りません/.test(src),
    "★教室の準備が止まったときも、再試行をすすめていない");
}

console.log("\n=== ★読めなかったときは、何も出さない ===");
{
  assertTrue(/自分が作った教室を確認できませんでした/.test(src),
    "読めなければ、記録に残す");
  const i = src.indexOf("自分が作った教室を確認できませんでした");
  assertTrue(/setMyOrphanOrgs\(\[\]\)/.test(src.slice(i, i + 200)),
    "★分からないときは空にする（壊れた教室が無い、とは言わない）");
}

console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
process.exit(failCount === 0 ? 0 : 1);
