#!/usr/bin/env node
// ============================================================================
// 裁定151 の Q1〜Q6 を、試しの台帳で実際に押して確かめます（2026-09-21）
//
//   みなの鍵（anon）で入り、本人として書きます。決まり（RLS）が効きます。
//   管理の鍵は使いません。使うと決まりを飛び越え、何も確かめられません。
// ============================================================================
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const { createClient } = require(path.join(ROOT, "node_modules/@supabase/supabase-js"));

const A = "11111111-1111-4111-8111-111111111111";   // くらべ用（koma_mine あり）
const B = "55555555-5555-4555-8555-555555555555";   // くらべ用B（koma_mine なし）
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
function みる(名, ok, 註) {
  数 += 1; if (!ok) 落 += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${名}${註 ? "  -- " + 註 : ""}`);
}

(async () => {
  const 台帳 = env(".env.local");
  const e2e = env(".env.e2e");
  const sb = createClient(台帳.NEXT_PUBLIC_SUPABASE_URL, 台帳.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } });
  const { data: 入, error: e1 } = await sb.auth.signInWithPassword({
    email: e2e.E2E_LOCAL_EMAIL, password: e2e.E2E_LOCAL_PASSWORD
  });
  if (e1) { console.error("入れません --", e1.message); process.exit(1); }
  const me = 入.user.id;
  console.log("入りました …… " + me + "\n");

  const 片づけ = [];
  const 入れる = (row) => sb.from("my_periods").insert(row).select("id");

  // Q1 学校に属さない人が、自分のコマ（org_id null）を書ける
  //    門の字に在籍の語がありません。だから在籍0校でも通ります。
  //    ここでは本人として、org_id null の行を実際に入れて見ます。
  {
    const { data, error } = await 入れる(
      { user_id: me, org_id: null, ord: 18, name: "Q1個人", start_min: 100, end_min: 140 });
    if (data && data[0]) 片づけ.push(data[0].id);
    みる("Q1 個人のコマ（org_id null）を書ける", !error && !!(data && data[0]),
      error ? error.message : "");
  }

  // Q2 A校で koma_mine を持つ人が、B校のコマを書けない
  {
    const { data, error } = await 入れる(
      { user_id: me, org_id: B, ord: 19, name: "Q2B校", start_min: 100, end_min: 140 });
    if (data && data[0]) 片づけ.push(data[0].id);
    みる("Q2 札の無い学校（B校）のコマは書けない", !!error && !(data && data[0]),
      error ? error.code : "通ってしまいました");
  }

  // Q2-裏 A校のコマは書ける（門が「いつも拒む」だけでないこと）
  {
    const { data, error } = await 入れる(
      { user_id: me, org_id: A, ord: 20, name: "Q2A校", start_min: 100, end_min: 140 });
    if (data && data[0]) 片づけ.push(data[0].id);
    みる("Q2-裏 札のある学校（A校）のコマは書ける", !error && !!(data && data[0]),
      error ? error.message : "");
  }

  // Q3 org_id を別の学校へ書き換えられない
  {
    const { data: 行 } = await sb.from("my_periods")
      .select("id").eq("user_id", me).eq("org_id", A).limit(1);
    const id = 行 && 行[0] && 行[0].id;
    const { error } = await sb.from("my_periods").update({ org_id: B }).eq("id", id).select("id");
    みる("Q3 コマの学校をあとから変えられない", !!error,
      error ? String(error.message).slice(0, 48) : "通ってしまいました");
  }

  // Q4 事務が get_teacher_periods で、個人のコマ（null）を1行も読めない
  {
    const { data, error } = await sb.rpc("get_teacher_periods",
      { p_org_id: A, p_teacher_id: HANAKO });
    const 名 = (data || []).map((r) => r.name);
    みる("Q4 個人のコマ（null）は学校の側に出ない",
      !error && !名.includes("はなこ個人"), error ? error.message : 名.join(","));
    // Q5 事務が、同じ学校の先生のコマは読める（裁定99 F1）
    みる("Q5 同じ学校の先生のコマは読める（裁定99 F1）",
      !error && 名.includes("はなこ1限"), error ? error.message : 名.join(","));
  }

  // 片づけ
  for (const id of 片づけ) await sb.from("my_periods").delete().eq("id", id);
  console.log(`\n${数 - 落} / ${数} 通りました`);
  process.exit(落 === 0 ? 0 : 1);
})().catch((e) => { console.error("止まりました --", e.message); process.exit(1); });
