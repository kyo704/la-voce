// ============================================================================
// ★見張り ── ★org_billing は 閉じて いるか（★裁定 その74・2026-09-18）
//
//   ★紙 `supabase/migration_org_billing.sql`
//
//   ★★★これは 単体の 試しでは ありません。★**ずれを 見つける 見張り** です。
//     ★★紙を 字として 読み、★決めが 書いて ある ことを 見ます。
//     ★★台帳（本番）に 付いた かどうかは、★別に 直に 尋ねました
//       （★2026-09-18・決まり3本／`anon` 0行／force true を 確かめました）。
//     ★★紙が 正しくても、★台帳が そうとは 限りません。★両方 要ります。
//
//   ★★測る のは 6つ です。
//     ★一 ★`using (true)` が 1つも 無い
//     ★二 ★決まりは 3つ（select / insert / update）── ★`for all` で まとめない
//     ★三 ★`anon` に 渡して いない
//     ★四 ★取り上げ（revoke）が、★渡し（grant）より **先**
//     ★五 ★`force row level security` が ある
//     ★六 ★`authenticated` に DELETE を 渡して いない
// ============================================================================

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { stripComments } = require("./_source");

const ROOT = path.join(__dirname, "..", "..");
const 紙の道 = path.join(ROOT, "supabase/migration_org_billing.sql");

let 数 = 0;
function ok(cond, 名) {
  数 += 1;
  assert.ok(cond, "★落ちました ── " + 名);
  console.log("  ok  " + 名);
}

// ★★較正 ── ★紙が 無ければ 止まります。★無い ものを 通しません。
if (!fs.existsSync(紙の道)) {
  console.error("★止まりました ── 紙が ありません: " + 紙の道);
  process.exit(1);
}

const 生 = fs.readFileSync(紙の道, "utf8");
// ★★★注を 落として から 見ます（★2026-09-16 の 決まり）。
//   ★★注に「`using (true)` を 書きません」と 書いて あります。
//   ★★落とさずに 探すと、★自分の 注に 当たって 落ちます。
//   ★★この 罠は すでに 2度 踏みました。
const 字 = stripComments(生, ".sql");

ok(!/using\s*\(\s*true\s*\)/i.test(字), "using (true) が 1つも 無い");

const 決まり = 字.match(/create policy\s+(\w+)/gi) || [];
ok(決まり.length === 3, "決まりは 3つ（いま " + 決まり.length + "）");
["for select", "for insert", "for update"].forEach((v) => {
  ok(字.toLowerCase().includes(v), v + " が ある");
});
ok(!/for\s+all/i.test(字), "for all で まとめて いない");

ok(!/grant[^;]*\bto\b[^;]*\banon\b/i.test(字), "anon に 渡して いない");
ok(/revoke\s+all\s+on\s+public\.org_billing\s+from\s+anon/i.test(字),
  "anon から 取り上げて いる");

const 取り上げ = 字.toLowerCase().indexOf("revoke all on public.org_billing");
const 渡し = 字.toLowerCase().indexOf("grant select");
ok(取り上げ >= 0 && 渡し >= 0 && 取り上げ < 渡し,
  "取り上げが 渡しより 先（★2026-09-16 の 覚え）");

ok(/force\s+row\s+level\s+security/i.test(字),
  "持ち主にも かける（force）── 持ち主は 素通りします");

const g = /grant\s+([^;]*?)\s+on\s+public\.org_billing\s+to\s+authenticated/i.exec(字);
assert.ok(g, "★止まりました ── authenticated への 渡しを 読めません。");
ok(!/delete/i.test(g[1]), "authenticated に DELETE を 渡して いない（請求の 履歴は 消しません）");

// ★★できことで 判じて いるか。★役割の 名で 判じて いないか（★A2）。
ok(/has_can\(\s*org_id\s*,\s*'bill'\s*\)/.test(字), "bill（できこと）で 判じて いる");
ok(!/role\s*=\s*'(owner|admin|teacher|staff)'/i.test(字),
  "役割の 名で 判じて いない（★A2・2026-09-18）");

// ★★BEGIN / ROLLBACK を 使って いない（★2026-09-15 の 一件）。
ok(!/\bbegin\b\s*;|\brollback\b/i.test(字), "BEGIN / ROLLBACK を 使って いない");

console.log("\n★" + 数 + "件 通りました ── org_billing は 閉じて います（紙の 上で）");
