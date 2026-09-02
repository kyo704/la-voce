#!/usr/bin/env node
/**
 * オーナーの役割を守る（2026-09-02・G4 ゲート #14）
 *
 * ★これはリポジトリの中だけを見る検査です。
 *   ★本番で効いているかは、supabase/check_owner_role_protection.sql を
 *   実行しないと分かりません。この検査は、その代わりにはなりません。
 *   （lessons と entries は、どちらもソースを読んでいる限り
 *     永久に見つからない穴でした）
 *
 * ★守ること
 *   ① オーナーの行を変えられるのは本人だけ（共同オーナー同士も不可）
 *   ② owner / admin を書けるのはオーナーだけ
 *   ③ オーナーが自分で降りる道は残す
 *   ④ 最初の1人（bootstrap）は塞がない
 *   ⑤ ★RESTRICTIVE であること（PERMISSIVE では何も禁止できない）
 */
const { readRaw } = require("./_source");

let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

const sql = readRaw("supabase", "migration_protect_owner_role.sql");
const check = readRaw("supabase", "check_owner_role_protection.sql");

console.log("=== ★RESTRICTIVE であること ===");
{
  // PERMISSIVE は OR で足されるので、いくら書いても禁止にならない
  const restrictives = (sql.match(/as restrictive/g) || []).length;
  assertTrue(restrictives === 3, `★3本とも RESTRICTIVE（いま ${restrictives} 本）`);
  ["for update", "for delete", "for insert"].forEach((cmd) => {
    assertTrue(new RegExp(`as restrictive\\s+${cmd}`).test(sql), `${cmd} に RESTRICTIVE がある`);
  });
}

console.log("\n=== ★既存のポリシーを消していない ===");
{
  // 本文を読まずに drop すると、教室が動かなくなる
  assertTrue(!/drop policy if exists "memberships_all_owner_admin"/.test(sql),
    "★memberships_all_owner_admin を消していない");
  assertTrue(!/drop policy if exists "memberships_insert_bootstrap_owner"/.test(sql),
    "★bootstrap のポリシーを消していない");
  // 自分が作る3本だけは、作り直せるように drop してよい
  const drops = (sql.match(/drop policy if exists "memberships_restrict_/g) || []).length;
  assertTrue(drops === 3, "自分の3本だけ作り直している");
}

console.log("\n=== ① オーナーの行は本人だけ ===");
{
  assertTrue(/role <> 'owner' or user_id = auth\.uid\(\)/.test(sql),
    "★変える前の行が owner なら、本人でなければ触れない");
  // ★共同オーナー同士も塞がれていること：役割ではなく user_id で判定している
  assertTrue(!/is_org_owner_or_admin\(auth\.uid\(\), org_id\)\s*\)\s*with check/.test(sql),
    "★『オーナーか責任者なら誰でも』では守っていない");
}

console.log("\n=== ② owner / admin を書けるのはオーナーだけ ===");
{
  assertTrue(/role not in \('owner', 'admin'\)/.test(sql), "owner / admin の書き込みを見ている");
  assertTrue(/public\.is_org_owner\(auth\.uid\(\), org_id\)/.test(sql),
    "★オーナーかどうかで判定する（責任者を含めない）");
  assertTrue(/create or replace function public\.is_org_owner\(/.test(sql),
    "is_org_owner を定義している");
  assertTrue(/and m\.role = 'owner'/.test(sql), "★admin を混ぜていない");
}

console.log("\n=== ③④ 降りる道と、最初の1人を塞がない ===");
{
  assertTrue(/not exists \(select 1 from public\.memberships m where m\.org_id = org_id\)/.test(sql),
    "★bootstrap の条件を書いている（最初の1人は通る）");
  assertTrue(/o\.created_by = auth\.uid\(\)/.test(sql), "自分が作った教室であること");
}

console.log("\n=== ★削除も塞ぐ ===");
{
  // 降格を塞いで削除を空けると、消して入れ直す回り道が残る
  assertTrue(/for delete[\s\S]{0,200}role <> 'owner' or user_id = auth\.uid\(\)/.test(sql),
    "★オーナーの行を消せるのも本人だけ");
}

console.log("\n=== ★5つの場面が、確認用SQLに揃っている ===");
{
  [
    ["格上げできてしまった行", "① 責任者が自分を owner に"],
    ["降格できてしまった行", "② 責任者がオーナーを降格"],
    ["AがBを降格できてしまった行", "③ ★共同オーナー同士（Opus が見つけた場面）"],
    ["自分で降りられた行", "④ オーナーが自分で降りる"],
    ["最初の1人として入れた行", "⑤ bootstrap"]
  ].forEach(([needle, label]) => assertTrue(check.includes(needle), label));
  assertTrue((check.match(/rollback;/g) || []).length >= 5, "★どの場面も rollback する");
  assertTrue(!/service_role/.test(check) || /service_role は RLS を素通り/.test(check),
    "service_role では確かめられないと書いてある");
}

console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
process.exit(failCount === 0 ? 0 : 1);
