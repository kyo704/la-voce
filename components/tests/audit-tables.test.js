#!/usr/bin/env node

// ============================================================================
// ★見張り ── ★消せない 記録（★裁定 その100 CONFIRM_NEEDED・2026-09-19）
//
//   ★★★記録が 書き換えられると、★見張る 意味が なく なります。
//     ★★`monka_read_log`（★裁定 その76）／`org_billing_log`（★その74）
//     ★★`post_change_log`（★役職）／`org_message_reads`（★開いた 記録）
//
//   ★★これは **紙**の 見張り です。★SQL の 字を 読みます。
//     ★★台帳そのものの 確かめは `tools/audit_tables_check.py` です
//       （★2026-09-19 …… ★4つ とも `INSERT` と `SELECT` だけ でした）。
//
//   ★★★較正 ── ★わざと 1件 当たる ものを 作り、★見つかる ことを 確かめます。
// ============================================================================

const assert = require("assert");
const fs = require("fs");
const path = require("path");

let 数 = 0;
function 見る(名, f) { f(); 数 += 1; console.log("  ○ " + 名); }

const ROOT = path.join(__dirname, "..", "..");
const SQL = path.join(ROOT, "supabase");
const 記録の表 = ["monka_read_log", "org_billing_log", "post_change_log",
                "org_message_reads"];

// ★★`supabase/` の SQL を ぜんぶ 読みます。★註は 落とします。
const 全 = fs.readdirSync(SQL).filter((f) => f.endsWith(".sql"))
  .map((f) => fs.readFileSync(path.join(SQL, f), "utf8")
    .split("\n").filter((l) => !/^\s*--/.test(l)).join("\n"))
  .join("\n");
if (!全.trim()) {
  console.log("★★SQL が 1本も ありません。★数えません。★止まります。");
  process.exit(1);
}

見る("道具の 較正", () => {
  const 偽 = "grant update on public.monka_read_log to authenticated;";
  assert.ok(/grant[^;]*update[^;]*monka_read_log/i.test(偽), "★道具が 壊れて います");
});

for (const 表 of 記録の表) {
  見る(`★${表} に 直す・消すを 渡して いない`, () => {
    // ★★`grant … on <表> to …` の 文を 拾い、★その 中身を 見ます。
    const 文 = 全.split(";").filter((x) =>
      /\bgrant\b/i.test(x) && new RegExp("\\b" + 表 + "\\b").test(x));
    for (const x of 文) {
      assert.ok(!/\bupdate\b/i.test(x), `★update を 渡して います: ${表}`);
      assert.ok(!/\bdelete\b/i.test(x), `★delete を 渡して います: ${表}`);
      assert.ok(!/\btruncate\b/i.test(x), `★truncate を 渡して います: ${表}`);
      assert.ok(!/\ball\b/i.test(x), `★all を 渡して います: ${表}`);
    }
  });
}

見る("★書き換えの 決まりを 作って いない", () => {
  for (const 表 of 記録の表) {
    const 文 = 全.split(";").filter((x) =>
      /create policy/i.test(x) && new RegExp("\\b" + 表 + "\\b").test(x));
    for (const x of 文) {
      assert.ok(!/for\s+update/i.test(x), `★直す 決まりが あります: ${表}`);
      assert.ok(!/for\s+delete/i.test(x), `★消す 決まりが あります: ${表}`);
      assert.ok(!/for\s+all/i.test(x), `★何でもの 決まりが あります: ${表}`);
    }
  }
});

見る("★画面から 直す・消すを 呼んで いない", () => {
  const 蔵 = ["components", "lib", "app"].flatMap(function 集(d) {
    const p = path.join(ROOT, d);
    if (!fs.existsSync(p)) return [];
    return fs.readdirSync(p, { withFileTypes: true }).flatMap((e) => {
      if (e.name === "tests" || e.name === "node_modules") return [];
      const q = path.join(p, e.name);
      if (e.isDirectory()) {
        return fs.readdirSync(q, { withFileTypes: true }).flatMap((e2) => {
          const r = path.join(q, e2.name);
          return e2.isFile() && /\.(js|jsx)$/.test(e2.name)
            ? [fs.readFileSync(r, "utf8")] : [];
        });
      }
      return /\.(js|jsx)$/.test(e.name) ? [fs.readFileSync(q, "utf8")] : [];
    });
  }).join("\n");
  for (const 表 of 記録の表) {
    const re = new RegExp('from\\("' + 表 + '"\\)[\\s\\S]{0,120}?\\.(update|delete)\\(');
    assert.ok(!re.test(蔵), `★画面から 書き換えて います: ${表}`);
  }
});

console.log("\n★" + 数 + "つ 通りました。");
