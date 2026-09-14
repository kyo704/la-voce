#!/usr/bin/env node

// ============================================================================
// ★数えるだけの ために、★値を 運ばない（★No.019.5・裁定 その61）
//
//   ★出どころ 2026-09-14、★Opus。
//     ★★本番の x-vercel-id を 測ったところ、
//       ★静的 hnd1（東京）／★関数 iad1（米国バージニア）でした。
//     ★★保管は 東京でも、★関数は 日本の 外で 動いて います。
//
//   ★★見張る ことは 2つ です。
//     ① ★台帳に 数えさせる 道が、★古い 道より ★先に あること
//     ② ★台帳の 鍵と、★画面の 鍵が ★ぴたり 合って いること
//
//   ★★②が 本題です。
//     ★`countOf("environment", ...)` は、★鍵が 無ければ `|| 0` で 0 を 返します。
//     ★★つまり、★名前が ずれると ★0% と 出ます。★落ちません。★黙ります。
//     ★★黙って 0 に なるのが、★いちばん 気づけない 形です。
// ============================================================================

const { readCode, readRaw } = require("./_source");

let ok = 0;
let ng = 0;
function t(cond, label) {
  if (cond) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label); ng++; }
}
function eq(a, b, label) {
  const x = JSON.stringify(a), y = JSON.stringify(b);
  if (x === y) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label + "\n      台帳 " + y + "\n      画面 " + x); ng++; }
}

const admin = readRaw("app", "admin", "page.js");
const unlock = readRaw("app", "api", "character", "unlock", "route.js");
const sql = readRaw("supabase", "migration_no019_5_entry_stats.sql");

console.log("① ★台帳に 数えさせる 道が、★先に あること");

// ★★rpc の 呼び出しが、★12列の 取得より 前に ある こと。
//   ★★逆だと、★紙が 流れて いても 毎回 運んで しまいます。
const rpcAt = admin.indexOf('admin.rpc("admin_entry_stats")');
const bigSelectAt = admin.indexOf("weight_kg, body_fat_pct, meals");
t(rpcAt > -1, "★admin_entry_stats を 呼んで いる");
t(bigSelectAt > -1, "★古い 道を 残して いる（★紙が まだの とき用）");
t(rpcAt > -1 && bigSelectAt > -1 && rpcAt < bigSelectAt,
  "★rpc の ほうが 先");
// ★★古い 道が「紙が 無い ときだけ」で ある こと。
t(/if \(!entryStats\) \{/.test(admin),
  "★古い 道は `if (!entryStats)` の 中だけ");

const uRpcAt = unlock.indexOf('admin.rpc("character_unlock_summary"');
const uStarAt = unlock.indexOf('.select("*")');
t(uRpcAt > -1, "★character_unlock_summary を 呼んで いる");
t(uRpcAt > -1 && uStarAt > -1 && uRpcAt < uStarAt, "★unlock も rpc が 先");
t(/if \(!sumRow\) \{/.test(unlock), "★unlock の 古い 道も 門の 中だけ");

console.log("\n② ★台帳の 鍵と、★画面の 鍵が 合って いること");

// ★台帳の 鍵 … jsonb_build_object の 'fill' の 中の 'xxx',
const fillBlock = sql.slice(sql.indexOf("'fill', ("), sql.indexOf("-- ★第2部"));
const sqlKeys = [...fillBlock.matchAll(/^\s*'([a-z_]+)',$/gm)].map((m) => m[1]).sort();
// ★画面の 鍵 … countOf("xxx", ...)
const jsKeys = [...admin.matchAll(/countOf\("([a-z_]+)"/g)].map((m) => m[1]).sort();

t(sqlKeys.length === 9, "★台帳の 鍵は 9つ（★実際 " + sqlKeys.length + "）");
t(jsKeys.length === 9, "★画面の 鍵は 9つ（★実際 " + jsKeys.length + "）");
eq(jsKeys, sqlKeys, "★9つの 鍵が ぴたり 合う");

// ★★unlock の 3つも 同じ ように。
const uSqlKeys = [...sql.matchAll(/^\s*'(performances|hasPianissimo|fieldKinds)',/gm)]
  .map((m) => m[1]).sort();
const uJsKeys = [...unlock.matchAll(/sumRow\.([A-Za-z]+)/g)]
  .map((m) => m[1]).filter((k) => k !== "ok").sort();
eq([...new Set(uJsKeys)], [...new Set(uSqlKeys)], "★unlock の 3つの 鍵も 合う");

console.log("\n③ ★同じ 決めを 2か所に 置いて いないこと");

// ★★goalPartOf を 書き写して いないこと。
t(/goalPartOf\(prof\)/.test(unlock), "★goalPartOf を 呼んで いる");
t(!/hasGoal:\s*typeof/.test(unlock), "★goalPartOf の 中身を 書き写して いない");
t(/export function goalPartOf/.test(readCode("lib", "character.js")),
  "★lib/character.js が goalPartOf を 出して いる");

console.log("\n④ ★権限 ── 数を 返す 関数は、利用者に 渡さないこと");

// ★★人を またいで 数える ものです。★anon にも authenticated にも 渡しません。
["admin_entry_stats()", "character_unlock_summary(uuid)"].forEach((fn) => {
  const re = new RegExp("revoke all on function public\\." +
    fn.replace(/[()]/g, "\\$&") + " from public, anon, authenticated;");
  t(re.test(sql), "★" + fn + " を anon・authenticated から 取り上げて いる");
  const g = new RegExp("grant execute on function public\\." +
    fn.replace(/[()]/g, "\\$&") + " to service_role;");
  t(g.test(sql), "★" + fn + " は service_role だけ");
});

// ★★取り上げが 先に ある こと（★広い ほうが 黙って 勝つ ため）。
t(sql.indexOf("revoke all on function public.admin_entry_stats()")
  < sql.indexOf("grant execute on function public.admin_entry_stats()"),
  "★revoke が grant より 先");

console.log("\n⑤ ★この 見張りが 見て いない こと");
console.log("　★台帳の 条件と 画面の 条件が、★同じ 数を 出すかは 見て いません。");
console.log("　★★鍵の 名前が 合う ことだけ です。★数の 一致は、");
console.log("　★紙の 第3部・第4部を 流して、★目で 見くらべて ください。");

console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
process.exit(ng === 0 ? 0 : 1);
