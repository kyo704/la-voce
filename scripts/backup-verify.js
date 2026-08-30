#!/usr/bin/env node
/**
 * ダンプの健全性を調べる（A-P0-1 ②）
 *
 *   使い方
 *     node scripts/backup-verify.js backups/woolsong-20260830-2210.sql
 *
 *   見るもの（仕様書 A-P0-1 の②）
 *     ・テーブルごとの行数
 *     ・各テーブルの最新レコードの日時
 *     ・期待される行数を大きく下回っていたら★異常終了する
 *
 *   ★データベースにつなぎません。ファイルを読むだけです。
 *     本番の認証情報を扱わずに済み、いつでも何度でも実行できます。
 *
 *   ★「読めなかった」を 0行 と報告しないこと。
 *     0 が「本当に0行」なのか「数えられなかった」のか区別できないと、
 *     壊れたバックアップを正常と読んでしまいます。
 *     形が分からないときは、必ず異常終了します。
 */
const fs = require("fs");
const path = require("path");

const BASELINE = path.join(__dirname, "..", "backup-baseline.json");

// ---------------------------------------------------------------------------
// lib/backupTables.js は ES Module なので、動的 import で読みます。
// ★一覧をここに書き写さないこと（片方だけ古くなります）。
// ---------------------------------------------------------------------------
async function loadSpec() {
  return import("../lib/backupTables.js");
}

/**
 * ダンプを1行ずつ読み、COPY のかたまりを数える。
 *
 *   COPY "public"."entries" ("id", "user_id", "date", ...) FROM stdin;
 *   ...行...
 *   \.
 *
 * ★INSERT 形式（--inserts）で取られたダンプも、いちおう数えます。
 * ★どちらでもなければ、0 と言わずに「分からない」を返します。
 */
function parseDump(text) {
  const lines = text.split("\n");
  const counts = {};        // "public.entries" -> 行数
  const columns = {};       // "public.entries" -> [列名]
  const latest = {};        // "public.entries" -> ISO文字列
  let sawCopy = false;
  let sawInsert = false;

  const copyRe = /^COPY\s+"?([a-zA-Z_]+)"?\."?([a-zA-Z_]+)"?\s*\(([^)]*)\)\s+FROM stdin;/;
  const insertRe = /^INSERT INTO\s+"?([a-zA-Z_]+)"?\."?([a-zA-Z_]+)"?\s/;
  // 日時らしい列（最新レコードの日時に使う）
  const dateColRe = /(_at|_date|^date$|^changed_at$|^granted_at$)/;
  const isoRe = /^\d{4}-\d{2}-\d{2}([ T]\d{2}:\d{2}:\d{2}|$)/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const m = copyRe.exec(line);
    if (m) {
      sawCopy = true;
      const key = `${m[1]}.${m[2]}`;
      const cols = m[3].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
      columns[key] = cols;
      const dateIdx = cols
        .map((c, idx) => ({ c, idx }))
        .filter(({ c }) => dateColRe.test(c))
        .map(({ idx }) => idx);

      let n = 0;
      let best = null;
      for (i = i + 1; i < lines.length; i++) {
        if (lines[i] === "\\.") break;
        n++;
        if (dateIdx.length) {
          const cells = lines[i].split("\t");
          dateIdx.forEach((di) => {
            const v = cells[di];
            if (v && v !== "\\N" && isoRe.test(v) && (best === null || v > best)) best = v;
          });
        }
      }
      counts[key] = (counts[key] || 0) + n;
      if (best) latest[key] = best;
      continue;
    }

    const mi = insertRe.exec(line);
    if (mi) {
      sawInsert = true;
      const key = `${mi[1]}.${mi[2]}`;
      counts[key] = (counts[key] || 0) + 1;
    }
  }

  return { counts, columns, latest, sawCopy, sawInsert };
}

function fmt(n) { return String(n).padStart(7, " "); }

