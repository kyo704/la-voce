#!/usr/bin/env node
// STRIP: A（振る舞い）── ★列と 門の 形を 見ます。
/**
 * ★ことばの 往復（application_messages）と、★残り 3本の 関数の 見張り
 *   （★裁定 その94 §4c・§4e・その121・その122・2026-09-21）。
 *
 *   ★★★守りたいのは 3つ ──
 *     ★① 自由文の 列を 持たない（★曲の 名は データ。★書いた 文では ない）
 *     ★② 応募者の 詳細が、★ご本人の 選びに 従う（`show_*`）
 *     ★③ 年齢・学年・門下を、★どの 道にも 載せない（★§7）
 *
 *   ★★較正 ── ★故意に 1件 該当を 作り、★見つける ことを 確かめます。
 */
const fs = require("fs");
const path = require("path");
const { stripComments , readsTable } = require("./_source");
const ROOT = path.join(__dirname, "..", "..");
let pass = 0, fail = 0;
function t(c, label) {
  if (c) { console.log(`  ✓ ${label}`); pass++; } else { console.log(`  ✗ ${label}`); fail++; }
}
function 自由文の列(表) {
  return /^\s*(body|message|text|comment|note|memo|free_\w+)\s+text/m.test(表);
}
function 直に引く(src) {
  // ★★★2026-09-21、★1か所に 集めました（★`_source.js` の `readsTable`）。
  //   ★★同じ 直しを 4枚で しました。★4度目 です（★台帳 08-10）。
  //   ★★裁定 その122 が 言うのは「引かない」です。★書くのは 門が 見ます。
  return readsTable(src, "application_messages");
}


