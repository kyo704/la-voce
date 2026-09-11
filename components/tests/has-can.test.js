#!/usr/bin/env node

// ============================================================================
// §7-3　has_can ── ★見張りを 1本に する
//
//   ★出どころ docs/opus/作業指示-権限の事故を直し、記録を残す（9月11日）.md §7-3
//     「★サーバに 関数を 1つ 作る ── has_can(org_id, 'meibo')」
//     「★すべての 決まりが、★その 1つの 関数を 呼ぶ」
//
//   ★★この 見張りは、★SQL の 字を 読みます。★台帳を 引いて いません。
//     ★★動いて いるかは、★坂本さんに 流して いただいた 結果で 見ます。
//
//   ★★見る ところ
//     ① 関数が 1つ ある（★決まりごとに 書いて いない）
//     ② security definer で、★search_path を 固定して いる
//     ③ 中で 見るのは auth.uid() 自身の 行だけ
//     ④ role を 見て いない
//     ⑤ anon に 渡して いない
//     ⑥ できことの 名前が、lib/opsPerms.js と そろって いる
// ============================================================================

const fs = require("fs");
const path = require("path");

let ok = 0;
let ng = 0;
function t(cond, label) {
  if (cond) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label); ng++; }
}

const P = path.join(__dirname, "..", "..", "supabase",
  "2026-09-11-7-3-has_canを作る（第1段・作るだけ）.sql");
const raw = fs.readFileSync(P, "utf8");
// ★★覚え書き（-- …）を 外して 数えます。★説明の 字に つまずかない ため。
//   ★★この 帳面で 3度 起きて いる 形です。
const sql = raw.split("\n").filter((l) => !/^\s*--/.test(l)).join("\n");

(async () => {
  console.log("① 関数が 1つ");
  t(/create or replace function public\.has_can\(p_org_id uuid, p_perm text\)/.test(sql),
    "★has_can(org_id, perm) が ある");
  t((sql.match(/create or replace function/g) || []).length === 1,
    "★作る 関数は 1つ だけ");

  console.log("\n② 飛び越え方");
  t(/security definer/.test(sql), "★security definer（★決まりを 飛び越える）");
  t(/set search_path = public, pg_temp/.test(sql), "★道を 固定して いる");
  t(/\bstable\b/.test(sql), "★stable（★行ごとに 引き直さない）");

  console.log("\n③ 見るのは 自分の 行だけ");
  t(/m\.user_id = auth\.uid\(\)/.test(sql), "★auth.uid() 自身の 行だけ");
  // ★★ほかの 方の 行へ 行く 道が 無いこと。
  t(!/user_id\s*<>\s*auth\.uid\(\)/.test(sql), "★ほかの 方を 見る 道が ない");
  t(!/p_user_id|target_user/.test(sql), "★誰かを 指す 引数が ない");

  console.log("\n④ role を 見て いないこと");
  // ★★関数の 中（$$ … $$）だけを 見ます。★⑤の 突き合わせには role が 出ます。
  const body = sql.slice(sql.indexOf("as $$"), sql.indexOf("$$;") + 3);
  t(!/\brole\b/.test(body), "★関数の 中に role が 無い");
  t(/org_posts/.test(body) && /perms/.test(body), "★役職の できことを 見て いる");

  console.log("\n⑤ 誰が 呼べるか");
  t(/revoke all on function public\.has_can\(uuid, text\) from anon;/.test(sql),
    "★anon から 剥がして いる");
  t(/revoke all on function public\.has_can\(uuid, text\) from public;/.test(sql),
    "★public からも 剥がして いる");
  t(/grant execute on function public\.has_can\(uuid, text\) to authenticated;/.test(sql),
    "★ログイン済みの 方には 渡して いる");
  // ★★revoke が grant より 先に 書いて あること。
  t(sql.indexOf("revoke all on function") < sql.indexOf("grant execute on function"),
    "★revoke が 先（★空く 時間を 作らない）");

  console.log("\n⑥ 切り替えて いないこと（★第1段）");
  // ★★この 台本は 決まりを 1つも 触りません。
  t(!/create policy|drop policy|alter policy/.test(sql), "★決まりを 触って いない");
  t(!/alter table/.test(sql), "★表を 触って いない");

  console.log("\n⑦ できことの 名前が そろって いること");
  const src = fs.readFileSync(path.join(__dirname, "..", "..", "lib", "opsPerms.js"), "utf-8");
  const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
  // ★★⑤の 突き合わせに 並べた 名前が、★lib の 一覧に ある こと。
  const listed = [...sql.matchAll(/when '([a-z_]+)'\s+then/g)].map((x) => x[1]);
  t(listed.length > 0, "★突き合わせに 名前が 並んで いる（" + listed.length + "）");
  const unknown = listed.filter((k) => !m.PERM_KEYS.includes(k));
  t(unknown.length === 0, "★知らない 名前が 無い" + (unknown.length ? "（" + unknown.join("／") + "）" : ""));
  // ★★学校ぜんぶに かかる ものが、★ぜんぶ 並んで いること。
  const wide = m.PERMS.filter((p) => p.schoolWide).map((p) => p.key);
  const missing = wide.filter((k) => !listed.includes(k));
  t(missing.length === 0,
    "★学校ぜんぶに かかる ものが そろって いる" + (missing.length ? "（★抜け " + missing.join("／") + "）" : ""));

  console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
  process.exit(ng === 0 ? 0 : 1);
})();
