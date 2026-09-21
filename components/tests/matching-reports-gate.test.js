#!/usr/bin/env node
// STRIP: A（振る舞い）── ★門・停止の 式を 見ます。
/**
 * ★通報（matching_reports）の 見張り（★裁定 その94 §6・その121 Q2・2026-09-21）。
 *
 *   ★★★守りたいのは 3つ ──
 *     ★① 通報した 方が 守られる（★相手は この 表を 1行も 読めない）
 *     ★② 1件で すぐ 止まる（★人が 見る まで 待たない）
 *     ★③ 期限つきの 停止を 作らない（★1か月後に 戻って こない）
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
/** ★期限つきの 停止らしき ものが 無いか（★§6 do_not）。 */
function 期限つき(sql) {
  return /suspend\w*_until|banned_until|expires_at|reinstate_at|interval\s+'\d+\s*(day|month)/i.test(sql);
}

function main() {
  const raw = fs.readFileSync(path.join(ROOT, "supabase", "migration_matching_reports.sql"), "utf-8");
  const sql = stripComments(raw);
  const 表 = (sql.match(/create table if not exists public\.matching_reports\s*\(([\s\S]*?)\n\);/) || ["", ""])[1];
  const 関数 = (名) => (sql.match(new RegExp(`create or replace function public\\.${名}[\\s\\S]*?\\$\\$;`)) || [""])[0];

  console.log("=== 一 ★通報した 方を 守る（★§6 protect_reporter） ===");
  const 決 = sql.match(/create policy "[^"]+" on public\.matching_reports\s+for (\w+)/g) || [];
  const 種 = 決.map((x) => (x.match(/for (\w+)/) || [])[1]);
  t(種.includes("select") && 種.includes("insert"), "読む・入れる の 2つ");
  t(!種.includes("update") && !種.includes("delete") && !種.includes("all"),
    "★書き換え・消す の 門が 無い（★出した 通報を 消せない）");
  t(!/target_user_id\s*=\s*auth\.uid\(\)/.test(sql),
    "★通報された 方に 門を 開けて いない（★1行も 読めない）");
  t((sql.match(/auth\.uid\(\) = reporter_user_id/g) || []).length >= 2,
    "★門は 通報した ご本人 だけ");
  // ★★拝見の 中身は、★通報した 方にも 渡しません。
  const g = (sql.match(/grant select \(([^)]*)\) *\n? *on public\.matching_reports/) || ["", ""])[1];
  t(g.length > 0 && !/outcome/.test(g) && !/review_note/.test(g) && !/reviewed_at/.test(g),
    "★拝見の 中身（outcome / review_note）を 渡して いない");
  t(!/grant\s+(update|delete)[^;]*matching_reports/.test(sql), "★update / delete を 渡して いない");
  const r = sql.indexOf("revoke all on public.matching_reports");
  const gi = sql.indexOf("grant select (");
  t(r >= 0 && gi > r, "★取り上げが、★名指しより 先に ある");

  console.log("=== 二 ★1件で すぐ 止まる（★§6 why_immediate） ===");
  const ms = 関数("matching_suspended");
  t(ms.length > 0, "matching_suspended が ある");
  t(/outcome is null/.test(ms), "★まだ 見て いない ものでも 止まって いる");
  t(/'banned'/.test(ms) && /'holding'/.test(ms), "★永久停止・判断つかず でも 止まって いる");
  t(!/count\(\*\)\s*>=?\s*[23]/.test(ms), "★2回・3回 待って いない");
  t(/revoke all on function public\.matching_suspended\(uuid\) from public, anon, authenticated/.test(sql),
    "★画面から 直に 呼べない");

  console.log("=== 三 ★期限つきの 停止を 作って いない（★§6 do_not） ===");
  t(!期限つき(sql), "★期限の 列も 仕掛けも 無い");
  t(!/suspend/i.test(表) || /^\s*outcome text/m.test(表),
    "★停止は 通報の 行から 導く（★別の 表を 持たない）");

  console.log("=== 四 ★除外の 1本に 足して いる（★裁定 その121 Q1） ===");
  const mv = 関数("matching_visible");
  t(mv.length > 0, "matching_visible を 直して いる");
  t(/matching_cuts/.test(mv), "★切りを 見て いる");
  t(/matching_reports/.test(mv), "★通報を 見て いる");
  t(/matching_suspended\(p_target\)/.test(mv), "★止まって いる 方を 外して いる（★Q8）");
  t(/revoke all on function public\.matching_visible\(uuid, uuid\) from public, anon, authenticated/.test(sql),
    "★execute を 渡して いない まま");

  console.log("=== 五 ★6つの わけ（★見本 SC['こまったこと']） ===");
  const 選 = (sql.match(/reason in \(([\s\S]*?)\)\)/) || ["", ""])[1];
  ["shitsukoku", "kankei_nai_hanashi", "hoka_de_renraku", "okane", "kowai", "sonohoka"]
    .forEach((k) => t(new RegExp(`'${k}'`).test(選), `★${k} が ある`));
  t((選.match(/'/g) || []).length === 12, `★6つ ちょうど（いま ${(選.match(/'/g) || []).length / 2} つ）`);
  // ★★ここだけ 自由に 書けます。★相手には 渡りません。★運営への ことば です。
  t(/^\s*detail text,/m.test(表), "★もう少し（detail）は 書かなくても よい");

  console.log("=== 六 ★較正（★故意に 1件 作る） ===");
  t(期限つき("banned_until timestamptz"), "★banned_until を 見つける");
  t(期限つき("set outcome = null where reviewed_at < now() - interval '1 month'"),
    "★1か月で 戻す 仕掛けを 見つける");
  t(!期限つき("outcome text, reviewed_at timestamptz"), "★拝見の 列では 当たらない");
  t(!期限つき("created_at timestamptz not null default now()"), "★created_at では 当たらない");

  console.log(`\n${pass} 通り ／ ${fail} 落ち`);
  if (fail > 0) process.exit(1);
}

main();
