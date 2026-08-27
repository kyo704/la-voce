#!/usr/bin/env node
/**
 * アカウントの削除（統合実行ルートv4 G3-17 / 改善タスクv2 P0-3）のテスト。
 *
 * 【守っていること】
 *  1. 受け入れ条件「同一メールで再登録しても旧データが復活しない」
 *     → auth のユーザーを消すだけでは足りない。cascade が付いているのは
 *       profiles / subscriptions / entries だけなので、他は明示的に消す
 *  2. 途中で失敗したら auth のユーザーを消さない
 *     → 消すと、残った行に手が届かなくなる
 *  3. 確認の入力を、画面だけでなくサーバー側でも突き合わせる
 *     → 画面だけの確認は、リクエストを直接投げれば素通りする
 *  4. 3ページそれぞれが「情報提示」として意味を持つ
 *     → 無意味なページを挟むだけの引き止めは、削除権の行使を不当に妨げうる
 */
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..", "..");
let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

const api = fs.readFileSync(path.join(ROOT, "app", "api", "account", "delete", "route.js"), "utf-8");
// 削除の中身は lib/accountDeletion.js に共通化してある（cron と共用するため）。
const purge = fs.readFileSync(path.join(ROOT, "lib", "accountDeletion.js"), "utf-8");
const tracker = fs.readFileSync(path.join(ROOT, "components", "VocalTracker.jsx"), "utf-8");
const exportSrc = fs.readFileSync(path.join(ROOT, "lib", "exportData.js"), "utf-8");

console.log("=== テスト1: 消し残しが出ないこと ===");
assertTrue(/createAdminClient/.test(api), "サービスロールで消している（RLS では自分の行しか消せないテーブルがある）");
// 書き出しの対象になっているテーブルは、削除の対象にもなっていなければ辻褄が合わない。
const exported = [...exportSrc.matchAll(/table:\s*"(\w+)"/g)].map((m) => m[1]);
assertTrue(exported.length >= 8, `書き出し対象を ${exported.length} 件検出`);
exported.forEach((tb) => assertTrue(purge.includes(`"${tb}"`), `「${tb}」が削除の対象に入っている`));
["profiles", "teacher_student_links", "teacher_invitations"].forEach((tb) =>
  assertTrue(purge.includes(tb), `「${tb}」も削除の対象に入っている`));
assertTrue(/deleteUser/.test(purge), "最後に認証ユーザーを削除している");

console.log("\n=== テスト2: 失敗したら認証ユーザーを消さない ===");
const failIdx = purge.indexOf("failures.length > 0");
const delIdx = purge.indexOf("auth.admin.deleteUser");
assertTrue(failIdx > 0 && delIdx > failIdx, "失敗の判定が、認証ユーザーの削除より前にある");
assertTrue(/failures\.length > 0\) return \{ ok: false/.test(purge), "失敗があれば、そこで打ち切って報告している");
assertTrue(/does not exist|schema cache/.test(purge), "存在しないテーブルは失敗に数えない（環境差で止まらない）");

console.log("\n=== テスト3: 確認の入力をサーバー側でも見ている ===");
assertTrue(/body\.confirmation/.test(api), "リクエストの確認文字列を読んでいる");
assertTrue(/user\.email/.test(api) && /削除します/.test(api), "メールアドレスまたは定型句と突き合わせている");
assertTrue(/status: 400/.test(api), "一致しなければ 400 で拒否している");
assertTrue(/getUser\(\)/.test(api) && /status: 401/.test(api), "ログインしていなければ 401");

console.log("\n=== テスト4: 3ページそれぞれに中身がある ===");
["deleteAccount1", "deleteAccount2", "deleteAccount3"].forEach((k) =>
  assertTrue(tracker.includes(`activeTab === "${k}"`), `${k} のページがある`));
assertTrue(/recordedDaysTotal/.test(tracker.slice(tracker.indexOf('deleteAccount1"'), tracker.indexOf('deleteAccount2"'))),
  "1ページ目に、実際の記録日数を出している");
