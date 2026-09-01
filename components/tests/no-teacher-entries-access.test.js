#!/usr/bin/env node
/**
 * 先生が生徒の記録に届く道が、1本も無いこと（2026-09-02）
 *
 * ★確認された事実
 *   +t5（+s1 とつながっている先生）のセッションで
 *     select count(*) from public.entries where user_id <> auth.uid();
 *   が★1 を返しました。生徒の記録が、直接読めていました。
 *
 * ★2026-09-01 に消したのは「入口」だけでした
 *   get_student_entries は、共有範囲に応じて★列を絞って返す関数です。
 *   ですが entries のポリシーは★行そのものを読ませます。
 *   しかも select("*") は全部の列を返すので、
 *   ★「決して渡さない11列」も渡ります。消した関数より広い道でした。
 *
 * ★この検査でできること・できないこと
 *   ・できる：リポジトリの中に、先生向けの道を書いていないこと
 *   ・できない：★本番のポリシーを見ること（DBに触れないため）
 *   だから、本番の確認は supabase/security-snapshot-2026-09-01.md の
 *   手順（★先生のセッションで数える）が本体です。
 *   この検査は「コードとSQLの側から、道を作り直していないか」を見ます。
 */
const fs = require("fs");
const path = require("path");
const { readCode, readRaw } = require("./_source");

let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

const root = path.join(__dirname, "..", "..");
const sqlDir = path.join(root, "supabase");
const sqlFiles = fs.readdirSync(sqlDir).filter((f) => f.endsWith(".sql"));
const codeOf = (t) => t.split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");

console.log("=== ★entries に、先生向けのポリシーを作っていない ===");
{
  const bad = [];
  sqlFiles.forEach((f) => {
    const code = codeOf(fs.readFileSync(path.join(sqlDir, f), "utf8"));
    (code.match(/create policy[\s\S]*?;/gi) || []).forEach((pol) => {
      if (!/on\s+public\.entries/i.test(pol)) return;
      if (/teacher_student_links|assignments/i.test(pol)) {
        bad.push(`${f}: ${(pol.match(/create policy "([^"]+)"/i) || [])[1] || "(名前不明)"}`);
      }
    });
  });
  assertTrue(bad.length === 0,
    bad.length === 0
      ? "★entries に teacher_student_links を見るポリシーを書いていない"
      : `★先生向けのポリシー: ${bad.join(", ")}`);
}

console.log("\n=== 消す移行が、ちゃんと書いてある ===");
{
  const p = path.join(sqlDir, "migration_drop_teacher_entries_policy.sql");
  assertTrue(fs.existsSync(p), "消す移行ファイルがある");
  const sql = fs.readFileSync(p, "utf8");
  assertTrue(/drop policy if exists "Teachers can view active students entries"/.test(sql),
    "★名指しで消している");
  assertTrue(/teacher_student_links|assignments/.test(codeOf(sql)),
    "★名前が違っても、条件で探して消している");
  assertTrue(/prosecdef/.test(sql), "★SECURITY DEFINER の関数も探している");
  assertTrue(/relrowsecurity/.test(sql), "★ポリシーが0本の表も探している");
  assertTrue(/service_role では RLS を素通り/.test(sql),
    "★service_role では確かめにならない、と書いてある");
}

console.log("\n=== ★画面から、他人の記録を読んでいない ===");
{
  const vt = readCode("components", "VocalTracker.jsx");
  // entries を読むのは、すべて自分の行であること
  const reads = (vt.match(/from\("entries"\)[^;]{0,160}/g) || []);
  reads.forEach((r) => {
    if (/select/.test(r)) {
      assertTrue(/eq\("user_id", userId\)/.test(r),
        `★entries の読み取りが自分の行に絞られている（${r.slice(0, 52)}…）`);
    }
  });
  assertTrue(!/fetchStudentEntries|studentEntriesCache/.test(vt),
    "★生徒の記録を取ってくる処理が無い（2026-09-01 に削除）");
  assertTrue(!/get_student_entries/.test(vt), "★消した関数を呼んでいない");
}

console.log("\n=== 共有の廃止が、憲章に書いてある ===");
{
  const charter = readRaw("docs", "lavoce-設計憲章.md");
  assertTrue(/shareScope として一度実装され、2026年9月1日に削除した/.test(charter),
    "★§10 に、消したことが書いてある");
  assertTrue(/記録した日・件数・有無も含む/.test(charter), "★日・件数・有無も渡さない");
}

console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
process.exit(failCount === 0 ? 0 : 1);
