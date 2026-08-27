#!/usr/bin/env node
/**
 * 健康データの共有範囲（share_scope）の権限テスト。
 *
 * 【このテストが守っているもの】
 *  1. entries に列を足したとき、共有範囲の対応表への追加を忘れていないか
 *  2. lib/shareScope.js と、Supabase側の関数（SQL）の対応表がズレていないか
 *  3. 健康データの閲覧判定に、教室での役割（オーナー・管理者・担当講師）が
 *     一切登場していないこと ← 権限テスト 8・9・12・13 は、この構造で満たされる
 *  4. canViewHealth() のロジックそのもの（解除・失効・範囲外）
 *
 * 実行方法：
 *   node components/tests/share-scope.test.js
 */

const fs = require("fs");
const path = require("path");
// ★コメント除去は components/tests/_source.js の1か所から使う。
//   各テストが自前で持つと、除去の仕方が少しずつずれていく。
const { stripComments } = require("./_source");

const ROOT = path.join(__dirname, "..", "..");
const TRACKER_PATH = path.join(ROOT, "components", "VocalTracker.jsx");
const SCOPE_PATH = path.join(ROOT, "lib", "shareScope.js");
const SQL_PATH = path.join(ROOT, "supabase", "migration_teacher_student_entries_rpc.sql");

let passCount = 0;
let failCount = 0;
function assertEqual(actual, expected, label) {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a === b) { console.log(`  ✓ ${label}`); passCount++; }
  else { console.log(`  ✗ ${label}`); console.log(`      期待値: ${b}`); console.log(`      実際値: ${a}`); failCount++; }
}
function assertTrue(cond, label) {
  if (cond) { console.log(`  ✓ ${label}`); passCount++; }
  else { console.log(`  ✗ ${label}`); failCount++; }
}

// --- VocalTracker.jsx から、実装をコピーせずに読み出すユーティリティ（既存テストと同じ方針） ---
function extractFunction(source, name) {
  const marker = `function ${name}(`;
  const start = source.indexOf(marker);
  if (start === -1) throw new Error(`関数 ${name} が VocalTracker.jsx 内に見つかりませんでした。`);
  let i = source.indexOf("{", start);
  let depth = 0;
  for (; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") { depth--; if (depth === 0) return source.slice(start, i + 1); }
  }
  throw new Error(`関数 ${name} の終わりが見つかりませんでした。`);
}

// entryToRow が実際に書き込んでいる列名を、そのまま拾う（＝entriesの列の正）。
function columnsWrittenByEntryToRow(source) {
  const fn = extractFunction(source, "entryToRow");
  const retStart = fn.indexOf("return {");
  let i = fn.indexOf("{", retStart);
  let depth = 0;
  let obj = "";
  for (; i < fn.length; i++) {
    obj += fn[i];
    if (fn[i] === "{") depth++;
    else if (fn[i] === "}") { depth--; if (depth === 0) break; }
  }
  // 入れ子のオブジェクト/配列の中のキーは拾わない（深さ1のキーだけ）
  let d = 0;
  let flat = "";
  for (const ch of obj) {
    if ("{[(".includes(ch)) d++;
    else if ("}])".includes(ch)) d--;
    if (d === 1) flat += ch;
  }
  const cols = new Set();
  flat.split("\n").forEach((line) => {
    const m = line.match(/^\s*([a-z_0-9]+)\s*:/);
    if (m) cols.add(m[1]);
  });
  cols.delete("user_id"); // 呼び出し側が入れる値で、共有の対象ではない
  return cols;
}

