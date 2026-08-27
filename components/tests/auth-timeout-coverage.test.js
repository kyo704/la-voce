#!/usr/bin/env node
/**
 * 認証の確認に、時間制限が付いていない場所が残っていないか。
 *
 * ★前は /dashboard の3か所だけを直しました。同じ形の呼び出しが
 *   ほかに10か所あり、そちらは時間制限なしのまま残っていました。
 *   「調べた場所を直す」のではなく「同じ形を全部直す」ための検査です。
 *
 * ★時間制限が無いと、Supabase が応答しないときに await が返らず、
 *   サーバー描画のページは真っ白のまま止まります。
 */
const fs = require("fs");
const path = require("path");
const { readCode, ROOT } = require("./_source");
let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }
function assertEqual(a, b, label) {
  if (JSON.stringify(a) === JSON.stringify(b)) { console.log(`  ✓ ${label}`); passCount++; }
  else { console.log(`  ✗ ${label}  期待:${JSON.stringify(b)} 実際:${JSON.stringify(a)}`); failCount++; }
}

// app/ と middleware.js を、まとめて調べる
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (/\.(js|jsx)$/.test(e.name)) out.push(full);
  }
  return out;
}
const files = [...walk(path.join(ROOT, "app")), path.join(ROOT, "middleware.js")];

console.log("=== ★裸の getUser() が残っていないこと ===");
const bare = [];
files.forEach((f) => {
  const src = fs.readFileSync(f, "utf-8")
    .replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  // withTimeout / getUserWithTimeout を通していない getUser()
  const lines = src.split("\n");
  lines.forEach((l, i) => {
    if (/auth\.getUser\(\)/.test(l) && !/withTimeout/.test(l)) {
      bare.push(`${path.relative(ROOT, f)}:${i + 1}`);
    }
  });
});
assertEqual(bare, [], `★時間制限なしの getUser() が無い${bare.length ? "（" + bare.join(", ") + "）" : ""}`);

console.log("\n=== 判定は1か所（lib/withTimeout.js）から ===");
const helper = readCode("lib", "withTimeout.js");
assertTrue(/export async function getUserWithTimeout/.test(helper), "共通の関数がある");
assertTrue(/unreachable/.test(helper), "★「確認できなかった」を、別の値として返している");
assertTrue(/export function isConnectivityError/.test(helper), "つながらない判定も1か所");

console.log("\n=== ★つながらないときに、ログイン画面へ飛ばしていない ===");
console.log("     飛ばしても、そのログイン画面も同じ理由で開きません。");
["app/dashboard/page.js", "app/dashboard/layout.js", "app/admin/page.js", "app/billing/page.js"].forEach((rel) => {
  const src = fs.readFileSync(path.join(ROOT, rel), "utf-8");
  // ★見るべきは「unreachable の枝が redirect していないか」です。
  //   次の行にある `if (!user) redirect("/login")` は正しい処理なので、
  //   単に後ろ260文字を見ると、正しいコードを不合格にします（実際にしました）。
  const branch = src.match(/if \(unreachable\)[^\n]*/);
  assertTrue(!!branch, `${rel} が unreachable を見ている`);
  if (branch) {
    assertTrue(!/redirect\(/.test(branch[0]),
      `${rel}: ★つながらない枝で /login へ飛ばしていない`);
    assertTrue(/return/.test(branch[0]),
      `${rel}: つながらない枝で、その場で打ち切っている`);
  }
  // 順序: unreachable の判定が、ログイン判定より前にあること
  const uAt = src.indexOf("if (unreachable)"), rAt = src.indexOf('redirect("/login")');
  if (uAt >= 0 && rAt >= 0) {
    assertTrue(uAt < rAt, `${rel}: ★つながらないかを先に見ている`);
  }
});

console.log("\n=== 公開ページは、つながらなくても表示する ===");
const top = fs.readFileSync(path.join(ROOT, "app", "page.js"), "utf-8");
assertTrue(/getUserWithTimeout/.test(top), "トップページも時間制限を通している");
assertTrue(!/ConnectionError/.test(top), "★トップページは、つながらなくても出す（公開ページなので）");

console.log("\n=== API は 401 ではなく 503 を返す ===");
["feedback", "advice"].forEach((name) => {
  const p = path.join(ROOT, "app", "api", name, "route.js");
  if (!fs.existsSync(p)) return;
  const src = fs.readFileSync(p, "utf-8");
  assertTrue(/unreachable[\s\S]{0,200}503/.test(src),
    `api/${name}: ★つながらないときは 503（401 だと「ログインし直して」と案内され、ログインもできない）`);
});

console.log("\n=== 画面側のクエリも、時間制限を通っている ===");
const ui = readCode("components", "VocalTracker.jsx");
assertTrue(/withTimeout\(Promise\.resolve\(queryFn\(\)\), QUERY_TIMEOUT_MS/.test(ui),
  "★runQueryWithAuthRetry の1回ごとに時間制限がある");
assertTrue(/withTimeout\(supabase\.auth\.refreshSession\(\), AUTH_TIMEOUT_MS/.test(ui),
  "セッションの更新にも時間制限がある");
// 質問票を含む主要な読み込みが、その経路を通っていること
["記録データの取得", "質問票の回答の取得", "周期の記録の取得"].forEach((label) => {
  const at = ui.indexOf(`"${label}"`);
  assertTrue(at > 0, `${label} がある`);
  if (at > 0) {
    const before = ui.slice(Math.max(0, at - 500), at);
    assertTrue(/runQueryWithAuthRetry/.test(before), `★${label} が保護された経路を通っている`);
  }
});

console.log(`\n合計: ${passCount}件成功 / ${failCount}件失敗`);
if (failCount > 0) { console.log("\n⚠ 失敗があります。"); process.exit(1); }
console.log("\n✓ すべて成功しました。");
