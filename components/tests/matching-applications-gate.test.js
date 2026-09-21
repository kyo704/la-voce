#!/usr/bin/env node
// STRIP: A（振る舞い）── ★列と 門の 形を 見ます。
/**
 * ★応募（applications）の 見張り（★裁定 その94 §4・その121・その122・2026-09-21）。
 *
 *   ★★★いちばん 守りたいのは「自由文の 列を 持たない」こと です。
 *     ★★画面で 止めて いるのでは ありません。★列が 無い から 通りません。
 *     ★★列が 1つ 増えた 日に、★この 見張りが 落ちます。
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

/** ★自由に 書ける 列が あるか。 */
function 自由文の列(表) {
  return /^\s*(body|message|text|comment|note|memo|free_\w+)\s+text/m.test(表);
}
/** ★画面や lib が、★応募の 表を 直に 引いて いないか。 */
function 直に引く(src) {
  const code = stripComments(src);
  // ★★★裁定 その122 が 言うのは「**引かない**」です（2026-09-21 に 直しました）。
  //   ★★出す（insert）のは 別 です。★門（RLS）が 在籍と 募集の 学校を 見ます。
  //   ★★`postings` の 見張りでも 同じ 直しを しました。
  return /from\(\s*["'`]applications["'`]\s*\)\s*\n?\s*\.select\(/.test(code);
}

function main() {
  const raw = fs.readFileSync(path.join(ROOT, "supabase", "migration_applications.sql"), "utf-8");
  const sql = stripComments(raw);
  const 表 = (sql.match(/create table if not exists public\.applications\s*\(([\s\S]*?)\n\);/) || ["", ""])[1];

  console.log("=== 一 ★自由文を 持たない（★裁定 その94 §4） ===");
  t(表.length > 0, "表が ある");
  t(!自由文の列(表), "★自由に 書ける 列が 1つも 無い");
  t(/template_key text not null/.test(表), "★ことばは 名（template_key）で 持つ");
  // ★★送れる ことばは 3つ だけ（★見本 TPL_B ＋ TPL_B_SODAN）。
  const 選 = (sql.match(/template_key in \(([^)]*)\)/) || ["", ""])[1];
  t(/'ukeraremasu'/.test(選) && /'kyokumoku_kikitai'/.test(選) && /'orei_sodan'/.test(選),
    "★3つ だけ を 許して いる");
  t((選.match(/'/g) || []).length === 6, `★4つ目が 増えて いない（いま ${(選.match(/'/g) || []).length / 2} つ）`);

  console.log("=== 二 ★出さない ものを 列に して いない（★§4g・§7） ===");
  for (const 名 of ["start_time", "end_time", "venue", "place", "time", "age", "grade",
    "enrollment_year", "birthdate", "phone", "address"]) {
    t(!new RegExp(`^\\s*${名}\\s`, "m").test(表), `★${名} の 列が 無い`);
  }
  t(/available_days date\[\]/.test(表), "来られる のは 日 だけ");

  console.log("=== 三 ★門 ===");
  const 決 = sql.match(/create policy "[^"]+" on public\.applications\s+for (\w+)/g) || [];
  const 種 = 決.map((x) => (x.match(/for (\w+)/) || [])[1]);
  t(["select", "insert", "update", "delete"].every((k) => 種.includes(k)), "4本 ある");
  t(!種.includes("all"), "★for all を 書いて いない");
  t(!/using\s*\(\s*true\s*\)/i.test(sql), "★using(true) を 書いて いない");
  t((sql.match(/auth\.uid\(\) = applicant_user_id/g) || []).length >= 5,
    "★どの 門も 応募した ご本人 だけ");
  t(!/owner_user_id/.test(sql.slice(sql.indexOf("create policy"), sql.indexOf("revoke all on public.applications"))),
    "★募集の 持ち主に 門を 開けて いない（★関数を 通します）");

  console.log("=== 四 ★権限 ===");
  const r = sql.indexOf("revoke all on public.applications");
  const g = sql.indexOf("grant select (");
  t(r >= 0 && g > r, "★取り上げが、★名指しより 先に ある");
  t(!/grant update \([^)]*template_key/.test(sql), "★ことばを 書き換えられない");

  console.log("=== 五 ★関数（★裁定 その122） ===");
  for (const 名 of ["get_applications", "get_my_applications", "get_my_postings"]) {
    const f = (sql.match(new RegExp(`create or replace function public\\.${名}[\\s\\S]*?\\$\\$;`)) || [""])[0];
    t(f.length > 0, `${名} が ある`);
    t(/security definer/.test(f), `${名} … security definer`);
    t(/set search_path = public, pg_temp/.test(f), `${名} … search_path 固定`);
    t(!/select\s+\*/i.test(f), `${名} … select * を 書いて いない`);
    t(/matching_visible/.test(f), `${名} … 切れて いない ことで 絞って いる`);
    t(/auth\.uid\(\)/.test(f), `${名} … ご本人で 絞って いる`);
  }
  // ★★応募の 一覧は、★その 募集の 持ち主 だけ。
  const ga = (sql.match(/create or replace function public\.get_applications[\s\S]*?\$\$;/) || [""])[0];
  t(/p\.owner_user_id = auth\.uid\(\)/.test(ga), "★応募の 一覧は 募集の 持ち主 だけ");
  t(/a\.status <> 'withdrawn'/.test(ga), "★取り下げた ものを 返さない");
  // ★★数は、★見えない ものを 数えない。
  const gp = (sql.match(/create or replace function public\.get_my_postings[\s\S]*?\$\$;/) || [""])[0];
  t(/application_count/.test(sql) || /count\(\*\)::integer/.test(gp), "★応募の 数を 返す");
  t(/a\.status <> 'withdrawn'/.test(gp) && /matching_visible/.test(gp),
    "★数は、★取り下げた ものと 切れた 相手を 数えない");

  console.log("=== 六 ★画面が 直に 引いて いない ===");
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
  const あたり = 見る.filter((p) => 直に引く(fs.readFileSync(p, "utf-8")));
  t(あたり.length === 0,
    `★画面と lib が applications を 直に 引いて いない（${あたり.map((x) => path.relative(ROOT, x)).join(" ")}）`);

  console.log("=== 七 ★較正（★故意に 1件 作る） ===");
  t(自由文の列("  id uuid,\n  body text not null,\n"), "★body text を 見つける");
  t(自由文の列("  message text,\n"), "★message text を 見つける");
  t(!自由文の列("  template_key text not null,\n"), "★template_key では 当たらない");
  t(!自由文の列("  status text not null default 'sent',\n"), "★status では 当たらない");
  t(直に引く('await sb.from("applications").select("id")'), "★直に 引く 書き方を 見つける");
  t(!直に引く('await sb.from("applications").insert({ posting_id: id })'),
    "★出す 書き方では 当たらない（★門が 見ます）");
  t(!直に引く('await sb.rpc("get_applications", { p_posting_id: id })'), "★関数を 呼ぶ 形は 当たらない");

  console.log(`\n${pass} 通り ／ ${fail} 落ち`);
  if (fail > 0) process.exit(1);
}

main();
