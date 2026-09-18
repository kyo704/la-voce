// ============================================================================
// ★見張り ── ★monka_read_log は 閉じて いるか（★裁定 その76・2026-09-18）
//
//   ★紙 `supabase/migration_monka_read_log.sql`
//
//   ★★★この 表は、★`monka_read` を 使える ように する ための **条件** です。
//     ★★記録が 残らない 閲覧を 作らない ため に、★先に 立てて います。
//
//   ★★測る のは 7つ です。
//     ★一 ★`using (true)` が 1つも 無い
//     ★二 ★決まりは 2つ（select / insert）
//     ★三 ★`update` も `delete` も 渡して いない ── ★記録は 直せません
//     ★四 ★`anon` に 渡して いない ／ 取り上げが 先
//     ★五 ★`force row level security` が ある
//     ★六 ★自分の 名でしか 書けない（`viewer_user_id = auth.uid()`）
//     ★七 ★理由が 空では 書けない
// ============================================================================

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { stripComments } = require("./_source");

const ROOT = path.join(__dirname, "..", "..");
const 紙の道 = path.join(ROOT, "supabase/migration_monka_read_log.sql");

let 数 = 0;
function ok(cond, 名) {
  数 += 1;
  assert.ok(cond, "★落ちました ── " + 名);
  console.log("  ok  " + 名);
}

if (!fs.existsSync(紙の道)) {
  console.error("★止まりました ── 紙が ありません: " + 紙の道);
  process.exit(1);
}

// ★★注を 落として から 見ます。★注に「using (true) を 書きません」と 書いて あります。
const 字 = stripComments(fs.readFileSync(紙の道, "utf8"), ".sql");

ok(!/using\s*\(\s*true\s*\)/i.test(字), "using (true) が 1つも 無い");

const 決まり = 字.match(/create policy\s+(\w+)/gi) || [];
ok(決まり.length === 2, "決まりは 2つ（いま " + 決まり.length + "）");
ok(/for select/i.test(字), "for select が ある");
ok(/for insert/i.test(字), "for insert が ある");
ok(!/for\s+update|for\s+delete|for\s+all/i.test(字),
  "for update / for delete / for all が 無い");

// ★★★記録は 直せません。★直せる 記録は 記録では ありません。
const g = /grant\s+([^;]*?)\s+on\s+public\.monka_read_log\s+to\s+authenticated/i.exec(字);
assert.ok(g, "★止まりました ── authenticated への 渡しを 読めません。");
ok(!/update|delete/i.test(g[1]), "update も delete も 渡して いない（記録は 直せません）");
ok(/select/i.test(g[1]) && /insert/i.test(g[1]), "select と insert は 渡して いる");

ok(!/grant[^;]*\bto\b[^;]*\banon\b/i.test(字), "anon に 渡して いない");
const 取り上げ = 字.toLowerCase().indexOf("revoke all on public.monka_read_log");
const 渡し = 字.toLowerCase().indexOf("grant select");
ok(取り上げ >= 0 && 渡し >= 0 && 取り上げ < 渡し, "取り上げが 渡しより 先");

ok(/force\s+row\s+level\s+security/i.test(字), "持ち主にも かける（force）");

// ★★自分の 名でしか 書けない。★他人の 名で 書けると、★記録を すり替えられます。
ok(/viewer_user_id\s*=\s*auth\.uid\(\)/.test(字), "自分の 名でしか 書けない");
ok(/has_can\(\s*org_id\s*,\s*'monka_read'\s*\)/.test(字),
  "書けるのは monka_read を 持つ 方だけ");
ok(/has_can\(\s*org_id\s*,\s*'master'\s*\)/.test(字),
  "読めるのは master を 持つ 方（と 自分の ぶん）");

// ★★★門下の 先生 本人は 読めません（★報復を 避ける・裁定 その76）。
ok(!/target_monka_id\s*=\s*auth\.uid\(\)/.test(字),
  "門下の 先生 本人には 開けて いない（誰が 見たかを 出さない）");

// ★★理由が 空では 書けない。★`not null` だけ では 空の 字が 通ります。
ok(/reason\s+text\s+not null/i.test(字), "理由は not null");
ok(/char_length\(\s*btrim\(\s*reason\s*\)\s*\)/i.test(字),
  "空の 字も 弾く（長さを 見て いる）");

ok(!/\bbegin\b\s*;|\brollback\b/i.test(字), "BEGIN / ROLLBACK を 使って いない");

console.log("\n★" + 数 + "件 通りました ── monka_read_log は 閉じて います（紙の 上で）");
