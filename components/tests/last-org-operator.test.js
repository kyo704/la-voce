#!/usr/bin/env node
/**
 * 教室を運営できる人を、0 にしない（2026-09-02・Opus の裁定）
 *
 * ★前は owner だけを数えていました。
 *   admin だけが1人いる教室では、その人が自分を講師に落とすと
 *   ★運営できる人が0になります。オーナーが居ないので
 *   「最後のオーナー」の判定には引っかからず、通っていました。
 *   共同オーナーのときと同じ形です。★役割の名前ではなく、
 *   「運営できる人が何人残るか」で数えます。
 */
const { readCode } = require("./_source");

let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

const src = readCode("components", "VocalTracker.jsx");

// ---- 判定の中身を、そのまま取り出して動かす ----
const ORG_OPERATOR_ROLES = ["owner", "admin"];
function wouldBlock(members, targetUserId, newRole) {
  const operators = members.filter((m) => ORG_OPERATOR_ROLES.includes(m.role));
  const targetIsOperator = operators.some((m) => m.user_id === targetUserId);
  const stillOperator = ORG_OPERATOR_ROLES.includes(newRole);
  return operators.length === 1 && targetIsOperator && !stillOperator;
}

console.log("=== ★新しく守れるようになった場面 ===");
{
  // admin が1人だけ（owner が居ない）教室
  const soloAdmin = [{ user_id: "a", role: "admin" }, { user_id: "b", role: "teacher" }];
  assertTrue(wouldBlock(soloAdmin, "a", "teacher") === true,
    "★唯一の責任者が、自分を講師に落とす → 止まる");
  // ★前の判定（owner だけ数える）では、これが通っていたことを示す
  const oldRuleWouldBlock = (() => {
    const owners = soloAdmin.filter((m) => m.role === "owner");
    return owners.length === 1 && owners[0] && owners[0].user_id === "a" && "teacher" !== "owner";
  })();
  assertTrue(oldRuleWouldBlock === false, "★前の判定では通っていた（＝これが今回の穴）");
}

console.log("\n=== これまでどおり守れる場面 ===");
{
  const soloOwner = [{ user_id: "o", role: "owner" }, { user_id: "t", role: "teacher" }];
  assertTrue(wouldBlock(soloOwner, "o", "teacher") === true, "唯一のオーナーの降格 → 止まる");
  assertTrue(wouldBlock(soloOwner, "o", "admin") === false,
    "★オーナー→責任者は通る（運営者は1人のまま残る）");
}

console.log("\n=== 止めてはいけない場面 ===");
{
  const ownerAndAdmin = [
    { user_id: "o", role: "owner" }, { user_id: "a", role: "admin" }, { user_id: "t", role: "teacher" }
  ];
  assertTrue(wouldBlock(ownerAndAdmin, "o", "teacher") === false,
    "運営者が2人いれば、オーナーは降りられる");
  assertTrue(wouldBlock(ownerAndAdmin, "a", "teacher") === false,
    "責任者も、もう1人いれば降りられる");
  assertTrue(wouldBlock(ownerAndAdmin, "t", "admin") === false, "講師を責任者にするのは通る");
  const twoAdmins = [{ user_id: "a1", role: "admin" }, { user_id: "a2", role: "admin" }];
  assertTrue(wouldBlock(twoAdmins, "a1", "teacher") === false, "責任者が2人なら、片方は降りられる");
  assertTrue(wouldBlock(twoAdmins, "a1", "teacher") === false && wouldBlock([{ user_id: "a2", role: "admin" }], "a2", "teacher") === true,
    "★1人になったら、そこで止まる");
}

console.log("\n=== ★コード側に、同じ判定が入っている ===");
{
  assertTrue(/const ORG_OPERATOR_ROLES = \["owner", "admin"\];/.test(src),
    "運営できる役割が1か所にまとまっている");
  assertTrue(/operators\.length === 1 && targetIsOperator && !stillOperator/.test(src),
    "★人数で数えている（役割の名前で場合分けしていない）");
  assertTrue(!/最後のownerを降格することはできません/.test(src),
    "★古い「最後のowner」の文言が残っていない");
  assertTrue(/この教室を運営できる人が、いなくなってしまいます/.test(src),
    "何が起きるかを、そのまま言っている");
  assertTrue(/先に、ほかの方を「教室の責任者」にしてください/.test(src),
    "★次にできることを書いている（止めるだけにしない）");
}

console.log("\n=== ★死んだ取得を消した ===");
{
  assertTrue(!/async function fetchMyUpcomingLessons/.test(src),
    "fetchMyUpcomingLessons を消した（どこからも呼ばれていなかった）");
  assertTrue(/setMyUpcomingLessons\(deduped\)/.test(src),
    "★中身は fetchMyAllLessons が引き継いでいる");
}

console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
process.exit(failCount === 0 ? 0 : 1);
