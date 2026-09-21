#!/usr/bin/env node
// S1 の3つの確かめ（裁定159）
//   ①先生が自分の門下を読める  ②学生が自分の門下を読める
//   ③monka_read だけの人が、直接の select で他人の門下 0行
//   ★読むだけです。1行も書きません。
const fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, "..");
const { createClient } = require(path.join(ROOT, "node_modules/@supabase/supabase-js"));
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
  const e2e = env(".env.e2e");
  const 本番 = createClient(e2e.E2E_SUPABASE_URL.startsWith("http")
    ? e2e.E2E_SUPABASE_URL : "https://" + e2e.E2E_SUPABASE_URL + ".supabase.co",
    e2e.E2E_SUPABASE_ANON, { auth: { persistSession: false } });

  console.log("=== ①先生が 自分の 門下を 読める（本番・読むだけ）===");
  const { data: 入, error: e1 } = await 本番.auth.signInWithPassword({
    email: e2e.E2E_TEACHER_EMAIL, password: e2e.E2E_TEACHER_PASSWORD });
  if (e1 || !入) { みる("①先生で 入れる", false, e1 && e1.message); }
  else {
    const me = 入.user.id;
    const { data, error } = await 本番.from("org_messages")
      .select("id, teacher_id").eq("teacher_id", me);
    みる("①先生が 自分の 門下を 引ける（断られない）", !error,
      error ? error.message : `${(data || []).length}行`);
    // ★よその 先生の 門下は 見えない こと（★先生は monka_read を 持ちません）。
    const { data: よそ } = await 本番.from("org_messages")
      .select("id, teacher_id").not("teacher_id", "is", null).neq("teacher_id", me);
    みる("①-2 よその 先生の 門下は 0行", (よそ || []).length === 0,
      `${(よそ || []).length}行`);
  }

  console.log("\n=== ③monka_read だけの 人（試しの台帳）===");
  const 台帳 = env(".env.local");
  const 試し = createClient(台帳.NEXT_PUBLIC_SUPABASE_URL, 台帳.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } });
  const { error: e3 } = await 試し.auth.signInWithPassword({
    email: e2e.E2E_LOCAL_EMAIL, password: e2e.E2E_LOCAL_PASSWORD });
  if (e3) { みる("③入れる", false, e3.message); }
  else {
    const { data: 門下 } = await 試し.from("org_messages")
      .select("id, title").not("teacher_id", "is", null);
    みる("③他人の 門下が 0行", (門下 || []).length === 0, `${(門下 || []).length}行`);
    const { data: 学校 } = await 試し.from("org_messages")
      .select("id").is("teacher_id", null);
    みる("③-2 較正 ── 学校の お知らせは 見える", (学校 || []).length > 0,
      `${(学校 || []).length}行`);
  }

  console.log(`\n${数 - 落} / ${数} 通りました`);
  process.exit(落 === 0 ? 0 : 1);
})().catch((e) => { console.error("止まりました --", e.message); process.exit(1); });
