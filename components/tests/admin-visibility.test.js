#!/usr/bin/env node
/**
 * 管理画面の見え方（2026-08-30）
 *
 * ★2つの「気づけなかった」を直したものです。
 *
 *   ① 消えたアカウントが 0 件と出ていた。
 *      ★表が無いときも 0 と出るので、壊れていることに気づけませんでした。
 *      error を捨てていたためです。
 *
 *   ② 登録メールを開いていない人が、総ユーザー数に混ざっていました。
 *      ★handle_new_user は auth.users への insert で走ります（確認の前）。
 *        profiles には確認の状態が無いので、管理画面からは見分けられません。
 *        auth.users を読まないと分かりません。
 */
const { readCode, readRaw } = require("./_source");
let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

const admin = readCode("app/admin", "page.js");
const raw = readRaw("app/admin", "page.js");
const schema = readCode("supabase", "schema.sql");

console.log("=== ★① 表が無い 0 と、本当の 0 を見分ける ===");
assertTrue(/const \{ data: deletionRows, error: deletionError \}/.test(admin), "★error を受け取っている");
assertTrue(/deletionTable = deletionError/.test(admin), "状態を3つに分けている");
assertTrue(/deletionTable === "missing"/.test(admin), "表が無いときの分岐がある");
assertTrue(/まだ記録の表がありません/.test(raw), "★表が無いと画面に書く");
assertTrue(/migration_account_deletions_count\.sql を実行してください/.test(raw), "★何をすればよいかも書く");
assertTrue(/まだありません（表はあります）/.test(raw), "★本当に0件のときは、そう書く");
// ★黙って 0 を出す形に戻っていないこと
assertTrue(!/const \{ data: deletionRows \} = await admin/.test(admin), "★error を捨てる書き方が残っていない");

console.log("\n=== ★② 確認済みと未確認を分ける ===");
assertTrue(/admin\.auth\.admin\.listUsers\(/.test(admin), "auth.users を読んでいる");
assertTrue(/email_confirmed_at/.test(admin), "確認の時刻を見ている");
assertTrue(/perPage: 50/.test(admin) && /for \(let page = 1/.test(admin),
  "★ページ送りに対応している（1ページだけ読まない）");
assertTrue(/うち確認済み/.test(raw) && /うち★未確認/.test(raw), "内訳を出している");
// ★分からないときを false にしないこと（居ないのと未確認は違う）
assertTrue(/if \(!u\) return null;/.test(admin), "★auth を読めないときは null（未確認と断定しない）");
assertTrue(/うち不明（auth を読めず）/.test(raw), "★不明も数えて見せる");
// 総ユーザー数そのものは、これまでどおり残す（減らすと過去との比較ができない）
assertTrue(/label: "総ユーザー数", value: totalUsers/.test(admin), "総ユーザー数は残してある");

console.log("\n=== 一覧の印 ===");
assertTrue(/u\.is_tester && <span/.test(admin), "★テスターの印を出す（付与できたか確かめられる）");
assertTrue(/confirmedOf\(u\.id\) === false && \(/.test(admin), "未確認の印を出す");
assertTrue(/is_admin, is_tester,/.test(admin), "is_tester を読んでいる");

console.log("\n=== ★根拠（なぜ profiles だけでは分からないか） ===");
assertTrue(/after insert on auth\.users/.test(schema),
  "★トリガーは insert で走る（確認の前に profiles ができる）");
assertTrue(!/email_confirmed_at/.test(readCode("supabase", "schema.sql")),
  "★profiles に確認の状態は無い");

console.log("\n=== ★消していないこと（今回は表示だけ） ===");
assertTrue(!/deleteUser|from\("profiles"\)\.delete/.test(admin), "★管理画面から消していない");

console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
process.exit(failCount === 0 ? 0 : 1);