assertTrue(/questionnaireResponses\.length/.test(tracker.slice(tracker.indexOf('deleteAccount1"'), tracker.indexOf('deleteAccount2"'))),
  "1ページ目に、実際の質問票の件数を出している");
assertTrue(/handleExportData/.test(tracker.slice(tracker.indexOf('deleteAccount1"'), tracker.indexOf('deleteAccount2"'))),
  "1ページ目から、先に書き出せる");
const p2 = tracker.slice(tracker.indexOf('deleteAccount2"'), tracker.indexOf('deleteAccount3"'));
assertTrue(/myStudentLinks/.test(p2) && /myTeacherLinks/.test(p2), "2ページ目で、指導者側・生徒側の両方の影響を出し分けている");
assertTrue(/deleteStep2Reregister/.test(p2), "2ページ目で、再登録しても戻らないことを明示している");

console.log("\n=== テスト5: 入力が一致するまで削除ボタンを押せない ===");
const p3 = tracker.slice(tracker.indexOf('deleteAccount3"'));
assertTrue(/disabled=\{deleteStatus === "working" \|\| !deleteConfirmOk\}/.test(p3), "確認の入力が一致するまで無効");
assertTrue(/deleteStatus === "error"/.test(p3), "失敗を画面に出している");

console.log("\n=== テスト6: 30日の猶予期間（A-4） ===");
const shared = fs.readFileSync(path.join(ROOT, "lib", "accountDeletion.js"), "utf-8");
const cron = fs.readFileSync(path.join(ROOT, "app", "api", "cron", "purge-deleted", "route.js"), "utf-8");
const restore = fs.readFileSync(path.join(ROOT, "app", "api", "account", "restore", "route.js"), "utf-8");
const vercel = JSON.parse(fs.readFileSync(path.join(ROOT, "vercel.json"), "utf-8"));

assertTrue(/GRACE_PERIOD_DAYS = 30/.test(shared), "猶予は30日");
assertTrue(/mode === "now"/.test(api), "「今すぐ完全に削除する」も選べる");
assertTrue(/deleted_at/.test(api), "猶予のときは deleted_at を立てるだけ（データは消さない）");
// ★共有は待たずに切る（A-4「教室の側から見えなくなるのは即時。30日待たない」）
const graceBlock = api.slice(api.indexOf("猶予期間に入れる"));
assertTrue(/severConnections/.test(graceBlock), "猶予に入れる時点で、共有を即座に切っている");
assertTrue(graceBlock.indexOf("severConnections") < graceBlock.indexOf("deleted_at"), "共有の解除が、削除申請の記録より先");
assertTrue(/USER_OWNED_TABLES\s*=/.test(shared) && !/USER_OWNED_TABLES\s*=/.test(api),
  "削除するテーブルの一覧が1箇所にある（cronと本体で二重管理していない）");

assertTrue(/CRON_SECRET/.test(cron), "定期処理は CRON_SECRET で保護されている");
assertTrue(/purgeAccount/.test(cron), "定期処理は共通の削除処理を使っている");
assertTrue(/\.limit\(/.test(cron), "一度に処理する件数を制限している");
assertTrue(/results\.failed/.test(cron), "1件失敗しても他を止めない");
assertTrue(vercel.crons.some((c) => c.path === "/api/cron/purge-deleted"), "vercel.json に定期処理が登録されている");

assertTrue(/graceDaysLeft/.test(restore), "復元は猶予内かどうかを確認している");
assertTrue(/status: 410/.test(restore), "猶予を過ぎていたら復元させない");
assertTrue(/restoreConnectionsNote/.test(tracker), "復元しても共有は戻らないことを画面で伝えている");
assertTrue(/profile\.deleted_at/.test(tracker), "削除申請中はアプリを開かせず、復元を尋ねている");
assertTrue(/バックアップ/.test(shared), "バックアップから復元したときの手順がコメントに残っている（A-4）");

console.log(`\n合計: ${passCount}件成功 / ${failCount}件失敗`);
if (failCount > 0) { console.log("\n⚠ 失敗があります。"); process.exit(1); }
console.log("\n✓ すべて成功しました。");
