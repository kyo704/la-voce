#!/usr/bin/env node
/**
 * 在籍づくりが、他人の行を読むことに依存していないか（2026-09-01）
 *
 * ★何があったか
 *   招待を受けた生徒の画面から、★先生の memberships を読んでいました。
 *     supabase.from("memberships").select("org_id")
 *       .eq("user_id", 先生).eq("role", "owner").maybeSingle()
 *   memberships_select は「本人か、教室のオーナー・管理者」だけなので、
 *   生徒には0行が返ります。★エラーではなく、ただの0行です。
 *   そのため enrollments の upsert は一度も実行されず、
 *   ★enrollments は本番で全体0行のままでした（この日に確認）。
 *   生徒の教室一覧・先生の名簿・担当・レッスンが、すべて空でした。
 *
 * ★この検査が守ること
 *   ① 画面から enrollments / assignments を書かない
 *   ② 画面から、他人の memberships を読まない
 *   ③ サーバ側の道がある
 *   ④ 権限の根拠は「いま有効な紐付け」であって、招待の未使用ではない
 *   ⑤ RLS をゆるめる方向で直していない
 */
const fs = require("fs");
const path = require("path");
const { readCode, readRaw } = require("./_source");

let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

const root = path.join(__dirname, "..", "..");
const vt = readCode("components", "VocalTracker.jsx");
const routePath = path.join(root, "app/api/enrollment/accept/route.js");

console.log("=== ★サーバ側の道がある ===");
assertTrue(fs.existsSync(routePath), "app/api/enrollment/accept/route.js がある");
const route = readCode("app/api/enrollment/accept", "route.js");
const routeRaw = readRaw("app/api/enrollment/accept", "route.js");

console.log("\n=== ★画面から、在籍と担当を書かない ===");
{
  // ★ここが要点です。生徒の権限では、そもそも書けません。
  assertTrue(!/from\("enrollments"\)[\s\S]{0,60}\.(insert|upsert)\(/.test(vt),
    "★画面から enrollments を作っていない");
  assertTrue(!/from\("assignments"\)[\s\S]{0,60}\.insert\(\{ org_id: ownerMembership/.test(vt),
    "★画面から、招待受け取り時に assignments を作っていない");
  // 招待を受ける処理が、サーバ側を呼んでいること
  const at = vt.indexOf("async function handleAcceptInvitation");
  assertTrue(at > 0, "招待を受ける処理がある");
  const body = vt.slice(at, at + 3000);
  assertTrue(/api\/enrollment\/accept/.test(body), "★サーバ側の道を呼んでいる");
}

console.log("\n=== ★画面から、他人の memberships を読まない ===");
{
  // ★これが不具合の正体でした。0行が返るだけで、誰も気づけません。
  assertTrue(!/from\("memberships"\)[\s\S]{0,120}\.eq\("user_id", pendingInvitation\.teacher_id\)/.test(vt),
    "★先生の memberships を、生徒の画面から読んでいない");
  assertTrue(!/ownerMembership/.test(vt),
    "★ownerMembership が残っていない（読めない前提の変数）");
}

console.log("\n=== ★権限の根拠は「いま有効な紐付け」 ===");
{
  assertTrue(/teacher_student_links/.test(route), "紐付けを見ている");
  assertTrue(/\.eq\("status", "active"\)/.test(route), "★有効なものだけ");
  assertTrue(/\.eq\("student_id", user\.id\)/.test(route), "★呼んだ本人であること");
  assertTrue(/status: 403/.test(route), "紐付けが無ければ 403");
  // ★招待の未使用を根拠にしないこと。呼ばれる時点で使用済みだからです。
  assertTrue(!/used_at/.test(route),
    "★招待の未使用を権限の根拠にしていない（この時点では使用済み）");
  // ★存在を探る道具にしないこと
  assertTrue(!/招待が使われています|コードが違います/.test(route),
    "★「招待が違う」と「つながっていない」を分けていない");
}

console.log("\n=== ★管理者クライアントで書く（RLS をゆるめない） ===");
{
  assertTrue(/createAdminClient/.test(route), "管理者クライアントを使う");
  assertTrue(/getUserWithTimeout/.test(route), "先に本人を確かめる");
  const iAuth = route.indexOf("if (!user)");
  const iAdmin = route.indexOf("createAdminClient()");
  assertTrue(iAuth > 0 && iAuth < iAdmin,
    "★ログインの確認が、管理者クライアントより先");
  // RLS をゆるめる移行を作っていないこと
  const files = fs.readdirSync(path.join(root, "supabase"));
  const loosened = files.filter((f) => {
    if (!f.endsWith(".sql")) return false;
    const sql = fs.readFileSync(path.join(root, "supabase", f), "utf8");
    return /create policy[\s\S]{0,200}enrollments[\s\S]{0,200}for insert/i.test(sql);
  });
  assertTrue(loosened.length === 0,
    `★enrollments に INSERT ポリシーを足していない${loosened.length ? "（" + loosened.join(",") + "）" : ""}`);
}

console.log("\n=== ★招待が、どの教室かを持っている ===");
{
  assertTrue(/org_id: orgId/.test(vt), "★発行時に教室のIDを入れる");
  const sql = readRaw("supabase", "migration_invitation_org_id.sql");
  assertTrue(/add column if not exists org_id/.test(sql), "移行が列を足す");
  assertTrue(!/update public\.teacher_invitations\s+set org_id/i.test(sql),
    "★既存の招待を埋め戻していない（推測で埋めない）");
  // 古い招待でも動くこと
  assertTrue(/invitation\.org_id \|\| null/.test(route), "新しい招待は org_id を使う");
  assertTrue(/role", "owner"/.test(route), "★古い招待は、先生の教室から解決する");
}

console.log("\n=== ★失敗しても、つながり自体は壊さない ===");
{
  // 在籍が作れなくても、紐付けは成立しています。巻き戻さないこと。
  assertTrue(/enrolled: false/.test(route), "教室が無いときは、失敗にしない");
  assertTrue(/assigned: false/.test(route), "担当が作れなくても、在籍は残す");
  const at = vt.indexOf("api/enrollment/accept");
  const around = vt.slice(at - 600, at + 900);
  assertTrue(/console\.error/.test(around),
    "★黙って捨てない（捨てていたことが、今回の不具合の正体）");
  assertTrue(!/return;\s*\}\s*$/.test(around.slice(around.indexOf("!res.ok"), around.indexOf("!res.ok") + 220)),
    "★在籍に失敗しても、招待の受け取りを中断しない");
}

console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
process.exit(failCount === 0 ? 0 : 1);