(async () => {
  const file = process.argv[2];
  if (!file) {
    console.error("使い方: node scripts/backup-verify.js <ダンプのファイル>");
    process.exit(2);
  }
  if (!fs.existsSync(file)) {
    console.error(`✗ ファイルがありません: ${file}`);
    process.exit(2);
  }

  const spec = await loadSpec();
  const text = fs.readFileSync(file, "utf8");
  const { counts, latest, sawCopy, sawInsert } = parseDump(text);

  console.log(`=== バックアップの健全性 ===`);
  console.log(`ファイル: ${file}`);
  console.log(`大きさ  : ${fs.statSync(file).size.toLocaleString()} バイト\n`);

  // ★形が分からなければ、0 と言わずに止まる
  if (!sawCopy && !sawInsert) {
    console.error("✗ ★ダンプの形が分かりませんでした（COPY も INSERT も見つかりません）。");
    console.error("  空のバックアップかもしれませんし、途中で切れたのかもしれません。");
    console.error("  ★「0行」とは報告しません。取り直してください。");
    process.exit(1);
  }

  const problems = [];

  // ---- ① auth（ログインできるか）-----------------------------------------
  console.log("── auth（これが無いとログインできません）──");
  spec.BACKUP_AUTH_TABLES.forEach(({ table, critical }) => {
    const key = `auth.${table}`;
    const n = counts[key];
    if (typeof n !== "number") {
      console.log(`  ✗ ${fmt("—")}  ${key}  ★入っていません`);
      problems.push(`${key} がダンプに入っていない`);
    } else if (critical && n === 0) {
      console.log(`  ✗ ${fmt(n)}  ${key}  ★0行`);
      problems.push(`${key} が0行`);
    } else {
      console.log(`  ✓ ${fmt(n)}  ${key}`);
    }
  });

  // ---- ② public の各テーブル ---------------------------------------------
  console.log("\n── public ──");
  const current = {};
  spec.BACKUP_TABLES.forEach(({ table, critical }) => {
    const key = `public.${table}`;
    const n = counts[key];
    const when = latest[key] ? `  最新 ${latest[key].slice(0, 19)}` : "";
    if (typeof n !== "number") {
      console.log(`  ✗ ${fmt("—")}  ${table}  ★テーブルごと入っていません`);
      problems.push(`${key} がダンプに入っていない`);
      return;
    }
    current[table] = n;
    if (critical && n === 0) {
      console.log(`  ✗ ${fmt(n)}  ${table}  ★0行（あってはいけません）`);
      problems.push(`${key} が0行`);
    } else {
      console.log(`  ${n === 0 ? "・" : "✓"} ${fmt(n)}  ${table}${when}`);
    }
  });

  // ---- ③ 前回と比べる ------------------------------------------------------
  console.log("\n── 前回のバックアップとの比較 ──");
  let baseline = null;
  if (fs.existsSync(BASELINE)) {
    try { baseline = JSON.parse(fs.readFileSync(BASELINE, "utf8")); }
    catch { console.log("  ! backup-baseline.json が読めませんでした（今回の値で作り直します）"); }
  }
  if (!baseline || !baseline.counts) {
    console.log("  ・初めてなので、比べる相手がありません。今回の値を残します。");
  } else {
    const bad = spec.shrinkFailures(baseline.counts, current);
    if (bad.length === 0) {
      console.log(`  ✓ 大きく減ったテーブルはありません（前回 ${baseline.takenAt || "?"}）`);
    } else {
      bad.forEach((b) => {
        console.log(`  ✗ ${b.table}: ${b.before} → ${b.after === null ? "無し" : b.after}  ${b.reason}`);
        problems.push(`${b.table} が ${b.before} から ${b.after} に減っている`);
      });
    }
  }

  // ---- ④ 結果 --------------------------------------------------------------
  console.log("");
  if (problems.length > 0) {
    console.error(`❌ 異常が ${problems.length} 件あります。★このバックアップは使えません。`);
    problems.forEach((p) => console.error(`   ・${p}`));
    console.error("\n   ★backup-baseline.json は更新していません（異常な値を基準にしないため）。");
    process.exit(1);
  }

  fs.writeFileSync(BASELINE, JSON.stringify({
    takenAt: new Date().toISOString().slice(0, 19).replace("T", " "),
    note: "★行数だけです。個人のデータは入っていません。コミットして構いません。",
    counts: current
  }, null, 2) + "\n");
  console.log("✅ 問題ありません。backup-baseline.json を更新しました。");
  process.exit(0);
})();
