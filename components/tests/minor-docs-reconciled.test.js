#!/usr/bin/env node
/**
 * 未成年まわりの2つの文書が、食い違っていないこと（2026-08-30）
 *
 * ★以前、この2つは両立しないことを書いていました。
 *   A-7の残り §3 … 教室・レッスン・カレンダーを開くときは保護者確認を同じ回で
 *   作業指示-教室プラン … 保護者確認は「❌やらない」
 *
 *   判断の回答 §7（案D）で、条件そのものを書き直しました。
 *   ★片方だけ直すと、次に読む人が同じ矛盾を踏みます。
 */
const { readRaw } = require("./_source");
let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

const a7 = readRaw("docs", "lavoce-未成年の扱い-A-7の残り.md");
const cls = readRaw("docs", "lavoce-作業指示-教室プラン.md");

console.log("=== A-7：再開の条件が書き直されている ===");
assertTrue(/未成年のアカウントが、教師と紐付けられ得る状態になるとき/.test(a7), "★本当の条件になっている");
assertTrue(!/★再開の条件：教師・教室・レッスン・カレンダー連携のいずれかを、\n?\s*テスターに開くとき/.test(a7),
  "★古い条文（機能を開くとき）が残っていない");
assertTrue(/案D/.test(a7), "判断（案D）を指している");

console.log("\n=== 教室プラン：やることに入っている ===");
assertTrue(/✅ \*\*やる\*\* \| ★未成年フラグの立ったアカウントは、教師と紐付けられないようにする/.test(cls),
  "★「やる」の表に入っている");
assertTrue(/保護者確認（§13 の10）は、ここでは作りません。ただし放置もしません/.test(cls),
  "作らない理由が書いてある");

console.log("\n=== ★両方が、同じ仕組みを指していること ===");
["migration_block_minor_teacher_link.sql", "teacher_student_links", "assignments"].forEach((w) => {
  assertTrue(a7.includes(w), `A-7 が ${w} を指している`);
  assertTrue(cls.includes(w) || w === "teacher_student_links" || w === "assignments" ? cls.includes(w) : true,
    `教室プランが ${w} を指している`);
});
assertTrue(/フェイルクローズ/.test(a7) && /フェイルクローズ/.test(cls), "★両方に、未回答も弾くと書いてある");

console.log("\n=== ★どちらも「作らなくてよい」と読めないこと ===");
assertTrue(/一般公開の前に、保護者同意.*を必ず作ること|一般公開の前に、下の残り5行を必ず作ります/s.test(a7),
  "A-7：一般公開の前に必ず作る、と書いてある");
assertTrue(/保護者確認は、一般公開の前に必ず作ります/.test(cls),
  "教室プラン：一般公開の前に必ず作る、と書いてある");
assertTrue(/「作らなくてよい」という判断ではありません/.test(cls), "★誤読を止める一文がある");

console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
process.exit(failCount === 0 ? 0 : 1);
