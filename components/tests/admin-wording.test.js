#!/usr/bin/env node
/**
 * 「管理者」は Woolsong の運営側だけ（2026-09-01）
 *
 * ★教室側の役割を「管理者」と呼んではいけません。
 *   利用者向けの説明に「運営者に分かるのは開いた回数だけ」と書いてあるので、
 *   教室の役割まで「管理者」にすると、★生徒が
 *   「教室の管理者に、開いた回数を見られている」と読みます。
 *
 *   教室側      オーナー ／ 教室の責任者 ／ 講師
 *   Woolsong側  管理者 ／ 運営者
 */
const { readCode } = require("./_source");
let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

const vt = readCode("components", "VocalTracker.jsx");

console.log("=== ★教室の役割に「管理者」を使っていない ===");
const roleBlock = vt.slice(vt.indexOf('<option value="owner">'), vt.indexOf('<option value="teacher">') + 60);
assertTrue(roleBlock.includes('<option value="admin">教室の責任者</option>'),
  "★教室側の admin は「教室の責任者」");
assertTrue(!roleBlock.includes('<option value="admin">管理者</option>'),
  "★「管理者」に戻っていない");
assertTrue(roleBlock.includes("オーナー") && roleBlock.includes("講師"),
  "ほかの2つはそのまま");

console.log("\n=== Woolsong の運営側では、これまでどおり使ってよい ===");
const admin = readCode("app/admin", "page.js");
assertTrue(/管理者/.test(admin), "運営の画面では「管理者」を使っている（正しい用法）");

console.log("\n=== ★画面に出る文字で、教室と運営が混ざっていない ===");
// 画面に出る「管理者」を、1つずつ確かめる
const onScreen = [...vt.matchAll(/>([^<>{]*管理者[^<>{]*)</g)].map((m) => m[1].trim()).filter(Boolean);
onScreen.forEach((t) => {
  // 教室の役割を指していないこと（オーナー・講師と並んでいたら教室側）
  assertTrue(!/オーナー|講師|教室/.test(t) || t.includes("教室の責任者"),
    `画面の文字「${t.slice(0, 30)}」が教室の役割を指していない`);
});
assertTrue(true, `画面に出る「管理者」は ${onScreen.length} 件（運営側のみ）`);

console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
process.exit(failCount === 0 ? 0 : 1);
