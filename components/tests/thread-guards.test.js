#!/usr/bin/env node
/**
 * スレッド機能を作るとき、先に守らせること（2026-09-02）
 *
 * ★いまスレッド機能はありません。作っていないので、この検査は
 *   ★「作り始めた瞬間」に効きます。
 *
 * ★なぜ先に置くか
 *   G5-35（生徒スレッド）の参加者は「担当の先生＋管理者」だけで、
 *   ★生徒を1人でも入れると、大人と未成年の自由記述の場になります。
 *   これは★あとから足せない性質のものです。
 *   作ってから「生徒を外そう」では、すでに書かれたものが残ります。
 *
 *   添付も同じです。画像を貼れるようにすると、
 *   ★分析画面の切り取りが渡せます。2026-09-01 に
 *   「記録の中身を先生に渡さない」と決めたことが、画像で迂回されます。
 *
 * ★空のテーブルを先に作る、という方法は採りませんでした。
 *   使われていないものは、いつか使われます。今日それを3回直しています
 *   （derivePrimaryActivityLegacy／活動の色の古い判定／AdminDashboard.jsx）。
 *   ★代わりに、作り始めたら落ちる検査を置きます。
 */
const fs = require("fs");
const path = require("path");
const { readRaw } = require("./_source");

let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

const root = path.join(__dirname, "..", "..");
const sqlFiles = fs.readdirSync(path.join(root, "supabase")).filter((f) => f.endsWith(".sql"));
const allSql = sqlFiles.map((f) => fs.readFileSync(path.join(root, "supabase", f), "utf8")).join("\n");

/** スレッドらしい表が作られたか。 */
function threadTables() {
  const hits = [];
  const re = /create table (?:if not exists )?public\.(\w*(?:thread|message|post)\w*)/gi;
  let m;
  while ((m = re.exec(allSql)) !== null) hits.push(m[1]);
  return [...new Set(hits)];
}

console.log("=== ★スレッドは、まだ作っていない ===");
const tables = threadTables();
assertTrue(true, tables.length === 0 ? "スレッドの表は無い" : `スレッドの表: ${tables.join(", ")}`);

if (tables.length === 0) {
  console.log("\n=== 作り始めたときに守ること（いまは対象なし） ===");
  console.log("  ・参加者は担当の先生と管理者だけ。★生徒を1人も入れない");
  console.log("  ・添付の列を作らない（画像・ファイル・URL）");
  console.log("  ・スレッドを作る画面に、開示請求の断り書きを出す");
  assertTrue(true, "★作り始めたら、この検査が中身を見ます");
} else {
  console.log("\n=== ★参加者に生徒が入っていない ===");
  tables.forEach((tbl) => {
    const block = (allSql.match(new RegExp(`create table[^;]*public\\.${tbl}[\\s\\S]*?;`, "i")) || [""])[0];
    assertTrue(!/student_id/.test(block),
      `★${tbl} に student_id が無い（生徒を参加者にしない）`);
  });

  console.log("\n=== ★添付を作っていない ===");
  tables.forEach((tbl) => {
    const block = (allSql.match(new RegExp(`create table[^;]*public\\.${tbl}[\\s\\S]*?;`, "i")) || [""])[0];
    ["attachment", "file_url", "image_url", "media", "file_path"].forEach((col) => {
      assertTrue(!new RegExp(col, "i").test(block), `★${tbl} に ${col} が無い`);
    });
  });

  console.log("\n=== ★開示請求の断り書きが出ている ===");
  const vt = readRaw("components", "VocalTracker.jsx");
  assertTrue(/ご本人から開示を求められた場合/.test(vt),
    "★スレッドを作る画面に、断り書きがある");
}

console.log("\n=== 憲章に、決まりが書いてある ===");
{
  const charter = readRaw("docs", "lavoce-設計憲章.md");
  assertTrue(/生徒についてのスレッドに、生徒を1人も入れない/.test(charter),
    "★参加者の決まりが書いてある");
  assertTrue(/やりとりに、画像やファイルを添付できるようにしない/.test(charter),
    "★添付の禁止が書いてある");
}

console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
process.exit(failCount === 0 ? 0 : 1);
