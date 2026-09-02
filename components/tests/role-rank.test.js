#!/usr/bin/env node
/**
 * 役割は「自分より上」を書けない（2026-09-02・順位で見る）
 *
 * ★役割の名前で場合分けするのをやめました。
 *   憲章 §9：教室まわりで3回続けて起きた壊れ方は、どれも
 *   「役割の名前で場合分けしていた」ことが原因でした。
 *   ★順位で言い直すと、1つの規則で足ります。
 *     「持っている以上のものは渡せない」（自分にも、他人にも）
 *
 * ★この検査はリポジトリの中しか見ていません。
 *   本番に別のポリシーが入っていれば、そちらが効きます。
 *   2026-09-02、それがまさに起きました（memberships_update_role_management）。
 */
// ★禁止形の検査は、必ずコメントを外したほうで行うこと。
//   この文書の冒頭には、古いポリシーを★説明のために引用してあります。
//   生のまま検査すると、自分の説明文に引っかかって落ちます。
//   （この repo で3回目です。CLAUDE.md にも書いてあります）
const { readRaw, readCode } = require("./_source");

let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

const sql = readRaw("supabase", "migration_role_rank_no_self_promotion.sql");
// ★禁止形（もう使っていない書き方）を探すときは、こちらを使います。
const sqlCode = readCode("supabase", "migration_role_rank_no_self_promotion.sql");

// ---- ポリシーの条件を、そのまま写して動かす ----
function rank(r) { return ({ owner: 3, admin: 2, teacher: 1 })[r] || 0; }
function withCheck(newRole, actorRole) {
  return newRole !== "owner" && rank(newRole) > 0 && rank(newRole) <= rank(actorRole);
}

console.log("=== ★自分を上げられないこと ===");
{
  assertTrue(withCheck("admin", "teacher") === false, "★講師が自分を責任者に → 止まる");
  assertTrue(withCheck("owner", "admin") === false, "★責任者が自分を owner に → 止まる");
  assertTrue(withCheck("owner", "owner") === false, "★オーナーでも、UPDATE で owner は書けない");
}

console.log("\n=== ★他人も上げられないこと（自分の順位まで） ===");
{
  assertTrue(withCheck("admin", "teacher") === false, "★講師が、別の講師を責任者に → 止まる");
  assertTrue(withCheck("admin", "owner") === true, "オーナーが講師を責任者に → 通る");
  assertTrue(withCheck("admin", "admin") === true, "責任者が講師を責任者に → 通る（同じ順位まで）");
}

console.log("\n=== 下げるのは通ること ===");
{
  assertTrue(withCheck("teacher", "admin") === true, "責任者が自分を講師に → 通る");
  assertTrue(withCheck("teacher", "owner") === true, "オーナーが自分を講師に → 通る");
}

console.log("\n=== ★知らない役割を書けないこと ===");
{
  // ★順位 0 は「最下位だから安全」ではありません。
  //   0 <= どの順位 も真なので、弾かないと★誰でも書けます。
  //   （設計した直後に、この検査で見つけました）
  assertTrue(withCheck("lead", "teacher") === false, "★知らない役割を、講師が書けない");
  assertTrue(withCheck("lead", "owner") === false, "★知らない役割は、オーナーでも書けない");
  assertTrue(withCheck("teacher", "none") === false, "★教室に居ない人は書けない（順位0）");
  assertTrue(/public\.org_role_rank\(role\) > 0/.test(sql),
    "★SQL 側にも「順位が0より大きいこと」がある");
}

console.log("\n=== ★SQL の形 ===");
{
  assertTrue(/as restrictive/.test(sql), "RESTRICTIVE である（PERMISSIVE では禁止できない）");
  assertTrue(/role <> 'owner'/.test(sql), "UPDATE で owner を書けない");
  assertTrue(/org_role_rank\(role\) <= public\.my_org_role_rank\(org_id\)/.test(sql),
    "★順位で比べている（役割の名前で場合分けしていない）");
  assertTrue(!/role <> 'admin' or/.test(sqlCode),
    "★名前で場合分けする古い形が残っていない（★コメントを外して検査）");
  assertTrue(/security definer/.test(sql), "再帰を避けるため SECURITY DEFINER");
  assertTrue(/not exists \(select 1 from public\.memberships m where m\.org_id = org_id\)/.test(sql),
    "★最初の1人（bootstrap）は通る");
  assertTrue(/revoke all on function public\.my_org_role_rank\(uuid\) from public, anon/.test(sql),
    "★anon には渡さない");
}

console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
process.exit(failCount === 0 ? 0 : 1);
