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

const sql = readRaw("supabase", "migration_fix_memberships_update_policy.sql");
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

console.log("\n=== ② 役割の書き分け（2026-09-02 の裁定に更新） ===");
{
  // ★前の版は「owner も admin もオーナーだけが書ける」でした。
  //   裁定が変わり、いまはこうです。
  //     ・owner は★誰も書けない（UPDATE では。bootstrap のときだけ）
  //     ・admin はオーナー★または責任者が書ける（ふつうの教室運営のため）
  assertTrue(/role <> 'owner'/.test(sql), "★owner は書けない");
  assertTrue(/role <> 'admin' or public\.is_org_owner_or_admin\(auth\.uid\(\), org_id\)/.test(sql),
    "admin を書けるのはオーナーか責任者");
  // ★オーナーの行を守るのは、役割ではなく user_id で見ていること
  assertTrue(/role <> 'owner' or user_id = auth\.uid\(\)/.test(sql),
    "★オーナーの行は本人だけ（共同オーナー同士も止まる）");
  assertTrue(!/is_org_owner\(auth\.uid\(\), org_id\)\s*\n\s*\);/.test(sql),
    "★前の版の判定が残っていない");
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

console.log("\n=== ★正しい操作は通ること（締めすぎの防止） ===");
{
  // ★止めていたのは、足したポリシーではありません。効きすぎた PERMISSIVE です。
  //   RESTRICTIVE は AND なので、そもそも何も許せません。
  assertTrue(/drop policy if exists "memberships_update_self_only"/.test(sql),
    "★効きすぎていた PERMISSIVE を置き換えている");
  assertTrue(/create policy "memberships_update_allowed"[\s\S]{0,300}is_org_owner_or_admin/.test(sql),
    "★オーナー・責任者が、他人の行に触れる道がある");
  assertTrue(/role <> 'admin' or public\.is_org_owner_or_admin/.test(sql),
    "★admin を書けるのはオーナーか責任者");
  // 消す前に控えを取らせている
  const dropAt = sql.indexOf('drop policy if exists "memberships_update_self_only"');
  const selectAt = sql.indexOf("from pg_policies");
  assertTrue(selectAt > -1 && selectAt < dropAt,
    "★消す前に、本文を控える select がある（repo に無いポリシーのため）");
}

console.log("\n=== ★自分で自分を owner にできないこと（2026-09-02 の事故） ===");
{
  // ★本番で起きたこと：責任者が★自分の行を owner に書き換えて、通った。
  //   本番に入っていたのは memberships_update_role_management で、
  //   その WITH CHECK は（報告どおりなら）こうでした。
  //       (role = 'owner' AND auth.uid() = user_id) OR (role <> 'owner')
  //   ★「前が何だったか」を見ていないので、
  //     「オーナーが自分の行を触る」と「責任者が自分を上げる」が
  //     ★同じ条件で通ります。
  //
  // ★この形が repo に紛れ込んだら落ちるようにします。
  assertTrue(!/role = 'owner'\s+and\s+auth\.uid\(\) = user_id/i.test(sql),
    "★「owner かつ本人」で許す形になっていない（自己昇格が通る形）");
  assertTrue(!/auth\.uid\(\) = user_id\s*\)\s*or\s*\(\s*role <> 'owner'/i.test(sql),
    "★（owner かつ本人）OR（owner でない）の形になっていない");

  // ★正しい形：role <> 'owner' が WITH CHECK の AND の直下にあること。
  //   これがあれば、自分の行でも owner は書けません。
  const wc = sql.slice(sql.indexOf("memberships_restrict_owner_row_update"));
  const wcBody = wc.slice(wc.indexOf("with check"), wc.indexOf(");", wc.indexOf("with check")));
  assertTrue(/role <> 'owner'/.test(wcBody), "★WITH CHECK が owner を禁じている");
  assertTrue(!/\bor\b/i.test(wcBody.replace(/--[^\n]*/g, "").replace(/role <> 'admin' or [^\n]*/g, "")),
    "★owner の禁止が OR で緩められていない");
}

console.log("\n=== ★owner は UPDATE では書けない ===");
{
  assertTrue(/with check \(\s*\n\s*--[^\n]*\n\s*role <> 'owner'/.test(sql),
    "★UPDATE で owner を書く道が閉じている");
  // bootstrap だけは owner で入れる
  assertTrue(/and role = 'owner'\s*\n\s*and exists \(select 1 from public\.organizations/.test(sql),
    "★最初の1人だけ owner で入れる");
  assertTrue(!/role not in \('owner', 'admin'\)\s*\n\s*or public\.is_org_owner\(auth\.uid\(\), org_id\)\s*\n\s*\);/.test(sql),
    "★前の版（オーナーなら owner を書ける）が残っていない");
}

console.log("\n=== ★8つの場面が、確認用SQLに揃っている ===");
{
  [
    ["格上げできてしまった行", "① 責任者が自分を owner に"],
    ["降格できてしまった行", "② 責任者がオーナーを降格"],
    ["AがBを降格できてしまった行", "③ ★共同オーナー同士（Opus が見つけた場面）"],
    ["自分で降りられた行", "④ オーナーが自分で降りる"],
    ["最初の1人として入れた行", "⑤ bootstrap"],
    ["責任者にできた行", "⑥ ★オーナーが講師を責任者にする（通ること）"],
    ["講師に戻せた行", "⑦ ★責任者を講師に戻す（通ること）"],
    ["自分を責任者にできてしまった行", "⑧ 講師が自分を責任者に（止まること）"]
  ].forEach(([needle, label]) => assertTrue(check.includes(needle), label));
  assertTrue((check.match(/rollback;/g) || []).length >= 8, "★どの場面も rollback する");
  assertTrue(!/service_role/.test(check) || /service_role は RLS を素通り/.test(check),
    "service_role では確かめられないと書いてある");
}

console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
process.exit(failCount === 0 ? 0 : 1);
