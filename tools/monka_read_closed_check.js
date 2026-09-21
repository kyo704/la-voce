#!/usr/bin/env node
// STEP_0 の確かめ ── monka_read を持つ人から、門下の中身が 0行 に見えること
//   本人の鍵（anon）で引きます。管理の鍵は使いません。使うと決まりを飛び越えます。
const fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, "..");
const { createClient } = require(path.join(ROOT, "node_modules/@supabase/supabase-js"));
const HANAKO = "4b027d0a-11de-4acc-ae63-f240300c78aa";
function env(p) {
  const o = {};
  fs.readFileSync(path.join(ROOT, p), "utf8").split("\n").forEach((l) => {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(l);
    if (m) o[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  });
  return o;
}
let 数 = 0, 落 = 0;
const みる = (名, ok, 註) => { 数 += 1; if (!ok) 落 += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${名}${註 ? "  -- " + 註 : ""}`); };

(async () => {
  const 台帳 = env(".env.local"), e2e = env(".env.e2e");
  const sb = createClient(台帳.NEXT_PUBLIC_SUPABASE_URL, 台帳.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } });
  const { error: e1 } = await sb.auth.signInWithPassword({
    email: e2e.E2E_LOCAL_EMAIL, password: e2e.E2E_LOCAL_PASSWORD });
  if (e1) { console.error("入れません --", e1.message); process.exit(1); }

  // ① 門下の中身（teacher_id が 入って いる 行）が 見えない こと
  const { data: 門下, error: e2 } = await sb.from("org_messages")
    .select("id, title, teacher_id").not("teacher_id", "is", null);
  みる("①門下の中身が 0行", !e2 && (門下 || []).length === 0,
    e2 ? e2.message : `${(門下 || []).length}行 ${(門下 || []).map((r) => r.title).join(",")}`);

  // ② はなこの 行を 名ざしで 引いても 0行
  const { data: 名ざし } = await sb.from("org_messages")
    .select("id, title").eq("teacher_id", HANAKO);
  みる("②名ざしでも 0行", (名ざし || []).length === 0, `${(名ざし || []).length}行`);

  // ③ 較正 ── 学校ぜんぶのお知らせ（teacher_id が null）は 見える こと
  //    ★ぜんぶ 0行に なって いるなら、★閉じ過ぎて います。
  const { data: 学校 } = await sb.from("org_messages")
    .select("id, title").is("teacher_id", null);
  みる("③較正 ── 学校のお知らせは 見える", (学校 || []).length > 0,
    `${(学校 || []).length}行`);

  console.log(`\n${数 - 落} / ${数} 通りました`);
  process.exit(落 === 0 ? 0 : 1);
})().catch((e) => { console.error("止まりました --", e.message); process.exit(1); });