async function main() {
  const trackerSource = fs.readFileSync(TRACKER_PATH, "utf-8");
  const scopeSource = fs.readFileSync(SCOPE_PATH, "utf-8");
  const sqlSource = fs.readFileSync(SQL_PATH, "utf-8");
  const scope = await import("data:text/javascript;base64," + Buffer.from(scopeSource, "utf-8").toString("base64"));
  const { SHARE_SCOPE_KEYS, ALWAYS_VISIBLE_COLUMNS, COLUMN_SCOPE, KNOWN_COLUMNS, allowedColumnsForScope } = scope;

  console.log("=== テスト1: entries の全列が、共有範囲の対応表に分類されている ===");
  const written = columnsWrittenByEntryToRow(trackerSource);
  const classified = new Set([...KNOWN_COLUMNS, ...ALWAYS_VISIBLE_COLUMNS]);
  const unclassified = [...written].filter((c) => !classified.has(c));
  assertEqual(unclassified, [], "分類されていない列が無い（あれば lib/shareScope.js に足すこと）");
  const stale = KNOWN_COLUMNS.filter((c) => !written.has(c));
  assertEqual(stale, [], "対応表にあるのに entries に存在しない列が無い");

  console.log("\n=== テスト2: 生徒に見せている選択肢と、共有範囲のキーが一致する ===");
  const uiKeys = (trackerSource.match(/const DEFAULT_SHARE_SCOPE = \{([^}]*)\}/) || [])[1];
  assertTrue(!!uiKeys, "DEFAULT_SHARE_SCOPE が見つかる");
  const uiKeyList = (uiKeys.match(/([a-z]+):/g) || []).map((x) => x.replace(":", ""));
  assertEqual([...uiKeyList].sort(), [...SHARE_SCOPE_KEYS].sort(), "9つのキーが一致する");

  console.log("\n=== テスト3: SQL側の対応表が、lib/shareScope.js と1対1で一致する ===");
  const knownBlock = (sqlSource.match(/v_known\s+text\[\]\s*:=\s*array\[([\s\S]*?)\];/) || [])[1];
  assertTrue(!!knownBlock, "SQL の v_known が見つかる");
  const sqlKnown = (knownBlock.match(/'([a-z_0-9]+)'/g) || []).map((x) => x.replace(/'/g, ""));
  assertEqual([...sqlKnown].sort(), [...KNOWN_COLUMNS].sort(), "SQL と JS の列一覧が一致する");
  SHARE_SCOPE_KEYS.forEach((key) => {
    const block = new RegExp(`v_scope->>'${key}'\\)::boolean, false\\) then\\s*v_allowed := v_allowed \\|\\| array\\[([\\s\\S]*?)\\];`).exec(sqlSource);
    const sqlCols = block ? (block[1].match(/'([a-z_0-9]+)'/g) || []).map((x) => x.replace(/'/g, "")) : [];
    const jsCols = KNOWN_COLUMNS.filter((c) => COLUMN_SCOPE[c] === key);
    assertEqual([...sqlCols].sort(), [...jsCols].sort(), `「${key}」の列が SQL と JS で一致する`);
  });

  console.log("\n=== テスト4: 許可していない範囲の列が、1つも許可一覧に出てこない ===");
  const allTrue = {};
  SHARE_SCOPE_KEYS.forEach((k) => { allTrue[k] = true; });
  SHARE_SCOPE_KEYS.forEach((key) => {
    const partial = { ...allTrue, [key]: false };
    const allowed = allowedColumnsForScope(partial);
    const leaked = allowed.filter((c) => COLUMN_SCOPE[c] === key);
    assertEqual(leaked, [], `${key}=false のとき、${key} の列が1つも返らない`);
  });
  assertEqual(allowedColumnsForScope({}), [], "共有範囲が空なら、1列も返さない");
  assertEqual(allowedColumnsForScope(null), [], "共有範囲が未設定でも、1列も返さない");
  assertTrue(!allowedColumnsForScope(allTrue).includes("medication_tags"), "服薬タグは、全部許可しても共有されない");
  assertTrue(!allowedColumnsForScope(allTrue).includes("cycle_start"), "月経周期は、全部許可しても共有されない");
  assertTrue(!allowedColumnsForScope(allTrue).includes("location"), "滞在地は、全部許可しても共有されない");

  console.log("\n=== テスト5（権限テスト 8・9・12・13相当）: 健康データの判定に教室の役割が登場しない ===");
  // 「担当していない生徒を、オーナー/管理者が見られる経路」が構造的に存在しないことを示す。
  const canViewHealthSrc = extractFunction(trackerSource, "canViewHealth");
  ["organizations", "memberships", "assignments", "enrollments", "is_admin", "owner", "role"].forEach((word) => {
    assertTrue(!canViewHealthSrc.includes(word), `canViewHealth() が「${word}」を参照していない`);
  });
  const fnBody = (sqlSource.match(/create or replace function public\.get_student_entries[\s\S]*?\$\$;/) || [""])[0];
  const sqlWithoutComments = stripComments(fnBody);
  ["organizations", "memberships", "assignments", "enrollments", "is_admin"].forEach((word) => {
    assertTrue(!sqlWithoutComments.includes(word), `サーバー側の関数が「${word}」を参照していない`);
  });
  assertTrue(sqlWithoutComments.includes("teacher_student_links"), "判定は teacher_student_links だけで行っている");
  assertTrue(sqlWithoutComments.includes("auth.uid()"), "呼び出した本人（auth.uid()）で判定している");
  assertTrue(/security\s+definer/i.test(fnBody), "SECURITY DEFINER で定義されている");
  assertTrue(/set\s+search_path\s*=\s*public/i.test(fnBody), "search_path が固定されている");
  assertTrue(/grant execute on function public\.get_student_entries/.test(sqlSource), "authenticated にだけ実行権限を与えている");
  assertTrue(/revoke all on function public\.get_student_entries/.test(sqlSource), "匿名からの実行を落としている");

  console.log("\n=== テスト6: canViewHealth() のロジック ===");
  const sandbox = {};
  new Function("sandbox", canViewHealthSrc + "\nsandbox.canViewHealth = canViewHealth;")(sandbox);
  const canViewHealth = sandbox.canViewHealth;
  const activeLink = { status: "active", revoked_at: null, share_scope: { voice: true, sleep: false } };
  assertEqual(canViewHealth(activeLink, "voice"), true, "許可された範囲は見られる");
  assertEqual(canViewHealth(activeLink, "sleep"), false, "許可していない範囲は見られない");
  assertEqual(canViewHealth(activeLink, "mental"), false, "share_scope に無いキーは見られない");
  assertEqual(canViewHealth({ ...activeLink, status: "revoked" }, "voice"), false, "解除された連携では見られない");
  assertEqual(canViewHealth({ ...activeLink, revoked_at: "2026-08-01" }, "voice"), false, "revoked_at があれば見られない");
  assertEqual(canViewHealth(null, "voice"), false, "連携が無ければ見られない");
  assertEqual(canViewHealth({ status: "active", revoked_at: null }, "voice"), false, "share_scope が未設定なら見られない");

  console.log("\n=== テスト7: クライアントが entries に直接アクセスしていない ===");
  const directStudentSelect = /from\("entries"\)\.select\([^)]*\)\.eq\("user_id",\s*studentId/.test(trackerSource);
  assertTrue(!directStudentSelect, "生徒の記録を entries から直接 select していない");
  assertTrue(trackerSource.includes('supabase.rpc("get_student_entries"'), "サーバー側の関数を経由して取得している");

  console.log(`\n合計: ${passCount}件成功 / ${failCount}件失敗`);
  if (failCount > 0) {
    console.log("\n⚠ 失敗があります。健康データの共有範囲に関わるため、必ず直してから進めてください。");
    process.exit(1);
  }
  console.log("\n✓ すべて成功しました。");
}

main().catch((err) => { console.error(err); process.exit(1); });
