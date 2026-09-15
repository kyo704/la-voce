#!/usr/bin/env node

// ============================================================================
// ★関数に 渡す id は、★その場の ログインの id で あること
//
//   ★出どころ [ACTION] Opus → Code（★2026-09-15）
//     「★DECISION: ㋐. keep service_role. add p_user_id and check inside」
//     「★and the route must pass the session user's id, never a value
//       taken from the request body」
//     「route だけに門がある形をやめる。関数の中にも1枚置く」
//   ★紙 … supabase/migration_no024_gate_inside_the_function.sql
//
//   ★★なぜ 見張りが 要るのか。
//     ★★`character_unlock_summary` は、★**ある 1人に 結びついた 値**を 返します。
//       ★数の まとめ では ありません。
//     ★★まちがった p_user_id を 渡せば、★よその 方の 数が 返ります。
//     ★★関数は、★呼び手が 誰かを 確かめられません
//       （★service_role の 下では `auth.uid()` は null）。
//       ★関数が できるのは「その人が 居るか」を 見る ことだけ です。
//     ★★だから もう半分は、★**経路の 側の 約束** です。
//       ★★約束は 書いた だけでは 守られません。★数えます。
//
//   ★★`get_student_entries` と 同じ 形 です。
//     ★あのときも「呼ぶ側が 確かめて いるから」で 済ませて いました。
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode } = require("./_source");

let ok = 0, ng = 0;
function t(cond, label) {
  if (cond) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label); ng++; }
}

const NEED = [
  ["app", "api", "character", "unlock", "route.js"],
  ["app", "admin", "page.js"],
  ["supabase", "migration_no024_gate_inside_the_function.sql"]
];
const missing = NEED.filter((p) => !fs.existsSync(path.join(__dirname, "..", "..", ...p)));
if (missing.length) {
  missing.forEach((p) => console.log("★★ありません: " + p.join("/")));
  console.log("　★数えません。★止まります。");
  process.exit(1);
}

const unlock = readCode("app", "api", "character", "unlock", "route.js");
const admin = readCode("app", "admin", "page.js");
const sql = readCode("supabase", "migration_no024_gate_inside_the_function.sql");

console.log("① unlock の 経路 ── ★本文から 取って いないこと");
// ★★いちばん 強い 形 ── ★そもそも 本文を 読む 道が ありません。
t(/export async function POST\(\)/.test(unlock), "POST が 引数を 持って いない");
t(!/\.json\(\)/.test(unlock) || !/request|req\b/.test(unlock), "要求の 本文を 読んで いない");
t(!/searchParams|nextUrl|headers\(\)\.get/.test(unlock), "URL や 見出しからも 取って いない");
// ★★渡して いるのが、★確かめた `user` の id で ある こと。
t(/getUserWithTimeout\(supabase/.test(unlock), "ログインを 確かめて いる");
t(/character_unlock_summary", \{ p_user_id: user\.id \}/.test(unlock),
  "★渡して いるのは user.id（★その場の ログイン）");
// ★★`user` が 無ければ 進まない こと。★null を 渡さない ため。
t(/if \(!user\) \{/.test(unlock), "user が 無ければ 進まない");

console.log("\n② admin の 経路 ── ★確かめた 本人の id を 渡すこと");
t(/admin_entry_stats", \{ p_user_id: user\.id \}/.test(admin),
  "★渡して いるのは user.id");
// ★★経路の 門が、★渡す より **前** に ある こと。
const gateAt = admin.indexOf("myProfile.is_admin");
const callAt = admin.indexOf('admin_entry_stats", { p_user_id');
t(gateAt > -1 && callAt > gateAt, "経路の 門が 先（★確かめて から 渡す）");
t(/export async function POST|searchParams|params\./.test(admin) === false,
  "外から id を 受け取る 道が ない");

console.log("\n③ 紙 ── ★関数の 中にも 門が あること");
t(/create or replace function public\.admin_entry_stats\(p_user_id uuid\)/.test(sql),
  "admin_entry_stats が p_user_id を 受け取る");
t(/where id = p_user_id and is_admin is true/.test(sql),
  "★中で is_admin を 見て いる");
t(/then null/.test(sql), "★管理者でなければ null（★raise しません）");
t(/where id = p_user_id\) then null/.test(sql),
  "unlock も、★居ない人なら null");

console.log("\n④ 紙 ── ★引数なしの 古いほうを 落として いること");
// ★★`create or replace` は、★引数の ちがう 関数を 置き換えません。
//   ★★落とさないと、★**門の ない 古いほう**が 残り、
//     ★service_role から そのまま 呼べます。
t(/drop function if exists public\.admin_entry_stats\(\);/.test(sql),
  "★引数なしの admin_entry_stats を 落として いる");

console.log("\n⑤ 紙 ── ★呼べる 人を 増やして いないこと（★㋑ を 採らない）");
// ★★㋑ は「呼べる 人を 増やしてから 中で 絞る」。★向きが 逆 です。
//   ★★いまは サーバだけが 呼べます。★それを 手放しません。
t(!/grant execute on function public\.admin_entry_stats\(uuid\) to authenticated/.test(sql),
  "admin_entry_stats を authenticated に 渡して いない");
t(!/grant execute on function public\.character_unlock_summary\(uuid\) to authenticated/.test(sql),
  "character_unlock_summary を authenticated に 渡して いない");
t(!/to anon/.test(sql), "anon に 渡して いない");
// ★★先に 取り上げてから 渡す こと。★広い ほうが 黙って 勝ちます。
const revAt = sql.indexOf("revoke all on function public.admin_entry_stats(uuid)");
const graAt = sql.indexOf("grant execute on function public.admin_entry_stats(uuid)");
t(revAt > -1 && graAt > revAt, "★取り上げが 先、★渡しが あと");

console.log("\n⑥ 確かめの 問いが、★書かない ものだけで あること");
// ★★SQLエディタは BEGIN / ROLLBACK を 効かせません（★2026-09-11 の 事故）。
t(!/\bbegin\b/i.test(sql), "BEGIN を 使って いない");
t(!/\brollback\b/i.test(sql), "ROLLBACK を 使って いない");
t(!/\bupdate public\.|\binsert into public\.|\bdelete from public\./i.test(sql),
  "確かめが 何も 書き換えない");

console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
process.exit(ng === 0 ? 0 : 1);
