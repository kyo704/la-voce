#!/usr/bin/env node
/**
 * 消えたアカウントの数（2026-08-30）
 *
 * ★数だけです。誰が消したかを、あとから知る手立てを作らないこと。
 *
 * ★守りたいこと
 *   ① 表に、時刻以外の列を作らない（user_id・メール・その断片・ハッシュ）
 *   ② 「本当に消したとき」だけ数える。30日の猶予の申し出では数えない
 *   ③ 数えるのは1か所（purgeAccount）。呼ぶ側で数えると二重になる
 *   ④ 数えられなくても、削除は成功のまま（数より、消えることが大事）
 *   ⑤ 本人には読めない（RLS 有効・ポリシー無し＝service_role だけ）
 *   ⑥ 管理画面が「*」で読まない
 */
const { readCode, readRaw } = require("./_source");
let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

const sql = readCode("supabase", "migration_account_deletions_count.sql");
const del = readCode("lib", "accountDeletion.js");
const admin = readCode("app/admin", "page.js");

console.log("=== ★① 時刻以外の列が無い ===");
const createAt = sql.indexOf("create table if not exists public.account_deletions");
const body = sql.slice(createAt, sql.indexOf(");", createAt));
assertTrue(/deleted_at timestamptz not null default now\(\)/.test(body), "deleted_at がある");
assertTrue(/id uuid primary key/.test(body), "id がある");
// ★身元につながる語が、表の定義に1つも無いこと
["user_id", "email", "mail", "hash", "digest", "ip", "name", "profile"].forEach((w) => {
  assertTrue(!new RegExp(w, "i").test(body), `★表の定義に ${w} が無い`);
});
// 列は2つだけ
const cols = body.split("\n").filter((l) => /^\s{2}\w+ /.test(l)).length;
assertTrue(cols === 2, `★列は2つだけ（${cols}）`);

console.log("\n=== ★② 本当に消したときだけ数える ===");
// purgeAccount の中で数えること。猶予の申し出（deleted_at を立てる側）では数えない。
assertTrue(/from\("account_deletions"\)\.insert\(\{\}\)/.test(del), "purgeAccount で数えている");
assertTrue(!/account_deletions/.test(readCode("app/api/account/delete", "route.js")),
  "★削除の入口では数えていない（猶予の申し出で数えない）");
assertTrue(!/account_deletions/.test(readCode("app/api/cron/purge-deleted", "route.js")),
  "★定期処理でも数えていない（purgeAccount が1か所で数える）");

console.log("\n=== ★③ 数えるのは、消し終わったあと ===");
const purgeAt = del.indexOf("export async function purgeAccount");
const purgeBody = del.slice(purgeAt, del.indexOf("\n}", purgeAt));
const authAt = purgeBody.indexOf("deleteUser(userId)");
const countAt = purgeBody.indexOf('from("account_deletions")');
assertTrue(authAt > 0 && countAt > authAt, "★auth のユーザーを消したあとに数える");
// ★数えられなくても、削除は成功のまま
const tail = purgeBody.slice(countAt);
assertTrue(!/return \{ ok: false/.test(tail), "★記録に失敗しても ok: false にしない");
assertTrue(/return \{ ok: true, failures: \[\] \};/.test(tail), "最後は成功で返る");

console.log("\n=== ★⑤ 本人には読めない ===");
assertTrue(/enable row level security/.test(sql), "RLS が有効");
assertTrue(!/create policy/.test(sql), "★ポリシーを1つも作っていない（service_role だけ）");

console.log("\n=== ★⑥ 管理画面 ===");
assertTrue(/from\("account_deletions"\)\.select\("deleted_at"\)/.test(admin),
  "★deleted_at だけを読んでいる（* にしていない）");
assertTrue(/slice\(0, 7\)/.test(admin), "★月まで（日ではない）で丸めている");
assertTrue(!/email|user_id/.test(admin.slice(admin.indexOf("account_deletions"), admin.indexOf("account_deletions") + 900)),
  "★身元につながる語を扱っていない");
assertTrue(/誰が消したかは分かりません/.test(readRaw("app/admin", "page.js")),
  "★画面にも、数だけだと書いてある");

console.log("\n=== 消えたあとに同じメールで登録し直せるか ===");
// ★profiles を消し、auth のユーザーも消すので、メールは残りません。
assertTrue(/from\("profiles"\)\.delete\(\)\.eq\("id", userId\)/.test(del), "profiles の行を消す");
assertTrue(/auth\.admin\.deleteUser\(userId\)/.test(del), "★auth のユーザーも消す（メールごと）");
assertTrue(!/account_deletions[\s\S]{0,200}email/.test(del), "★数の表にメールを持ち込んでいない");

console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
process.exit(failCount === 0 ? 0 : 1);
