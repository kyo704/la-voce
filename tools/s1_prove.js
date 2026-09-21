#!/usr/bin/env node
// S1 の証明（裁定159 PROVE_1_2）── 試しの台帳で、本当に入って引きます
//
//   ★なりすまし（set local role ＋ set_config）を使いません。
//     BEGIN/ROLLBACK が要ります。この品では使いません（2026-09-15 の一件）。
//     ロールバックが効かず、権限がそのまま残ったことがあります。
//   ★だから確かめ用の利用者を本当に作り、本当の合言葉で入ります。
//   ★読むだけです。1行も書きません。
const fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, "..");
const { createClient } = require(path.join(ROOT, "node_modules/@supabase/supabase-js"));
const 先生役 = "3edb38a1-9428-4656-a4f0-0b5f845e1408";
const たろう = "eafa63c2-4592-4996-8c7c-18ecbec5a34f";
const 合言葉 = "Check-159-Woolsong";

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
  const 客 = () => createClient(台帳.NEXT_PUBLIC_SUPABASE_URL,
    台帳.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const 入る = async (mail, pw) => {
    const sb = 客();
    const { data, error } = await sb.auth.signInWithPassword({ email: mail, password: pw });
    if (error) { console.error("入れません", mail, error.message); process.exit(1); }
    return { sb, id: data.user.id };
  };
  const 引く = async (sb, teacherId) => {
    const { data, error } = await sb.from("org_messages")
      .select("id, title").eq("teacher_id", teacherId);
    return { n: (data || []).length, error };
  };

  // ① 先生が 自分の 門下を 読める
  // ★先生役は、合言葉を持っている確かめ用の利用者です。
  //   ★★はなこ（もとからいる先生）の合言葉を持っていないため、こちらを使います。
  const 先 = await 入る("kyo0703opera+s2check@gmail.com", 合言葉);
  const a = await 引く(先.sb, 先生役);
  みる("①先生が 自分の 門下を 読める（3行）", !a.error && a.n === 3,
    a.error ? a.error.message : `${a.n}行`);

  // ② 学生1 が 自分の 門下を 読める
  const 学1 = await 入る("kyo0703opera+s1check@gmail.com", 合言葉);
  const b = await 引く(学1.sb, 先生役);
  みる("②学生1 が 自分の 門下を 読める（3行）", !b.error && b.n === 3,
    b.error ? b.error.message : `${b.n}行`);

  // ②b 学生1 が 別の 門下を 読めない
  const c = await 引く(学1.sb, たろう);
  みる("②b 学生1 が 別の 門下を 読めない（0行）", c.n === 0, `${c.n}行`);

  // ③ monka_read だけの 人が 他人の 門下を 読めない
  const 運 = await 入る(e2e.E2E_LOCAL_EMAIL, e2e.E2E_LOCAL_PASSWORD);
  const d = await 引く(運.sb, 先生役);
  みる("③monka_read を 持つ 人が 他人の 門下を 読めない（0行）", d.n === 0, `${d.n}行`);
  // ③-2 較正 ── 学校ぜんぶの お知らせは 見える
  const { data: 学校 } = await 運.sb.from("org_messages").select("id").is("teacher_id", null);
  みる("③-2 較正 ── 学校の お知らせは 見える", (学校 || []).length > 0,
    `${(学校 || []).length}行`);

  console.log(`\n${数 - 落} / ${数} 通りました`);
  process.exit(落 === 0 ? 0 : 1);
})().catch((e) => { console.error("止まりました --", e.message); process.exit(1); });