function main() {
  const raw = fs.readFileSync(path.join(ROOT, "supabase", "migration_application_messages.sql"), "utf-8");
  const sql = stripComments(raw);
  const 表 = (sql.match(/create table if not exists public\.application_messages\s*\(([\s\S]*?)\n\);/) || ["", ""])[1];
  const 関数 = (名) => (sql.match(new RegExp(`create or replace function public\\.${名}[\\s\\S]*?\\$\\$;`)) || [""])[0];

  console.log("=== 一 ★自由文を 持たない（★§4c） ===");
  t(表.length > 0, "表が ある");
  t(!自由文の列(表), "★自由に 書ける 列が 1つも 無い");
  t(/pieces text\[\]/.test(表), "★曲の 名は 並び（pieces）で 持つ");
  const 選 = (sql.match(/template_key in \(([^)]*)\)/) || ["", ""])[1];
  t(/'kyokumoku_kotae'/.test(選) && /'kyokumoku_kore_kara'/.test(選) && /'toujitsu_made_ni'/.test(選),
    "★返せる ことばは 見本の 3つ");
  t((選.match(/'/g) || []).length === 6, `★4つ目が 増えて いない（いま ${(選.match(/'/g) || []).length / 2} つ）`);
  // ★★曲の 名を 返す ときだけ 並びを 持つ。★そのほかで 持たない。
  t(/kyokumoku_kotae' and array_length\(pieces, 1\) >= 1/.test(sql)
    && /pieces is null/.test(sql), "★ことばと 並びの 組み合わせを 台帳で 縛って いる");

  console.log("=== 二 ★門 ===");
  const 決 = sql.match(/create policy "[^"]+" on public\.application_messages\s+for (\w+)/g) || [];
  const 種 = 決.map((x) => (x.match(/for (\w+)/) || [])[1]);
  t(種.includes("select") && 種.includes("insert") && 種.includes("delete"), "読む・入れる・消す の 3つ");
  t(!種.includes("update") && !種.includes("all"), "★送った ことばを 書き換える 門が 無い");
  t(!/grant\s+update[^;]*application_messages/.test(sql), "★update を 渡して いない");
  t(!/using\s*\(\s*true\s*\)/i.test(sql), "★using(true) を 書いて いない");
  t((sql.match(/auth\.uid\(\) = sender_user_id/g) || []).length >= 3, "★どの 門も 送った ご本人 だけ");
  const r = sql.indexOf("revoke all on public.application_messages");
  const g = sql.indexOf("grant select (id, application_id");
  t(r >= 0 && g > r, "★取り上げが、★名指しより 先に ある");

  console.log("=== 三 ★2人だけ の 判じ（application_party） ===");
  const ap = 関数("application_party");
  t(ap.length > 0, "application_party が ある");
  t(/security definer/.test(ap) && /set search_path = public, pg_temp/.test(ap),
    "★security definer ＋ search_path 固定");
  t(/a\.applicant_user_id = auth\.uid\(\) or p\.owner_user_id = auth\.uid\(\)/.test(ap),
    "★応募した 方 か 募集の 持ち主 だけ");
  t(/matching_visible\(a\.applicant_user_id, p\.owner_user_id\)/.test(ap),
    "★切れて いれば どちらも 通さない");
  t(/revoke all on function public\.application_party\(uuid\) from public, anon, authenticated/.test(sql),
    "★画面から 直に 呼べない（★覗き穴に しない）");

  console.log("=== 四 ★3本の 関数（★裁定 その122 CAUTION） ===");
  for (const 名 of ["get_posting_detail", "get_applicant_detail", "get_messages"]) {
    const f = 関数(名);
    t(f.length > 0, `${名} が ある`);
    t(/security definer/.test(f), `${名} … security definer`);
    t(/set search_path = public, pg_temp/.test(f), `${名} … search_path 固定`);
    t(!/select\s+\*/i.test(f), `${名} … select * を 書いて いない`);
    t(/auth\.uid\(\)/.test(f) || /application_party/.test(f), `${名} … ご本人で 絞って いる`);
    t(/matching_visible|application_party/.test(f), `${名} … 切れて いない ことで 絞って いる`);
    t(new RegExp(`grant execute on function public\\.${名}\\(uuid\\) to authenticated`).test(sql),
      `${名} … 画面から 呼べる`);
    t(new RegExp(`revoke all on function public\\.${名}\\(uuid\\) from public, anon`).test(sql),
      `${名} … anon には 渡して いない`);
  }

  console.log("=== 五 ★出さない ものを 出して いない（★§4g・§7） ===");
  const pd = 関数("get_posting_detail");
  for (const 名 of ["start_time", "end_time", "venue", "place"]) {
    t(!new RegExp(`\\b${名}\\b`).test(pd), `★募集の 詳細に ${名} が 無い`);
  }
  t(/p\.owner_user_id <> auth\.uid\(\)/.test(pd), "★自分の 募集は 詳細でも 返さない（★裁定 その123）");
  const ad = 関数("get_applicant_detail");
  for (const 名 of ["age", "grade", "enrollment_year", "birthdate", "monka", "teacher_id"]) {
    t(!new RegExp(`\\b${名}\\b`).test(ad), `★応募者の 詳細に ${名} が 無い`);
  }
  // ★★ご本人の 選びに 従う こと。★3つ とも。
  t(/case when a\.show_career then/.test(ad), "★経歴は show_career に 従う");
  t(/case when a\.show_recordings then/.test(ad), "★録画は show_recordings に 従う");
  t(/case when a\.show_repertoire then/.test(ad), "★曲は show_repertoire に 従う");
  t(/p\.owner_user_id = auth\.uid\(\)/.test(ad), "★見るのは 募集の 持ち主 だけ");

  console.log("=== 六 ★はじめの ことばを 2か所に 置いて いない ===");
  const gm = 関数("get_messages");
  t(/from public\.applications a/.test(gm) && /union all/.test(gm),
    "★はじめの 1つは applications から 束ねて いる（★写して いない）");

  console.log("=== 七 ★画面が 直に 引いて いない ===");
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
  t(あたり.length === 0, `★画面と lib が 直に 引いて いない（${あたり.map((x) => path.relative(ROOT, x)).join(" ")}）`);

  console.log("=== 八 ★較正（★故意に 1件 作る） ===");
  t(自由文の列("  body text not null,\n"), "★body text を 見つける");
  t(!自由文の列("  pieces text[],\n"), "★pieces では 当たらない");
  t(!自由文の列("  template_key text not null,\n"), "★template_key では 当たらない");
  t(直に引く('await sb.from("application_messages").select("id")'), "★直に 引く 形を 見つける");
  t(!直に引く('await sb.from("application_messages").insert({ pieces: x })'),
    "★出す 形では 当たらない（★門が 3つ 見ます）");
  t(!直に引く('await sb.rpc("get_messages", { p_application_id: id })'), "★関数を 呼ぶ 形は 当たらない");
  t(/select\s+\*/i.test("select * from applications"), "★select * を 見つける 目が 働いて いる");

  console.log(`\n${pass} 通り ／ ${fail} 落ち`);
  if (fail > 0) process.exit(1);
}

main();
