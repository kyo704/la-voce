#!/usr/bin/env node
/**
 * バックアップの一覧が、コードから離れていないか（A-P0-1）
 *
 * ★なぜ要るか
 *   バックアップの検査は「一覧に載っているテーブル」だけを見ます。
 *   新しいテーブルを足したときに一覧へ足し忘れると、
 *   ★そのテーブルが入っていなくても「問題ありません」と出ます。
 *   lib/shareScope.js の FORBIDDEN_KEYS が、まさにその穴でした
 *   （11列のうち10列が抜けていて、検査が何も見ていませんでした）。
 *
 * ★このテストは、アプリが .from("…") で触るテーブルを機械的に洗い出し、
 *   lib/backupTables.js の一覧と突き合わせます。
 */
const fs = require("fs");
const path = require("path");
const { readCode, readRaw } = require("./_source");
let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }
function assertEqual(a, b, label) { assertTrue(JSON.stringify(a) === JSON.stringify(b), `${label}（${JSON.stringify(a)}）`); }

const ROOT = path.join(__dirname, "..", "..");

/** app/ lib/ components/ を歩いて、.from("…") のテーブル名を集める。 */
function tablesUsedInCode() {
  const found = new Set();
  const walk = (dir) => {
    fs.readdirSync(dir, { withFileTypes: true }).forEach((d) => {
      const p = path.join(dir, d.name);
      if (d.isDirectory()) {
        if (d.name === "node_modules" || d.name === "tests" || d.name === ".next") return;
        walk(p);
      } else if (/\.(js|jsx)$/.test(d.name)) {
        const src = fs.readFileSync(p, "utf8");
        const re = /\.from\("([a-z_]+)"\)/g;
        let m;
        while ((m = re.exec(src)) !== null) found.add(m[1]);
      }
    });
  };
  ["app", "lib", "components"].forEach((d) => walk(path.join(ROOT, d)));
  return [...found].sort();
}

