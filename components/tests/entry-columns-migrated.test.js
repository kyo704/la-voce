#!/usr/bin/env node
/**
 * entryToRow が書く列に、SQL が用意されているか（2026-08-30）
 *
 * ★なぜ要るか
 *   同じ日に2回、本番の保存が全部止まりました（type_fields / morning_edema）。
 *   どちらも「列を使うコードが先に出て、SQL がまだ実行されていない」形です。
 *
 * ★このテストが catch できること／できないこと
 *   できる   … SQL を★書き忘れた（migration ファイルが無い）
 *   できない … SQL は書いたが、坂本さんが★まだ実行していない
 *
 *   後者は、コードの側からは分かりません。分かるのは本番だけです。
 *   だから lib/entryWriteFallback.js で「落ちない」ようにしてあります。
 *   ★2つで1組です。片方だけでは足りません。
 */
const fs = require("fs");
const path = require("path");
const { readCode, readRaw } = require("./_source");
let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

const ROOT = path.join(__dirname, "..", "..");
const vt = readCode("components", "VocalTracker.jsx");

// ---- entryToRow が書く列を、機械的に取り出す ----------------------------
function columnsWrittenByEntryToRow() {
  const start = vt.indexOf("function entryToRow(userId, e) {");
  if (start < 0) return null;
  // 本体の開き波括弧から、対応する閉じ波括弧まで数える。
  // ★正規表現で範囲を決めないこと。入れ子で必ず取り違えます。
  const bodyOpen = vt.indexOf("{", vt.indexOf(")", start));
  let depth = 0, end = -1;
  for (let i = bodyOpen; i < vt.length; i++) {
    if (vt[i] === "{") depth++;
    else if (vt[i] === "}") { depth--; if (depth === 0) { end = i; break; } }
  }
  const body = vt.slice(bodyOpen, end);
  // return { ... } の中の「key:」を拾う。入れ子の中は拾わないよう、
  // 行頭が4スペース＋英小文字の行だけを見る。
  const cols = new Set();
  body.split("\n").forEach((line) => {
    const m = /^\s{4}([a-z][a-z0-9_]*):/.exec(line);
    if (m) cols.add(m[1]);
  });
  return [...cols].sort();
}

(async () => {
  const ledger = await import("../../lib/entryColumns.js");

  console.log("=== entryToRow が書く列を取り出せる ===");
  const written = columnsWrittenByEntryToRow();
  assertTrue(Array.isArray(written) && written.length > 20,
    `entryToRow から列を取り出せた（${written ? written.length : 0}件）`);

  console.log("\n=== ★書く列すべてが、台帳に載っている ===");
  // ★台帳（lib/entryColumns.js）は「本番にあるのを見た」の記録です。
  //   新しい列を足したのに台帳に足していなければ、ここで落ちます。
  const known = new Set(ledger.knownEntryColumns());
  const unlisted = written.filter((c) => !known.has(c));
  if (unlisted.length > 0) {
    console.log("   台帳に無い列:");
    unlisted.forEach((c) => console.log(`     ・${c}  → lib/entryColumns.js に足してください`));
  }
  assertTrue(unlisted.length === 0, "★台帳に無い列を書き込んでいない");

  // 逆向き：台帳にあるのに、もう書いていない列（消し忘れ）
  const stale = ledger.knownEntryColumns().filter((c) => !written.includes(c));
  assertTrue(stale.length === 0, `台帳に、もう書いていない列が残っていない（${stale.join(", ") || "なし"}）`);

  console.log("\n=== ★未確認の列には、SQL のファイルがある ===");
  ledger.PENDING_COLUMNS.forEach((c) => {
    const fs2 = require("fs"), path2 = require("path");
    const dir = path2.join(ROOT, "supabase");
    const found = fs2.readdirSync(dir).filter((f) => f.endsWith(".sql")).some((f) => {
      const sql = fs2.readFileSync(path2.join(dir, f), "utf8");
      return sql.split("\n").filter((l) => !l.trim().startsWith("--"))
        .some((l) => new RegExp(`add column if not exists\\s+${c}\\b`, "i").test(l));
    });
    assertTrue(found, `★${c} の migration ファイルが supabase/ にある`);
  });

  console.log("\n=== ★落ちない備えが、外れていない ===");
  assertTrue(/writeWithMissingColumnFallback/.test(vt),
    "★保存が、足りない列の備えを通っている");
  // ★直の upsert は、備えの中の1回だけ。それ以外に残っていないこと。
  const directUpserts = (vt.match(/supabase\.from\("entries"\)\.upsert\(|from\("entries"\)\.upsert\(/g) || []).length;
  const insideHelper = /\(r\) => supabase\.from\("entries"\)\.upsert\(r, \{ onConflict: "user_id,date" \}\)/.test(vt);
  assertTrue(insideHelper, "備えの中で upsert している");
  assertTrue(directUpserts === 1, `★備えを通さない直の upsert が無い（見つかった数: ${directUpserts}）`);
  const fb = readCode("lib", "entryWriteFallback.js");
  assertTrue(/NEVER_DROP/.test(fb) && /user_id/.test(fb),
    "★user_id と date は決して外さない");
  assertTrue(/dropped\.length > 0/.test(vt),
    "★外した列は console に出す（黙って握りつぶさない）");

console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
process.exit(failCount === 0 ? 0 : 1);
})();
