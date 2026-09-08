// ============================================================================
// 撤回した方の 記録を、サーバで 止める（2026-09-09）
//
//   ★出どころ supabase/2026-09-09-撤回した方の記録を、サーバで止める.sql
//
//   ★★守ること
//     ・★古い「for all」を 消していること（★permissive は OR で つながります）
//     ・★UPDATE に WITH CHECK が あること（★無いのは 欠陥です）
//     ・★読む・書き出す・消すは 止めないこと（★取り上げないため）
//     ・★権限も 剥がしていること（★ポリシーの不在は 1枚の板）
//     ・★BEGIN / ROLLBACK で 包まないこと
// ============================================================================

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
let failed = 0;
function ok(name, cond, extra) {
  if (cond) { console.log("  ○ " + name); return; }
  failed++; console.log("  ✗ " + name + (extra ? "\n      " + extra : ""));
}

const FILE = "supabase/2026-09-09-撤回した方の記録を、サーバで止める.sql";
const sql = fs.readFileSync(path.join(ROOT, FILE), "utf-8");

console.log("■ ★止めるもの");
// ★★古い「for all」を 消すこと。★残すと OR で つながり、そちらが 通ります。
ok("★★古い for all を 消している",
  /drop policy if exists "Users can manage own entries" on public\.entries;/.test(sql));
ok("★書き足すのを 止めている（insert）",
  /for insert[\s\S]{0,120}not public\.consent_withdrawn\(auth\.uid\(\)\)/.test(sql));
ok("★書き替えるのを 止めている（update）",
  /for update[\s\S]{0,200}not public\.consent_withdrawn\(auth\.uid\(\)\)/.test(sql));
// ★★WITH CHECK の 無い UPDATE は 欠陥です（★2026-09-08 の決め）。
const upd = sql.slice(sql.indexOf('"entries_update_own_not_withdrawn"'),
  sql.indexOf('"entries_delete_own"'));
ok("★★UPDATE に USING と WITH CHECK の 両方が ある",
  /using \(/.test(upd) && /with check \(/.test(upd));

console.log("■ ★止めないもの（★取り上げないため）");
const sel = sql.slice(sql.indexOf('"entries_select_own"'), sql.indexOf('"entries_insert_own'));
ok("★★読むのは 止めていない", !/consent_withdrawn/.test(sel));
const del = sql.slice(sql.indexOf('"entries_delete_own"'), sql.indexOf("-- ★④"));
ok("★★消すのは 止めていない", !/consent_withdrawn/.test(del));

console.log("■ ★2枚目（★権限）");
// ★★ポリシーの不在は 1枚の板。★権限の剥奪と 合わせて 2枚に します。
ok("★anon から まとめて 剥がしている", /revoke all on public\.entries from anon;/.test(sql));
ok("★TRUNCATE を 剥がしている",
  /revoke truncate, trigger, references on public\.entries from authenticated;/.test(sql));
ok("★関数を anon に 渡していない",
  /revoke all on function public\.consent_withdrawn\(uuid\) from anon;/.test(sql));

console.log("■ ★途中の姿も、ゆるく しないこと");
// ★★2026-09-09、★坂本さんから ご報告をいただきました。
//   ★「実行の順の都合で、一時的に anon に entries の全権限が残った」。
//   ★★SQL エディタは、途中で止まっても 巻き戻しません。
//   ★だから、★剥がすほうを 先に 書きます。
const revokeAt = sql.indexOf("revoke all on public.entries from anon;");
const dropAt = sql.indexOf('drop policy if exists "Users can manage own entries"');
ok("★★剥がすのが、ポリシーの入れ直しより 先", revokeAt > 0 && dropAt > 0 && revokeAt < dropAt,
  `revoke ${revokeAt} / drop ${dropAt}`);

console.log("■ ★安全に 流せること");
// ★★Supabase の SQL エディタは ROLLBACK を 効かせません（★2026-09-08）。
ok("★★BEGIN / ROLLBACK で 包んでいない",
  !/^\s*begin;/im.test(sql) && !/^\s*rollback;/im.test(sql));
ok("★何度 流しても よい（create or replace ／ if exists）",
  /create or replace function/.test(sql) && /drop policy if exists/.test(sql));
ok("★確かめが 付いている（★読むだけ）",
  /from pg_policies/.test(sql) && /information_schema\.table_privileges/.test(sql));
// ★★search_path を 固定していること（security definer のため）。
ok("★★security definer に search_path を 固定している",
  /security definer\s*\n\s*set search_path = public/.test(sql));

console.log("■ ★画面の側");
const vt = fs.readFileSync(path.join(ROOT, "components", "VocalTracker.jsx"), "utf-8");
// ★★0行で 返ったら、★黙って 成功に しないこと。
ok("★撤回のときも 0行を 見ている",
  /\.update\(\{ consent_health_data_withdrawn_at: now \}\)\.eq\("id", userId\)\.select\("id"\)/.test(vt));

console.log(failed === 0 ? "\n✅ すべて通りました" : "\n❌ " + failed + " 件");
process.exit(failed === 0 ? 0 : 1);