(async () => {
  const spec = await import("../../lib/backupTables.js");
  const listed = spec.backupTableNames().sort();

  console.log("=== ★コードで触るテーブルが、全部バックアップの一覧にある ===");
  const used = tablesUsedInCode();
  const missing = used.filter((t) => !listed.includes(t));
  assertEqual(missing, [],
    "★一覧に載っていないテーブルが無い（あれば lib/backupTables.js に足してください）");

  console.log("\n=== ほかの一覧との重なり（★意図的に一致しません） ===");
  const exp = await import("../../lib/exportData.js");
  const del = await import("../../lib/accountDeletion.js");
  exp.EXPORTED_TABLES.forEach(({ table }) => {
    assertTrue(listed.includes(table), `書き出しの ${table} は、バックアップにも入る`);
  });
  del.USER_OWNED_TABLES.forEach((table) => {
    assertTrue(listed.includes(table), `削除の対象 ${table} は、バックアップにも入る`);
  });
  // ★逆は成り立ちません。role_master のような共通データは、
  //   本人の書き出しにも削除にも出てこないが、バックアップには要ります。
  assertTrue(listed.length > exp.EXPORTED_TABLES.length,
    "★バックアップのほうが広い（本人のものだけではないため）");

  console.log("\n=== ★auth を落としていない ===");
  assertTrue(spec.BACKUP_SCHEMAS.includes("auth"),
    "★auth schema がダンプの対象に入っている");
  assertTrue(spec.BACKUP_AUTH_TABLES.some((t) => t.table === "users" && t.critical),
    "★auth.users は、空なら異常");
  const dump = readRaw("scripts", "backup-dump.sh");
  // ★コメントの中の「--schema=auth を外さないこと」に当たってはいけません。
  //   実際に pg_dump を呼んでいるところだけを見ます。
  //   （これは実際に落とし穴でした。行を消しても検査が通っていました。）
  const cmdStart = dump.indexOf('"$PGBIN/pg_dump" \\');
  const cmdEnd = dump.indexOf('BACKUP_DATABASE_URL"', cmdStart);
  const cmd = cmdStart > 0 ? dump.slice(cmdStart, cmdEnd) : "";
  assertTrue(cmd.length > 0, "pg_dump を呼んでいるところが見つかる");
  assertTrue(/--schema=auth/.test(cmd), "★取得スクリプトが auth を取っている（コメントではなく実行行）");
  assertTrue(/--schema=public/.test(cmd), "public も取っている");
  assertTrue(/--no-owner/.test(cmd), "所有者を持ち込まない（手元に同じ役割が無いため）");

  console.log("\n=== ★事業の根幹は、空なら異常 ===");
  assertEqual(spec.criticalTableNames(), ["profiles", "entries"],
    "profiles と entries は空を許さない");

  console.log("\n=== 減りすぎの判定 ===");
  assertEqual(spec.shrinkFailures({ entries: 100 }, { entries: 100 }), [], "同じなら異常なし");
  assertEqual(spec.shrinkFailures({ entries: 100 }, { entries: 95 }), [], "5%減は正常（退会はある）");
  assertTrue(spec.shrinkFailures({ entries: 100 }, { entries: 70 }).length === 1, "★30%減は異常");
  assertTrue(spec.shrinkFailures({ entries: 100 }, { entries: 0 }).length === 1, "★全部消えたら異常");
  assertEqual(spec.shrinkFailures({ events: 0 }, { events: 0 }), [], "元から0なら異常ではない");
  assertTrue(spec.shrinkFailures({ entries: 100 }, {}).length === 1, "★テーブルごと無ければ異常");

  console.log("\n=== ★検査は「読めなかった」を0行と言わない ===");
  const verify = readCode("scripts", "backup-verify.js");
  assertTrue(/sawCopy && !sawInsert|!sawCopy && !sawInsert/.test(verify),
    "★形が分からないときの分岐がある");
  assertTrue(/process\.exit\(1\)/.test(verify), "★異常のときは 1 で終わる");
  // 異常のときに baseline を書き換えていないこと（★壊れた値を基準にしない）
  // ★窓は「異常の分岐の中」だけに限る。広げると、その先にある
  //   正常時の書き込みを拾って落ちます（過去に3回踏んだ罠）。
  const failStart = verify.indexOf("if (problems.length > 0)");
  const failEnd = verify.indexOf("process.exit(1);", failStart);
  const failBlock = verify.slice(failStart, failEnd);
  assertTrue(failStart > 0 && failEnd > failStart, "異常の分岐が見つかる");
  assertTrue(!/writeFileSync\(BASELINE/.test(failBlock),
    "★異常のときに backup-baseline.json を更新していない");
  // 書き込みは、異常の分岐を抜けたあとにだけある
  assertTrue(verify.indexOf("writeFileSync(BASELINE") > failEnd,
    "★baseline の更新は、異常終了より後にしか無い");

  console.log("\n=== ★認証情報を持たない ===");
  assertTrue(!/postgresql:\/\/|SUPABASE_SERVICE_ROLE|password/i.test(verify),
    "★検査スクリプトは接続情報を一切持たない");
  assertTrue(/\.env\.backup\.local/.test(dump), "接続先は .env.backup.local から読む");
  // ★postgresql:// が出てくるのは、使い方を説明する例示だけであること。
  //   例示には必ず「パスワード」という語が入っています。
  const urls = dump.match(/postgresql:\/\/[^\s"']*/g) || [];
  assertTrue(urls.every((u) => /パスワード|xxxx/.test(u)),
    `★取得スクリプトに本物の接続文字列が書かれていない（見つかった例示: ${urls.length}件）`);
  assertTrue(!/BACKUP_DATABASE_URL="postgresql:\/\/postgres:(?!パスワード)/.test(dump),
    "★接続文字列を代入している行が無い");
  const ignore = readRaw("", ".gitignore");
  assertTrue(/backups\//.test(ignore), "★ダンプの置き場が .gitignore に入っている");
  assertTrue(/\.env\*\.local/.test(ignore), "★接続情報のファイルが .gitignore に入っている");

  console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
  process.exit(failCount === 0 ? 0 : 1);
})();
