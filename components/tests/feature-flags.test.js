#!/usr/bin/env node
/**
 * 機能フラグ（統合実行ルートv4 G2-14「指導者・教室機能を機能フラグでオフ」）のテスト。
 *
 * ★「捨てる」ではなく「順番の問題」。G3.5 で戻す前提の一時的な非表示。
 * ★既につながっている人からは取り上げないこと。共有を解除する手段まで
 *   消えてしまい、かえって不利益になる。
 */
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..", "..");
let passCount = 0, failCount = 0;
function assertEqual(a, b, label) {
  if (JSON.stringify(a) === JSON.stringify(b)) { console.log(`  ✓ ${label}`); passCount++; }
  else { console.log(`  ✗ ${label}  期待:${JSON.stringify(b)} 実際:${JSON.stringify(a)}`); failCount++; }
}
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

async function main() {
  const src = fs.readFileSync(path.join(ROOT, "lib", "featureFlags.js"), "utf-8");
  const m = await import("data:text/javascript;base64," + Buffer.from(src, "utf-8").toString("base64"));
  const { canSeeBetaFeatures, canSeeTeacherFeatures, canSeeLineLink } = m;
  const tracker = fs.readFileSync(path.join(ROOT, "components", "VocalTracker.jsx"), "utf-8");

  console.log("=== テスト1: 一般ユーザーには出さない ===");
  const plain = { is_admin: false, teacher_beta_access: false };
  assertEqual(canSeeBetaFeatures(plain), false, "一般ユーザーはベータ機能を見られない");
  assertEqual(canSeeTeacherFeatures(plain), false, "一般ユーザーは指導者機能を見られない");
  assertEqual(canSeeLineLink(plain), false, "一般ユーザーはLINE連携を見られない");
  assertEqual(canSeeBetaFeatures(null), false, "プロフィール未読み込みでも出さない（読み込み中に一瞬見えない）");
  assertEqual(canSeeBetaFeatures({}), false, "フラグが無ければ出さない（fail closed）");

  console.log("\n=== テスト2: 管理者・ベータには出す ===");
  assertEqual(canSeeBetaFeatures({ is_admin: true }), true, "管理者には出す");
  assertEqual(canSeeBetaFeatures({ teacher_beta_access: true }), true, "指導者ベータには出す");
  assertEqual(canSeeTeacherFeatures({ is_admin: true }), true, "管理者は生徒0人でも指導者機能に到達できる");

  console.log("\n=== テスト3: 既につながっている人からは取り上げない ===");
  assertEqual(canSeeTeacherFeatures(plain, { hasStudentLinks: true }), true, "生徒がいる先生には出し続ける");
  assertEqual(canSeeTeacherFeatures(plain, { hasTeacherLinks: true }), true, "先生とつながっている生徒には出し続ける");

  console.log("\n=== テスト4: 画面側が、判定を1箇所からしか受け取っていない ===");
  assertTrue(tracker.includes("canSeeTeacherFeatures"), "指導者機能が機能フラグを参照している");
  assertTrue(tracker.includes("canSeeLineLink"), "LINE連携が機能フラグを参照している");
  // 画面に is_admin を直接書いた判定が増えていないか（タブの計算式に残る分だけ許容）
  const direct = (tracker.match(/profile\.is_admin/g) || []).length;
  assertTrue(direct <= 3, `is_admin の直接参照が増えすぎていない（${direct}件）`);

  console.log(`\n合計: ${passCount}件成功 / ${failCount}件失敗`);
  if (failCount > 0) { console.log("\n⚠ 失敗があります。"); process.exit(1); }
  console.log("\n✓ すべて成功しました。");
}
main().catch((e) => { console.error(e); process.exit(1); });
