#!/usr/bin/env node
// STRIP: B（文言）── ★画面に 出る 字 そのものが 的 です。
/**
 * ★通報の 字と 画面の 見張り（★裁定 その121 Q2・その125・2026-09-21）。
 *
 *   ★★★守りたいのは 4つ ──
 *     ★① 6つの わけが、★見本・画面・台帳 で **同じ** で ある
 *     ★② 「お名前は お伝えしません」が 先頭 近くに 在る
 *     ★③ 止まった 方への 字に、★わけ も お返事の 口 も 無い
 *     ★④ 画面が `matching_cuts` を 自分で 作って いない（★台帳の 引き金が 作る）
 *
 *   ★★較正 ── ★故意に 1件 該当を 作り、★見つける ことを 確かめます。
 */
const fs = require("fs");
const path = require("path");
const { stripComments, readRaw } = require("./_source");
const ROOT = path.join(__dirname, "..", "..");
let pass = 0, fail = 0;
function t(c, label) {
  if (c) { console.log(`  ✓ ${label}`); pass++; } else { console.log(`  ✗ ${label}`); fail++; }
}
/** ★止まった 方への 字に、★わけ らしき ものが 混ざって いないか。 */
function わけを書いている(字) {
  return /しつこく|関係のない 話|ほかの ところ|お金の こと|こわい 思い/.test(字);
}
/** ★お返事の 口を 置いて いないか。 */
function 返事の口(字) {
  return /お返事(を)?\s*(ください|お待ち|いただけ)|異議|申し立て|弁明/.test(字);
}

function main() {
  const libRaw = fs.readFileSync(path.join(ROOT, "lib", "matchingReport.js"), "utf-8");
  const lib = stripComments(libRaw);
  const jsx = stripComments(readRaw("components", "MatchingReport.jsx"));
  const sqlR = stripComments(fs.readFileSync(path.join(ROOT, "supabase", "migration_matching_reports.sql"), "utf-8"));
  const sqlC = stripComments(fs.readFileSync(path.join(ROOT, "supabase", "migration_reported_cut.sql"), "utf-8"));
  const 見本 = fs.readFileSync(path.join(ROOT, "docs/design/pack-final/00-動く見本-iPhoneで開く用.html"), "utf-8");

  console.log("=== 一 ★6つの わけ（★見本・画面・台帳 が 同じ） ===");
  const 鍵 = [...lib.matchAll(/key:\s*"(\w+)"/g)].map((m) => m[1]);
  t(鍵.length === 6, `★lib に 6つ（いま ${鍵.length}）`);
  鍵.forEach((k) => t(new RegExp(`'${k}'`).test(sqlR), `★台帳の 縛りに ${k} が ある`));
  // ★★見本の 字と、★lib の 字が 同じ こと。
  const 字 = [...lib.matchAll(/label:\s*tx\("([^"]+)"\)/g)].map((m) => m[1]);
  t(字.length === 6, "★lib に 字が 6つ");
  字.forEach((s) => t(見本.indexOf(s) >= 0, `★見本に「${s}」が ある`));

  console.log("=== 二 ★お名前を お伝えしない、が 先頭 近くに ===");
  t(/TOP_BOLD = tx\("お名前は、相手に お伝えしません。"\)/.test(lib),
    "★太くする 1行が「お名前は…」で ある");
  const 上 = (lib.match(/TOP_LINES = Object\.freeze\(\[([\s\S]*?)\]\)/) || ["", ""])[1];
  t(上.indexOf("お名前は") >= 0, "★上の 断りに 入って いる");
  t((上.match(/tx\(/g) || []).length === 3, "★上の 断りは 3行");

  console.log("=== 三 ★止まった 方への 字（★裁定 その125 確定） ===");
  const 知 = (lib.match(/SUSPENDED_NOTICE = Object\.freeze\(\[([\s\S]*?)\]\)/) || ["", ""])[1];
  t(知.length > 0, "SUSPENDED_NOTICE が ある");
  t(!わけを書いている(知), "★わけを 書いて いない（★通報した 方が 絞れない）");
  t(!返事の口(知), "★お返事の 口を 置いて いない");
  t(/お返事を いただく 必要も ありません/.test(知), "★「お返事は 要りません」と 言って いる");
  t(/記録・ノート・ひつじは、そのままです/.test(知), "★記録・ノート・ひつじは 変わらない と 言って いる");
  t(/いったん 止めました/.test(知), "★止めた ことを 伝えて いる");

  console.log("=== 四 ★画面が 切りの 行を 作って いない（★裁定 その125） ===");
  t(!/matching_cuts/.test(jsx), "★画面が matching_cuts に 触れて いない");
  t(!/matching_cuts/.test(lib), "★lib も matching_cuts に 触れて いない");
  t(/create trigger matching_report_cut/.test(sqlC), "★台帳の 引き金が 作る");
  t(/'reported'/.test(sqlC), "★種は reported");
  t(/on conflict \(user_id, target_user_id, kind\) do nothing/.test(sqlC),
    "★2度 作らない");
  // ★★`restored` で 消さない こと ── ★消す 式が どこにも 無い こと。
  t(!/delete from public\.matching_cuts/.test(sqlC + sqlR),
    "★台帳の どこにも、★切りを 消す 式が 無い");

  console.log("=== 五 ★字を 画面に 書き写して いない ===");
  ["こわい 思いを した", "お名前は、相手に お伝えしません。", "お知らせする"]
    .forEach((s) => t(jsx.indexOf(s) < 0, `★画面に「${s}」を 直書きして いない`));
  t(/from "@\/lib\/matchingReport"/.test(jsx), "★字は lib から 取って いる");

  console.log("=== 六 ★出る 道が ある ===");
  t(/onClose/.test(jsx) && /もどる/.test(jsx), "★戻る 札が ある");
  t(!/<ScreenHead[^>]*onBack=/.test(jsx),
    "★ScreenHead に onBack を 渡して いない（★受け取らない 引数 です）");

  console.log("=== 七 ★較正（★故意に 1件 作る） ===");
  t(わけを書いている("しつこく 連絡が 来た、と お知らせが ありました"),
    "★わけが 混ざった 字を 見つける");
  t(!わけを書いている("お知らせを いただきました。こちらで 拝見します。"),
    "★確定の 字では 当たらない");
  t(返事の口("ご異議が あれば お知らせください"), "★弁明の 口を 見つける");
  t(!返事の口("お返事を いただく 必要も ありません。"), "★「要りません」では 当たらない");

  console.log(`\n${pass} 通り ／ ${fail} 落ち`);
  if (fail > 0) process.exit(1);
}

main();
