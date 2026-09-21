#!/usr/bin/env node
// S2 の確かめ（裁定159 §4）── 本当に入って、本当に呼びます
//
//   @promise P-0484  門下を 開くと、開いた記録が 残ります（誰が・いつ・どの門下を）。
//   @promise P-0386  見た 記録は 消せません。
//   ★★この2つは、下の試験で確かめたものです。読んだだけで付けていません。
//     ★P-0484 …… ①中身を開くと1行増える（0→1）／役職名も残る
//     ★P-0386 …… ⑤update・delete が台帳で拒まれる（42501）／記録は残る
//
//   ①中身を開くと1行増える ②一覧だけでは増えない ③理由が空だと開けない
//   ④記録が書けないと中身が返らない ⑤update・delete が台帳で拒まれる
//   ⑥生徒・先生の画面に開いた記録が出ない
const fs = require("fs"), path = require("path");
const { execFileSync } = require("child_process");
const ROOT = path.resolve(__dirname, "..");
const { createClient } = require(path.join(ROOT, "node_modules/@supabase/supabase-js"));
const ORG = "11111111-1111-4111-8111-111111111111";
const 先生役 = "3edb38a1-9428-4656-a4f0-0b5f845e1408";
const 合言葉 = "Check-159-Woolsong";

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
  const { error: e0 } = await sb.auth.signInWithPassword({
    email: e2e.E2E_LOCAL_EMAIL, password: e2e.E2E_LOCAL_PASSWORD });
  if (e0) { console.error("入れません --", e0.message); process.exit(1); }

  const 前 = 数える("select count(*) from monka_read_log");

  // ② 一覧（名前だけ）では 増えない ── ★道を 呼ばない こと が 一覧 です。
  const { data: 一覧 } = await sb.from("assignments").select("teacher_id").eq("org_id", ORG);
  みる("②一覧だけでは 増えない",
    数える("select count(*) from monka_read_log") === 前,
    `一覧 ${(一覧 || []).length}件 ／ log ${数える("select count(*) from monka_read_log")}`);

  // ③ 理由が 空だと 開けない
  const { error: e3 } = await sb.rpc("open_monka_thread",
    { p_org_id: ORG, p_teacher_id: 先生役, p_reason_kind: "", p_reason_note: null });
  みる("③理由が 空だと 開けない", !!e3, e3 ? String(e3.message).slice(0, 44) : "開けました");
  みる("③-2 断られた ときは 1行も 増えない",
    数える("select count(*) from monka_read_log") === 前);

  // ③-3 「そのほか」で 短文が 空でも 開けない（★縛りで 止まります）
  const { data: d3b, error: e3b } = await sb.rpc("open_monka_thread",
    { p_org_id: ORG, p_teacher_id: 先生役, p_reason_kind: "sonohoka", p_reason_note: "  " });
  みる("③-3 そのほかで 短文が 空だと 開けない", !!e3b,
    e3b ? String(e3b.message).slice(0, 44) : "開けました");
  // ★★★④記録が 書けない ときは 中身が 返らない（fail closed）。
  //   ★★ここは 縛り（check）が 止めて います。★書く のが 先で、
  //     ★★返す のが 後 だから、★書けなければ 1行も 返りません。
  みる("④記録が 書けない ときは 中身が 返らない",
    !d3b || (d3b || []).length === 0, `${(d3b || []).length}行`);
  みる("③-4 そのときも 1行も 増えない",
    数える("select count(*) from monka_read_log") === 前);

  // ① 中身を 開くと 1行 増える
  const { data: 中身, error: e1 } = await sb.rpc("open_monka_thread",
    { p_org_id: ORG, p_teacher_id: 先生役, p_reason_kind: "jiko", p_reason_note: null });
  みる("①中身が 返る（3行）", !e1 && (中身 || []).length === 3,
    e1 ? e1.message : `${(中身 || []).length}行`);
  みる("①-2 記録が 1行 増える",
    数える("select count(*) from monka_read_log") === 前 + 1,
    `${前} → ${数える("select count(*) from monka_read_log")}`);
  みる("①-3 そのときの 役職名が 残る",
    数える("select count(*) from monka_read_log where post_name_at is not null") >= 1);

  // ⑤ update・delete が 台帳で 拒まれる
  const { data: u, error: eu } = await sb.from("monka_read_log")
    .update({ reason_note: "書き換え" }).eq("org_id", ORG).select("id");
  みる("⑤update が 通らない", !!eu || (u || []).length === 0,
    eu ? String(eu.code) : `${(u || []).length}行`);
  const { data: d, error: ed } = await sb.from("monka_read_log")
    .delete().eq("org_id", ORG).select("id");
  みる("⑤-2 delete が 通らない", !!ed || (d || []).length === 0,
    ed ? String(ed.code) : `${(d || []).length}行`);
  みる("⑤-3 記録が 残って いる",
    数える("select count(*) from monka_read_log") === 前 + 1);

  // ⑥ 先生の 画面に 開いた記録が 出ない
  const 先 = createClient(台帳.NEXT_PUBLIC_SUPABASE_URL, 台帳.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } });
  await 先.auth.signInWithPassword({ email: "kyo0703opera+s2check@gmail.com", password: 合言葉 });
  const { data: 先が見る } = await 先.from("monka_read_log").select("id");
  みる("⑥先生の 画面に 開いた記録が 出ない", (先が見る || []).length === 0,
    `${(先が見る || []).length}行`);

  console.log(`\n${数 - 落} / ${数} 通りました`);
  process.exit(落 === 0 ? 0 : 1);
})().catch((e) => { console.error("止まりました --", e.message); process.exit(1); });
