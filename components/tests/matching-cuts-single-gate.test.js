#!/usr/bin/env node
/**
 * ★切る（matching_cuts）の 見張り（★裁定 その121 STEP0・2026-09-21）。
 *
 *   ★★★いちばん 守りたいのは VERIFY Q4 ──「除外が 関数 1本に 集まって いる」。
 *     ★★1か所でも 自前で 除外を 書くと、★そこだけ 漏れます。
 *     ★★漏れた ところに、★切った 相手が 出ます。★取り返しが つきません。
 *
 *   ★★この 見張りは **数を 覚えません**。★構えを 見ます ──
 *     ★① 台帳の 決まりが「ご本人 だけ」で ある
 *     ★② `update` の 決まりが 無い
 *     ★③ 関数が **双方向** を 見て いる
 *     ★④ `security definer` に `search_path` が 留めて ある
 *     ★⑤ 画面・`lib` が `matching_cuts` を 直に 触って いない
 *
 *   ★★較正 ── ★故意に 1件 該当を 作り、★見つける ことを 確かめます。
 */
const fs = require("fs");
const path = require("path");
const { stripComments } = require("./_source");
const ROOT = path.join(__dirname, "..", "..");
let pass = 0, fail = 0;
function t(c, label) {
  if (c) { console.log(`  ✓ ${label}`); pass++; } else { console.log(`  ✗ ${label}`); fail++; }
}

/** ★自前の 除外を 書いて いないか（★VERIFY Q4）。 */
function 自前の除外(src) {
  const code = stripComments(src);
  // ★`matching_cuts` を 直に 引く ／ 自分で 除外の 並びを 作る。
  return /matching_cuts/.test(code)
    || /\bcuts\b[^\n]{0,40}\.(?:includes|has|some|find)\(/.test(code);
}

function main() {
  const sqlRaw = fs.readFileSync(path.join(ROOT, "supabase", "migration_matching_cuts.sql"), "utf-8");
  const sql = stripComments(sqlRaw);

  console.log("=== 一 ★台帳の 門（★裁定 その94 §5） ===");
  t(/create table if not exists public\.matching_cuts/.test(sql), "表を 作って いる");
  t(/enable row level security/.test(sql), "門が 立って いる");
  const 決まり = sql.match(/create policy "[^"]+" on public\.matching_cuts\s+for (\w+)/g) || [];
  const 種 = 決まり.map((x) => (x.match(/for (\w+)/) || [])[1]);
  t(種.includes("select") && 種.includes("insert") && 種.includes("delete"),
    "読む・入れる・消す の 3つが ある");
  t(!種.includes("update") && !種.includes("all"), "★書き換えの 門が 無い");
  t(!/using\s*\(\s*true\s*\)/i.test(sql), "★using(true) を 書いて いない");
  // ★★門は どれも「ご本人 だけ」。★相手側から 引けません。
  const ごほんにん = (sql.match(/auth\.uid\(\) = user_id/g) || []).length;
  t(ごほんにん >= 3, `どの 門も ご本人 だけ（${ごほんにん}か所）`);
  t(!/target_user_id\s*=\s*auth\.uid\(\)/.test(sql),
    "★切られた 側に 門を 開けて いない（★Q3）");
  // ★★運営・教師の 門を 1つも 作って いない。
  t(!/is_org_owner|has_can|teacher_student_links|memberships/.test(sql),
    "★運営・教師の 門が 1つも 無い");

  console.log("=== 二 ★除外の 式（★VERIFY Q1・Q4） ===");
  const 関数 = (sql.match(/create or replace function public\.matching_visible[\s\S]*?\$\$;/) || [""])[0];
  t(関数.length > 0, "matching_visible が 1本 ある");
  t((sql.match(/create or replace function public\.matching_visible/g) || []).length === 1,
    "★除外の 関数は 1本 だけ");
  // ★★双方向 ── ★どちら向きの 行も 見て いる こと。
  t(/user_id = p_viewer and target_user_id = p_target/.test(関数)
    && /user_id = p_target and target_user_id = p_viewer/.test(関数),
    "★双方向を 見て いる（★裁定 その94 §5-2）");
  t(/security definer/.test(関数), "security definer で ある");
  t(/set search_path = public, pg_temp/.test(関数), "★search_path を 留めて いる");
  t(/revoke all on function public\.matching_visible/.test(sql),
    "★execute を まだ 渡して いない（★覗き穴に しない）");

  console.log("=== 三 ★権限（★2026-09-19 の 学び） ===");
  const r = sql.indexOf("revoke all on public.matching_cuts");
  const g = sql.indexOf("grant select (");
  t(r >= 0 && g > r, "★取り上げが、★名指しより 先に ある");
  t(!/grant\s+update/.test(sql), "★update を 渡して いない");

  console.log("=== 四 ★自前の 除外が 無い（★VERIFY Q4） ===");
  const 見る = [];
  for (const dir of ["lib", "components", "app"]) {
    const walk = (d) => {
      for (const n of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, n.name);
        if (n.isDirectory()) { if (n.name !== "tests" && n.name !== "node_modules") walk(p); }
        else if (/\.(js|jsx)$/.test(n.name)) 見る.push(p);
      }
    };
    walk(path.join(ROOT, dir));
  }
  const あたり = 見る.filter((p) => 自前の除外(fs.readFileSync(p, "utf-8")));
  t(あたり.length === 0,
    `★画面と lib が matching_cuts を 直に 触って いない（${あたり.map((x) => path.relative(ROOT, x)).join(" ")}）`);

  console.log("=== 五 ★較正（★故意に 1件 作る） ===");
  t(自前の除外('const rows = await sb.from("matching_cuts").select("user_id");'),
    "★自前で 表を 引く 書き方を 見つける");
  t(自前の除外("const 出 = list.filter((x) => !cuts.includes(x.user_id));"),
    "★自前で 並びから 除く 書き方を 見つける");
  t(!自前の除外("const 出 = await sb.rpc('matching_visible', { p_target: id });"),
    "★関数を 呼ぶ 書き方は 見つけない");
  t(!自前の除外("// matching_cuts の ことは ここに 書いて あります"),
    "★説明の 中の 字では 当たらない");

  console.log(`\n${pass} 通り ／ ${fail} 落ち`);
  if (fail > 0) process.exit(1);
}

main();
