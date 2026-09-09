#!/usr/bin/env node
// ============================================================================
// notes の表が、★2つの台帳に 入っているか（2026-09-09）
//
//   ★★なぜ 画面より 先に 入れるのか
//     ★表は もう 作ってあります（★supabase/2026-09-09-ノートの表.sql・実行済み）。
//     ★画面（★見本⑥）は、★教室機能の あとに 作ります。
//     ★★そのあいだ、★台帳に 入っていないと、
//       ★★書き出し　… ★書いたものが 出てきません
//       ★★退会　　　… ★消したはずの 行が 残ります
//     ★★いま 誰も 書いていないので、★被害は ありません。
//       ★書ける ように なってから 足すと、★その隙に 書いた方の 分が こぼれます。
//
//   ★★この見張りは、★表が ある かぎり 台帳に あることを 固定します。
// ============================================================================

const fs = require("fs");
const path = require("path");
const os = require("os");
const { readRaw } = require("./_source");

let ok = 0, ng = 0;
function t(cond, label) {
  if (cond) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label); ng++; }
}

(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "led-"));
  // ★連れの帳面も 一緒に 写します（★本物を 読みます。★偽物を 置きません）。
  ["exportData", "accountDeletion", "orgClosure", "supabaseErrors"].forEach((n) => {
    const src = fs.readFileSync(path.join(__dirname, "..", "..", "lib", n + ".js"), "utf8")
      .replace(/@\/lib\/([a-zA-Z]+)/g, "./$1.js");
    fs.writeFileSync(path.join(dir, n + ".js"), src);
  });
  const ex = await import("file://" + path.join(dir, "exportData.js"));
  const del = await import("file://" + path.join(dir, "accountDeletion.js"));

  console.log("=== 表が ある ===");
  const sqlPath = path.join(__dirname, "..", "..", "supabase", "2026-09-09-ノートの表.sql");
  t(fs.existsSync(sqlPath), "★ノートの表を 作る SQL が ある");
  const sql = fs.readFileSync(sqlPath, "utf8");
  t(/create table if not exists public\.notes/.test(sql), "★public.notes を 作っている");
  t(/user_id uuid not null references auth\.users/.test(sql), "★user_id を 持っている");

  console.log("\n=== ① 書き出しに 入っている ===");
  const tables = (ex.EXPORTED_TABLES || []).map((x) => x.table || x);
  t(tables.includes("notes"), `★notes が 書き出しの 台帳に ある（${tables.length}表）`);
  t(tables.includes("article_notes"), "★article_notes とは 別の 表として ある");

  console.log("\n=== ② 退会の 消し込みに 入っている ===");
  t(del.USER_OWNED_TABLES.includes("notes"),
    `★notes が 退会の 台帳に ある（${del.USER_OWNED_TABLES.length}表）`);
  t(del.USER_OWNED_TABLES.includes("article_notes"), "★article_notes も 別に ある");
  // ★★同じ表を 2回 書いていないこと
  t(del.USER_OWNED_TABLES.length === new Set(del.USER_OWNED_TABLES).size,
    "★同じ表が 2回 並んでいない");

  console.log("\n=== ③ 2つの台帳は、わざと ちがう ===");
  // ★★shareScope／exportData／accountDeletion は、★わざと ちがいます。
  //   ★「先生に 見せない」と「ご本人も 取り出せない」は、★別のことです。
  const raw = readRaw("lib", "accountDeletion.js");
  t(/deleted_at で 隠した行も、★退会のときは 消します/.test(raw),
    "★画面で 隠すことと、退会で 消すことを、分けて 書いてある");

  console.log(ng === 0 ? `\n✅ 全て通りました  成功:${ok} 失敗:0` : `\n❌ 失敗あり  成功:${ok} 失敗:${ng}`);
  process.exit(ng > 0 ? 1 : 0);
})();
