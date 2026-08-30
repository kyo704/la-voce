#!/usr/bin/env node
/**
 * 画面が送る値と、SQL の制約が受け取る値が一致しているか（2026-08-30）
 *
 * ★なぜ要るか
 *   むくみの列で、同じ日に3回目の保存失敗が起きかけました。
 *     1回目 PGRST204  列がまだ無い（移行が未実行）
 *     2回目 23514      制約が受け取る値と、送る値が違う
 *     3回目（未遂）    「日本語の文字列に直す」という修正案。
 *                      画面は整数を送っているので、直すとまた落ちます。
 *
 *   ★往復のテストは「アプリの中で 0 が 0 のまま戻るか」しか見ていません。
 *     データベースが 0 を受け取ってくれるかは、見ていませんでした。
 *     本物の Postgres には繋げないので（このリポジトリに DB はありません）、
 *     ★SQL の制約を「文として読んで」突き合わせます。
 *     これで、今回の食い違いはすべて配布前に落ちます。
 */
const { readRaw, readCode } = require("./_source");
let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }
function eq(a, b, label) { assertTrue(JSON.stringify(a) === JSON.stringify(b), `${label}（${JSON.stringify(a)}）`); }

const vt = readCode("components", "VocalTracker.jsx");
const sql = readRaw("supabase", "migration_morning_edema.sql");

console.log("=== 画面が送る値を、コードから読み取る ===");
// ★ラベルではなく value を読みます。ラベルは表示、value が保存される値です。
const block = vt.slice(vt.indexOf("const EDEMA_CHOICES = ["), vt.indexOf("];", vt.indexOf("const EDEMA_CHOICES = [")));
const uiValues = [...block.matchAll(/value:\s*([0-9]+)/g)].map((m) => Number(m[1]));
eq(uiValues, [0, 1, 2], "画面が送るのは 0 / 1 / 2");
assertTrue(uiValues.length === 3, "3択である");
// ★保存する値に、表示の文字を使っていないこと（lib/storedValues.js の決まり）
assertTrue(!/value:\s*"/.test(block), "★value に文字列を使っていない（表示の文字を保存しない）");

console.log("\n=== SQL の制約が受け取る値を、SQL から読み取る ===");
// コメント行は実行されないので外す
const live = sql.split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
const check = /check\s*\(\s*morning_edema is null or morning_edema in \(([^)]*)\)\s*\)/i.exec(live);
assertTrue(!!check, "制約の書き方を読み取れる");
const sqlValues = check ? check[1].split(",").map((x) => x.trim()) : [];
assertTrue(sqlValues.every((v) => /^[0-9]+$/.test(v)),
  `★制約が数値だけを並べている（${sqlValues.join(", ")}）`);
eq(sqlValues.map(Number), uiValues, "★画面が送る値と、制約が受け取る値が一致する");

console.log("\n=== ★文字列に戻していないこと ===");
// 「なし」「少し」「はっきり」「かなり」などを制約に書かない。
["なし", "少し", "はっきり", "かなり", "none", "some", "much"].forEach((w) => {
  assertTrue(!new RegExp(`'${w}'`).test(live),
    `★制約に '${w}' を書いていない（保存する値は数値）`);
});

console.log("\n=== 列の型も数値であること ===");
assertTrue(/add column if not exists morning_edema smallint/i.test(live),
  "★smallint で作っている（text にしない）");

console.log("\n=== 分析が大小で見るので、数値でなければならない ===");
const fam = readCode("lib", "analysisFamilies.js");
assertTrue(/morningEdema: "binary"/.test(fam),
  "分析は二値として扱う（1以上を『あり』とする＝大小の比較）");

console.log("\n=== null は「答えていない」として、必ず許す ===");
assertTrue(/morning_edema is null or/i.test(live),
  "★制約が null を許している（答えていない日を保存できる）");
assertTrue(!/default\s+0/i.test(live), "★既定値を入れていない（0 と未回答を混ぜない）");

console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
process.exit(failCount === 0 ? 0 : 1);
