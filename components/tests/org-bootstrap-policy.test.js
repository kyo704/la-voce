#!/usr/bin/env node
/**
 * 教室を作る道が、ふさがっていないか（2026-09-01）
 *
 * ★organizations には SELECT のポリシーしか無く、INSERT のポリシーが
 *   1つもありませんでした。RLS が有効な表に INSERT ポリシーが無いと、
 *   service_role 以外からの INSERT は★すべて拒否されます（42501）。
 *
 *   つまり teacher_beta_access を付けた★すべての先生が、招待コードを
 *   1つも発行できませんでした（発行の前に ensureOwnOrg() が走るため）。
 *
 * ★鶏と卵：memberships の既存ポリシーは
 *     WITH CHECK is_org_owner_or_admin(auth.uid(), org_id)
 *   ですが、できたばかりの教室には membership が1行も無いので、
 *   この条件は決して真になりません。最初の1行だけ、別の道が要ります。
 *
 * ★このテストは SQL を文として読みます。本物のDBには繋ぎません。
 *   実際に効くかは supabase/verify_org_insert_policies.sql で確かめます。
 */
const { readRaw, readCode } = require("./_source");
let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

const mig = readRaw("supabase", "migration_org_insert_policies.sql");
const live = mig.split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
const vt = readCode("components", "VocalTracker.jsx");

console.log("=== ★教室を作れる道がある ===");
assertTrue(/create policy "organizations_insert_own"/.test(live), "organizations の INSERT ポリシーがある");
assertTrue(/on public\.organizations for insert/.test(live), "INSERT に対するもの");
assertTrue(/with check \(auth\.uid\(\) = created_by\)/.test(live),
  "★自分を作成者としてのみ作れる（なりすませない）");
assertTrue(/to authenticated/.test(live), "★ログインしている人だけ（anon には開けない）");

console.log("\n=== ★最初の1人だけを通す道がある ===");
assertTrue(/create policy "memberships_insert_bootstrap_owner"/.test(live),
  "memberships の bootstrap ポリシーがある");
const boot = live.slice(live.indexOf("memberships_insert_bootstrap_owner"));
assertTrue(/user_id = auth\.uid\(\)/.test(boot), "★入れるのは自分自身だけ");
assertTrue(/role = 'owner'/.test(boot), "★役割は owner に限る");
assertTrue(/o\.created_by = auth\.uid\(\)/.test(boot), "★自分が作った教室に限る");
assertTrue(/not exists \(\s*select 1 from public\.memberships/.test(boot.replace(/\s+/g, " ").replace(/ /g, " ")) ||
           /not exists/.test(boot),
  "★まだ誰も居ない教室に限る（最初の1行だけ）");

console.log("\n=== ★広げすぎていない ===");
assertTrue(!/for update/i.test(live), "★UPDATE のポリシーを作っていない");
assertTrue(!/for delete/i.test(live), "★DELETE のポリシーを作っていない");
assertTrue(!/using \(true\)/i.test(live), "★無条件に開けていない");
assertTrue(!/to public\b/.test(live), "★public ロールに開けていない");
assertTrue(!/drop policy/i.test(live), "★既存のポリシーを消していない");
assertTrue(/if not exists \(select 1 from pg_policies/.test(live),
  "何度実行しても同じ結果になる形");

console.log("\n=== アプリ側の前提と合っている ===");
// ensureOwnOrg が入れる列と、ポリシーが見る列が一致していること
// ★幅を決め打ちしないこと。関数が伸びた分だけ見落とします
//   （2026-09-01、900字で切っていて role:"owner" を見落としました）。
const fnStart = vt.indexOf("async function ensureOwnOrg");
let d = 0, fnEnd = fnStart;
for (let i = vt.indexOf("{", fnStart); i < vt.length; i++) {
  if (vt[i] === "{") d++;
  else if (vt[i] === "}") { d--; if (d === 0) { fnEnd = i; break; } }
}
const fn = vt.slice(fnStart, fnEnd + 1);
assertTrue(/created_by: userId/.test(fn), "★アプリは created_by に自分を入れている");
assertTrue(/role: "owner"/.test(fn), "★アプリは owner として membership を作る");
assertTrue(/kind: "solo"/.test(fn), "solo として作る");
assertTrue(/\.eq\("role", "owner"\)/.test(fn), "既に owner なら作り直さない（何度押しても安全）");

console.log("\n=== ★INSERT ... RETURNING のための SELECT ポリシー ===");
// .select() を付けた INSERT は、書いた行を読み返します。
// できたばかりの教室は membership が無いので、作成者自身にも読めませんでした。
assertTrue(/\.insert\(\{ name: "マイ教室"[\s\S]{0,120}\.select\(\)/.test(fn),
  "アプリは .select() を付けて INSERT している（org.id が要るため）");
const sel = readRaw("supabase", "migration_org_insert_policies.sql");
assertTrue(/organizations_select_own_created/.test(sel) || /created_by = auth\.uid\(\)/.test(sel),
  "★作成者が自分の教室を読める SELECT ポリシーが要る");

console.log("\n=== ★membership の失敗を見逃さない ===");
assertTrue(/const \{ error: memError \}/.test(fn),
  "★membership の INSERT の error を受け取っている");
assertTrue(/if \(memError\)/.test(fn), "★失敗したら止まる");
assertTrue(/setInviteError/.test(fn.slice(fn.indexOf("memError"))),
  "★画面にも出す（console だけにしない）");
assertTrue(/eq\("created_by", userId\)/.test(fn),
  "★前回作りかけた教室を拾う（押すたびに増やさない）");

console.log("\n=== 確かめ方が用意してある ===");
const ver = readRaw("supabase", "verify_org_insert_policies.sql");
assertTrue(/set local role authenticated/.test(ver), "★authenticated になりすまして試す");
assertTrue(/rollback/.test(ver), "★最後に巻き戻す（何も残さない）");
assertTrue(/request\.jwt\.claims/.test(ver), "auth.uid() が効く形にしている");

console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
process.exit(failCount === 0 ? 0 : 1);
