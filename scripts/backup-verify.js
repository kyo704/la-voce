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

/**
 * ★この控えは、いつ取られたものか。
 *
 *   scripts/backup-dump.sh は backups/woolsong-YYYYMMDD-HHMMSS.sql に書きます。
 *   ★ダンプ自身は日時を持っていません（pg_dump のヘッダに入りません）。
 *     だからファイル名から読みます。
 *
 *   ★読めなければ null を返します。
 *     そのときは「全部の表が要る」として測ります。★見落とすより、
 *     余分に鳴らすほうを選びます。名前を変えたのは人の判断なので、
 *     機械が黙って手加減してはいけません。
 */
function dumpTakenAt(file) {
  const m = path.basename(file).match(/(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})/);
  if (!m) return null;
  const [, y, mo, d, h, mi, sec] = m;
  return new Date(`${y}-${mo}-${d}T${h}:${mi}:${sec}`);
}

/**
 * その表は、この控えを取った時点で★存在していたか。
 *
 *   ★since が無い表は、最初からあるものとして扱います。
 *   ★控えの日時が読めないときも、要るものとして扱います（上の理由）。
 */
/**
 * 日時を「YYYY-MM-DD HH:MM:SS」の★現地時刻で文字にする。
 *
 *   ★toISOString() を使わないこと。あれは UTC に直します。
 *     ファイル名の時刻は date +%H%M%S、つまり★現地時刻です。
 *     ISO に直すと日本では9時間ずれ、12:05 の控えが 03:05 と記録されます。
 *     ★実際にそうなっていました（前の基準の 03:06:04 も同じずれです）。
 *     ずれたまま比べると、新しい控えを古いと取り違えます。
 */
function 現地時刻(d) {
  const p2 = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ` +
         `${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}`;
}

function existedAt(since, takenAt) {
  if (!since) return true;
  if (!takenAt) return true;
  return takenAt >= new Date(since);
}

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
  const takenAt = dumpTakenAt(file);
  if (!takenAt) {
    console.log("  ★ファイル名から日時が読めません。全部の表が要るものとして測ります。");
  }
  const current = {};
  const 後からできた = [];
  spec.BACKUP_TABLES.forEach(({ table, critical, since }) => {
    const key = `public.${table}`;
    const n = counts[key];
    const when = latest[key] ? `  最新 ${latest[key].slice(0, 19)}` : "";
    if (typeof n !== "number") {
      // ★その表が、この控えより後に出来たのなら、入っていないのが正しい姿です。
      //   存在しない表は pg_dump には入れられません。
      //   ★ここを異常として鳴らし続けると、本物の異常と見分けがつかなくなります。
      if (!existedAt(since, takenAt)) {
        console.log(`  ・ ${fmt("—")}  ${table}  この控えより後にできた表（${since}）`);
        後からできた.push(table);
        return;
      }
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

  // ★古い控えを検査したときは、基準を書き換えません（2026-09-03）。
  //   復元の練習では、手元にある★昔のダンプを検査します。
  //   そのたびに基準が昔の値へ戻ると、★次の本物の検査で
  //   「増えている」ように見え、減ったことに気づけなくなります。
  //   ★練習が、見張りを壊してはいけません。
  if (baseline && baseline.takenAt && takenAt) {
    const 前回 = new Date(String(baseline.takenAt).replace(" ", "T"));
    if (!isNaN(前回) && takenAt < 前回) {
      console.log(`\n✅ 問題ありません。★基準は更新していません（この控え ${
        現地時刻(takenAt)
      } は、前回の基準 ${baseline.takenAt} より古いためです）。`);
      process.exit(0);
    }
  }

  fs.writeFileSync(BASELINE, JSON.stringify({
    // ★控えを取った日時を書きます。検査を走らせた日時ではありません。
    //   前は new Date() を書いていました。すると 9/1 の控えを 9/3 に
    //   検査したとき、基準が「9/3 のもの」として記録され、
    //   ★次に本物の 9/3 の控えを検査したとき、古いほうを新しいと
    //     取り違えます。上の「古い控えでは更新しない」判定も効きません。
    //   ★ファイル名から読めないときだけ、検査した日時を使います。
    takenAt: 現地時刻(takenAt || new Date()),
    note: "★行数だけです。個人のデータは入っていません。コミットして構いません。",
    counts: current
  }, null, 2) + "\n");
  console.log("✅ 問題ありません。backup-baseline.json を更新しました。");
  process.exit(0);
})();
