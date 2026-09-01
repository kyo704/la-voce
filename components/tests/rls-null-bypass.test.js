#!/usr/bin/env node
/**
 * ★「列が null なら誰でも」を書かない（2026-09-02）
 *
 * ★実際に起きたこと
 *   lessons の4つのポリシーが、すべてこの形で始まっていました。
 *       (org_id IS NULL) OR can_view_ops(auth.uid(), org_id, student_id)
 *   PERMISSIVE は OR で足されます。org_id が null の行では
 *   ★左側が真になり、can_view_ops は一度も呼ばれません。
 *
 *   紐付け経由のレッスンは org_id が null です。つまり
 *   ★先生と生徒の1対1のレッスンが、全員に見えていました。
 *   +s1 で数えたところ、3行のうち★1行が他人のものでした。
 *
 * ★見抜けなかった理由
 *   ポリシーがリポジトリに1つも書かれていませんでした。
 *   schema.sql にあるのは profiles・subscriptions・entries だけで、
 *   lessons のポリシーは手で当てたものです。
 *   ★読めないものは、検査もできません。
 *   だからポリシーの写しを supabase/ に置き、ここで見張ります。
 *
 * ★この検査が見るもの
 *   「NULL なら通す」という形が、移行ファイルにも写しにも無いこと。
 */
const fs = require("fs");
const path = require("path");

let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

const root = path.join(__dirname, "..", "..");
const sqlDir = path.join(root, "supabase");
const files = fs.readdirSync(sqlDir).filter((f) => f.endsWith(".sql"));

/** コメント行を落とす。★説明文の中の例に引っかからないため。 */
function codeOf(text) {
  return text.split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
}

console.log("=== ★「null なら誰でも通す」形が無い ===");
{
  // (col IS NULL) OR …  という形。★その列が null の行は、authorization を素通りします。
  const BYPASS = /\(\s*\w+\s+is\s+null\s*\)\s*or\s/i;
  const bad = [];
  files.forEach((f) => {
    const code = codeOf(fs.readFileSync(path.join(sqlDir, f), "utf8"));
    // ポリシーの中だけを見る（ふつうの SQL の is null は対象外）
    const policies = code.match(/create policy[\s\S]*?;/gi) || [];
    policies.forEach((pol) => {
      if (BYPASS.test(pol)) {
        const name = (pol.match(/create policy "([^"]+)"/i) || [])[1] || "(名前不明)";
        bad.push(`${f}: ${name}`);
      }
    });
  });
  assertTrue(bad.length === 0,
    bad.length === 0
      ? "★(列 IS NULL) OR … で始まるポリシーが無い"
      : `★null で素通りするポリシー: ${bad.join(", ")}`);
}

console.log("\n=== lessons の直しが入っている ===");
{
  const p = path.join(sqlDir, "migration_fix_lessons_org_null_policies.sql");
  assertTrue(fs.existsSync(p), "直しの移行ファイルがある");
  const sql = fs.readFileSync(p, "utf8");
  ["Ops-visible lessons (org-based)", "Teachers can create org lessons",
   "Teachers can update or delete org lessons", "Teachers can delete org lessons"].forEach((n) => {
    assertTrue(sql.includes(`drop policy if exists "${n}"`), `★${n} を作り直している`);
  });
  const code = codeOf(sql);
  assertTrue(/org_id is not null/i.test(code), "★org_id が null の行を、教室のポリシーの対象から外している");
  assertTrue(!/\(\s*org_id\s+is\s+null\s*\)\s*or/i.test(code), "★素通りの形が残っていない");
  // ★紐付けの判定を書き写していないこと（同じ判定が2か所になる）
  assertTrue(!/teacher_student_links/i.test(code.split("create policy")[1] || ""),
    "★紐付けの判定を書き写していない（もとのポリシーに任せる）");
}

console.log("\n=== ★実地で確かめる手順が、ファイルに書いてある ===");
{
  const sql = fs.readFileSync(path.join(sqlDir, "migration_fix_lessons_org_null_policies.sql"), "utf8");
  assertTrue(/service_role では RLS を素通り/.test(sql),
    "★service_role では確かめにならない、と書いてある");
  assertTrue(/自分のものでない行/.test(sql), "★実地の確認クエリが書いてある");
}

console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
process.exit(failCount === 0 ? 0 : 1);
