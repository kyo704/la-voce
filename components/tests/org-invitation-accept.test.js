#!/usr/bin/env node
/**
 * 教室への招待（2026-09-02）
 *
 * ★これまで一度も成功していませんでした。
 *   画面から自分の memberships を自分で入れていたためです。招待された人は
 *   まだその教室の誰でもなく、INSERT ポリシーはどれも当てはまりません。
 *   しかも画面には「もう一度お試しください」と出ていました。
 *   ★何度やっても通らないものに、再試行をすすめていました。
 *
 * ★守ること
 *   ① 画面から memberships / org_invitations を直接書かない
 *   ② コードを先に押さえてから membership を作る（二重参加を防ぐ）
 *   ③ membership に失敗したら、押さえたコードを戻す（コードを殺さない）
 *   ④ 既に入っている人に「失敗しました」と言わない
 *   ⑤ RLS をゆるめて解決しない
 */
const { readCode } = require("./_source");

let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

const accept = readCode("app", "api", "org", "invitation", "accept", "route.js");
const lookup = readCode("app", "api", "org", "invitation", "lookup", "route.js");
const tracker = readCode("components", "VocalTracker.jsx");

console.log("=== ★画面から直接書かない ===");
{
  // 招待を受ける処理のあたりに、memberships への insert が残っていないこと
  assertTrue(!/from\("memberships"\)\s*\.insert\(\{\s*org_id:\s*pendingOrgInvitation/.test(tracker),
    "★画面から memberships を insert していない");
  // ★発行（handleGenerateOrgInvite）は残してよい。あれは教室のオーナーの操作で、
  //   自分の教室の行を作るだけなので、ポリシーに当たります。
  //   ★通らないのは「招待された側が、その行を読む・更新する」ほうです。
  assertTrue(!/from\("org_invitations"\)[\s\S]{0,80}?\.select\(/.test(tracker),
    "★画面から org_invitations を読んでいない（招待された人には0行が返るため）");
  assertTrue(!/from\("org_invitations"\)[\s\S]{0,80}?\.update\(/.test(tracker),
    "★画面から org_invitations を使用済みにしていない");
  assertTrue(/\/api\/org\/invitation\/accept/.test(tracker), "参加はサーバ側のルートを呼ぶ");
  assertTrue(/\/api\/org\/invitation\/lookup/.test(tracker), "コードの確認もサーバ側のルートを呼ぶ");
}

console.log("\n=== ★「もう一度お試しください」と言わない ===");
{
  assertTrue(!/参加に失敗しました。もう一度お試しください/.test(tracker),
    "★通らないものに再試行をすすめていない");
  assertTrue(/data\.error/.test(tracker), "サーバが返した理由を、そのまま出す");
}

console.log("\n=== ★サーバ側：権限の根拠と順番 ===");
{
  assertTrue(/createAdminClient/.test(accept), "管理者クライアントを使う（RLS をゆるめない）");
  assertTrue(/getUserWithTimeout/.test(accept), "呼び出した人を、先に確かめる");
  assertTrue(/status: 401/.test(accept), "ログインしていなければ 401");

  const claimAt = accept.indexOf('.is("used_at", null)');
  const insertAt = accept.indexOf('from("memberships")\n    .insert');
  assertTrue(claimAt > -1, "★コードを押さえる（used_at が null の行だけ更新）");
  assertTrue(insertAt > -1, "membership を作る");
  assertTrue(claimAt < insertAt, "★押さえるのが先、membership を作るのがあと");
}

console.log("\n=== ★失敗したら、コードを戻す ===");
{
  assertTrue(/used_at: null, used_by: null/.test(accept),
    "★membership に失敗したら、押さえたコードを戻す");
  assertTrue(/招待を戻せませんでした/.test(accept), "戻せなかったことも、黙って捨てない");
}

console.log("\n=== ★既に入っている人を、失敗にしない ===");
{
  assertTrue(/alreadyMember/.test(accept), "既に入っているかを見ている");
  assertTrue(/alreadyMember: true/.test(accept), "★入っているなら ok を返す");
}

console.log("\n=== ★期限と使用済み ===");
{
  assertTrue(/expires_at/.test(accept) && /期限切れ/.test(accept), "期限切れを弾く");
  assertTrue(/使用済み/.test(accept), "使用済みを弾く");
  assertTrue(/使用済み/.test(lookup), "確認のほうでも、使用済みを伝える");
}

console.log("\n=== ★列名を決め打ちしない ===");
{
  // 知らない列があると PostgREST は要求全体を弾く（PGRST204）
  assertTrue(/from\("org_invitations"\)\s*\n?\s*\.select\("\*"\)/.test(accept),
    "★org_invitations は select(\"*\")（列名を決め打ちしない）");
}

console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
process.exit(failCount === 0 ? 0 : 1);
