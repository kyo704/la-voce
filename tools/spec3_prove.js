#!/usr/bin/env node
// 仕様シート③「役職を変えた記録（誰が・いつ・誰を）」の試験（2026-09-21）
//   ★コードを読むだけで済ませません。実際に役職を渡して、行が増えるかを見ます。
//   ★試しの台帳だけ。本番には触れません。
const fs = require("fs"), path = require("path");
const { execFileSync } = require("child_process");
const ROOT = path.resolve(__dirname, "..");
const { createClient } = require(path.join(ROOT, "node_modules/@supabase/supabase-js"));
const base = "http://localhost:3000";
const ORG = "11111111-1111-4111-8111-111111111111";
const 相手 = "dc8f0554-3aa1-496c-be26-d7c07ece8380";   // 役職を持っていない方
const 役職 = "22222222-2222-4222-8222-222222222222";   // 課長

function env(p) {
  const o = {};
  fs.readFileSync(path.join(ROOT, p), "utf8").split("\n").forEach((l) => {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(l);
    if (m) o[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  });
  return o;
}
const 数える = (sql) => {
  const out = execFileSync("python3", [path.join(ROOT, "tools/ask_ledger.py"), "--test", sql],
    { encoding: "utf8" });
  const m = /^\s*(\d+)\s*$/m.exec(out);
  return m ? Number(m[1]) : NaN;
};
let 数 = 0, 落 = 0;
const みる = (名, ok, 註) => { 数 += 1; if (!ok) 落 += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${名}${註 ? "  -- " + 註 : ""}`); };

(async () => {
  const 台帳 = env(".env.local"), e2e = env(".env.e2e");
  const sb = createClient(台帳.NEXT_PUBLIC_SUPABASE_URL, 台帳.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } });
  const { data: 入, error } = await sb.auth.signInWithPassword({
    email: e2e.E2E_LOCAL_EMAIL, password: e2e.E2E_LOCAL_PASSWORD });
  if (error) { console.error("入れません --", error.message); process.exit(1); }
  const ref = String(台帳.NEXT_PUBLIC_SUPABASE_URL).replace(/^https:\/\//, "").split(".")[0];
  const 生 = "base64-" + Buffer.from(JSON.stringify(入.session), "utf8").toString("base64");
  const 塊 = []; for (let i = 0; i < 生.length; i += 3180) 塊.push(生.slice(i, i + 3180));
  const cookie = 塊.length === 1
    ? `sb-${ref}-auth-token=${生}`
    : 塊.map((v, i) => `sb-${ref}-auth-token.${i}=${v}`).join("; ");

  const 呼ぶ = async (body) => {
    const r = await fetch(base + "/api/org/posts", {
      method: "POST", headers: { "Content-Type": "application/json", cookie },
      body: JSON.stringify(body) });
    return { status: r.status, json: await r.json().catch(() => null) };
  };

  const 前 = 数える("select count(*) from post_change_log");
  console.log("  はじめの 記録 …… " + 前 + "行\n");

  // ① 役職を 渡す → 記録が 1行 増える
  const a = await 呼ぶ({ orgId: ORG, action: "assign", targetUser: 相手, postId: 役職 });
  みる("①役職を 渡せた", a.status === 200, `HTTP ${a.status} ${JSON.stringify(a.json)}`);
  const 後 = 数える("select count(*) from post_change_log");
  みる("①-2 記録が 1行 増える（期待 1行 → 結果 " + (後 - 前) + "行）", 後 === 前 + 1,
    `${前} → ${後}`);

  // ①-3 中身 ── 誰が・いつ・誰を
  const 誰が = 数える(`select count(*) from post_change_log where changed_by = '${入.user.id}'`);
  みる("①-3 誰が（changed_by）が 残る（期待 1行以上）", 誰が >= 1, `${誰が}行`);
  const 誰を = 数える(`select count(*) from post_change_log where target_user_id = '${相手}'`);
  みる("①-4 誰を（target_user_id）が 残る（期待 1行以上）", 誰を >= 1, `${誰を}行`);
  const いつ = 数える("select count(*) from post_change_log where changed_at is not null");
  みる("①-5 いつ（changed_at）が 残る（期待 1行以上）", いつ >= 1, `${いつ}行`);
  const 名 = 数える("select count(*) from post_change_log where to_post_name is not null");
  みる("①-6 役職の 名も 残る（★番号だけ だと 消えた とき 読めません）", 名 >= 1, `${名}行`);

  // ② 外す → もう1行 増える
  const b = await 呼ぶ({ orgId: ORG, action: "unassign", targetUser: 相手 });
  みる("②役職を 外せた", b.status === 200, `HTTP ${b.status}`);
  const 後2 = 数える("select count(*) from post_change_log");
  みる("②-2 もう1行 増える（期待 1行 → 結果 " + (後2 - 後) + "行）", 後2 === 後 + 1,
    `${後} → ${後2}`);
  const 前の名 = 数える("select count(*) from post_change_log where from_post_name is not null");
  みる("②-3 何から 外したかが 残る（期待 1行以上）", 前の名 >= 1, `${前の名}行`);

  // ③ 較正 ── 役職を 触らなければ 増えない
  const 後3 = 数える("select count(*) from post_change_log");
  みる("③較正 ── 触らなければ 増えない（期待 0行の 増え）", 後3 === 後2, `${後2} → ${後3}`);

  console.log(`\n${数 - 落} / ${数} 通りました`);
  process.exit(落 === 0 ? 0 : 1);
})().catch((e) => { console.error("止まりました --", e.message); process.exit(1); });
