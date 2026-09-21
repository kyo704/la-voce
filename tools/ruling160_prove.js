#!/usr/bin/env node
// 裁定160 の確かめ ── 役職の できること を変えると1行残るか
//   ★実在の試しの利用者で。なりすましは使いません。
//   ★試しの台帳だけ。本番には触れません。
const fs = require("fs"), path = require("path");
const { execFileSync } = require("child_process");
const ROOT = path.resolve(__dirname, "..");
const { createClient } = require(path.join(ROOT, "node_modules/@supabase/supabase-js"));
const ORG = "11111111-1111-4111-8111-111111111111";
const 課長 = "22222222-2222-4222-8222-222222222222";

function env(p) {
  const o = {};
  fs.readFileSync(path.join(ROOT, p), "utf8").split("\n").forEach((l) => {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(l);
    if (m) o[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  });
  return o;
}
const 台帳に = (sql, w) => execFileSync("python3",
  [path.join(ROOT, "tools/ask_ledger.py"), "--test"].concat(w ? ["--write", "--ok"] : []).concat([sql]),
  { encoding: "utf8" });
const 数える = (sql) => {
  const m = /^\s*(-?\d+)\s*$/m.exec(台帳に(sql));
  return m ? Number(m[1]) : NaN;
};
let 数 = 0, 落 = 0;
const みる = (名, ok, 註) => { 数 += 1; if (!ok) 落 += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${名}${註 ? "  -- " + 註 : ""}`); };

(async () => {
  const 台帳 = env(".env.local"), e2e = env(".env.e2e");
  const sb = createClient(台帳.NEXT_PUBLIC_SUPABASE_URL, 台帳.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } });
  const { error } = await sb.auth.signInWithPassword({
    email: e2e.E2E_LOCAL_EMAIL, password: e2e.E2E_LOCAL_PASSWORD });
  if (error) { console.error("入れません --", error.message); process.exit(1); }

  const n = () => 数える("select count(*) from org_post_perm_log");
  const 前 = n();
  console.log("  はじめの 記録 …… " + 前 + "行\n");

  // ① できこと を 1つ 入れる
  台帳に(`update public.org_posts set perms = perms || '{"monka_read": true}'::jsonb where id = '${課長}'`, true);
  みる("①できことを 1つ 入れる → 1行（期待 1行 → 結果 " + (n() - 前) + "行）", n() === 前 + 1);
  みる("①-2 増えたものに monka_read が 残る（期待 1行以上）",
    数える(`select count(*) from org_post_perm_log where 'monka_read' = any(added)`) >= 1);

  // ② 切る
  const a = n();
  台帳に(`update public.org_posts set perms = perms - 'monka_read' where id = '${課長}'`, true);
  みる("②切る → 1行（期待 1行 → 結果 " + (n() - a) + "行）", n() === a + 1);
  みる("②-2 減ったものに monka_read が 残る（期待 1行以上）",
    数える(`select count(*) from org_post_perm_log where 'monka_read' = any(removed)`) >= 1);

  // ③ 名前だけ 変える
  const b = n();
  台帳に(`update public.org_posts set name = '課長（ためし）' where id = '${課長}'`, true);
  みる("③名前だけ 変える → 1行（期待 1行 → 結果 " + (n() - b) + "行）", n() === b + 1);
  みる("③-2 そのとき 増えも 減りも 空（期待 1行以上）",
    数える(`select count(*) from org_post_perm_log where added = '{}' and removed = '{}' and op = 'update'`) >= 1);
  台帳に(`update public.org_posts set name = '課長' where id = '${課長}'`, true);

  // ④ ほかの 列だけ 変える → 残さない
  const c = n();
  台帳に(`update public.org_posts set sort_order = sort_order where id = '${課長}'`, true);
  みる("④ほかの列だけ → 残さない（期待 0行の 増え → 結果 " + (n() - c) + "行）", n() === c);

  // ⑤ 役職を 作る・消す
  const d = n();
  台帳に(`insert into public.org_posts (id, org_id, name, perms) values ('cccc0000-0000-4000-8000-000000000001','${ORG}','ためしの役職','{"meibo": true}'::jsonb) on conflict (id) do nothing`, true);
  みる("⑤作る → 1行（期待 1行 → 結果 " + (n() - d) + "行）", n() === d + 1);
  const e = n();
  台帳に(`delete from public.org_posts where id = 'cccc0000-0000-4000-8000-000000000001'`, true);
  みる("⑤-2 消す → 1行（期待 1行 → 結果 " + (n() - e) + "行）", n() === e + 1);
  みる("⑤-3 消したとき その時点の perms が 残る（期待 1行以上）",
    数える(`select count(*) from org_post_perm_log where op = 'delete' and perms_before is not null`) >= 1);

  // ⑥ 決まり ── post か master を持つ人は 読める
  const { data: 読み, error: e6 } = await sb.from("org_post_perm_log").select("id");
  みる("⑥post を 持つ 人は 読める（期待 1行以上）", !e6 && (読み || []).length >= 1,
    e6 ? e6.message : `${(読み || []).length}行`);

  // ⑥-2 較正 ── 持たない 人は 読めない
  const 他 = createClient(台帳.NEXT_PUBLIC_SUPABASE_URL, 台帳.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } });
  await 他.auth.signInWithPassword({ email: "kyo0703opera+s1check@gmail.com", password: "Check-159-Woolsong" });
  const { data: 他読み } = await 他.from("org_post_perm_log").select("id");
  みる("⑥-2 較正 ── 持たない人は 読めない（期待 0行 → 結果 " + ((他読み || []).length) + "行）",
    (他読み || []).length === 0);

  // ⑦ update・delete が 拒まれる
  const { data: u, error: eu } = await sb.from("org_post_perm_log").update({ op: "update" }).eq("org_id", ORG).select("id");
  みる("⑦update が 通らない（期待 0行）", !!eu || (u || []).length === 0, eu ? eu.code : `${(u||[]).length}行`);
  const { data: dd, error: ed } = await sb.from("org_post_perm_log").delete().eq("org_id", ORG).select("id");
  みる("⑦-2 delete が 通らない（期待 0行）", !!ed || (dd || []).length === 0, ed ? ed.code : `${(dd||[]).length}行`);

  console.log(`\n${数 - 落} / ${数} 通りました`);
  process.exit(落 === 0 ? 0 : 1);
})().catch((e) => { console.error("止まりました --", e.message); process.exit(1); });
