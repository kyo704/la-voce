#!/usr/bin/env node

// ============================================================================
// ★2つの 層を 混ぜて いないこと ── ★3つの 面（★2026-09-15）
//
//   ★出どころ 裁定 その55 ／ その57（★Opus・坂本さん 承認）
//
//   ★★弁護士の 確認を **取らない** と お決めに なりました。
//     ★★これは その 代わりの 守り です。★機械で 守ります。
//
//   ★★線（★その57 が その55 を **狭めました**）
//     ✕ ★記録の 層 × 学務の 層 ── ★1つの まとまりの 中で
//     ○ ★学務どうし ── ★自由（★学年別の 出席率・請求人数・空きコマ すべて ○）
//     ○ ★記録どうし ── ★自由（★本人が 登録した 本番 × entries も ○）
//     ○ ★本人の その他 × 学務 ── ★自由（★お名前を 引く など・★要る 仕事）
//
//   ★★この 見張りは、★道具が **本当に 見つけられる** ことも 確かめます。
//     ★★わざと 混ぜて、★落ちる ことを 見ます。
//     ★★1度も 落ちた ことの ない 見張りは、★働くか 分かりません。
// ============================================================================

const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const TOOL = path.join(ROOT, "tools", "layer_join_guard.py");
const TABLES = path.join(ROOT, "tools", "layer_tables.py");

let ok = 0;
let ng = 0;
function t(cond, label) {
  if (cond) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label); ng++; }
}

function run() {
  try {
    return { code: 0, out: execFileSync("python3", [TOOL],
      { cwd: ROOT, encoding: "utf8" }) };
  } catch (e) {
    return { code: e.status, out: (e.stdout || "") + (e.stderr || "") };
  }
}

console.log("① 層が 分かれて いること");
const r = run();
const bad = (r.out.match(/★★★混ざって いる（★✕）: (\d+)/) || [])[1];
t(bad === "0", "★混ざって いる ところが ない（★" + bad + "）");
t(r.code === 0, "★道具が 0 で 終わる");

console.log("\n② 3つの 面 すべてを 見て いること");
t(/① 倉庫の SQL/.test(r.out), "★① 倉庫の SQL");
t(/② ★台帳の 関数・ビュー/.test(r.out), "★② 台帳の 関数（★紙では 見えない もの）");
t(/③ 画面・サーバ/.test(r.out), "★③ 画面・サーバ");
// ★★台帳の 書き出しが 無い ときは、★「見て いない」と 言う こと。
const catalog = path.join(ROOT, "docs", "reports", "_catalog-functions.json");
if (!fs.existsSync(catalog)) {
  t(/②[\s\S]{0,200}★★見て いません/.test(r.out),
    "★書き出しが 無い とき、★『見て いない』と 言う（★『通った』と 言わない）");
} else {
  t(/★読んだ 関数・ビュー: \d+/.test(r.out), "★台帳を 読んで いる");
}

console.log("\n③ ★道具が 本当に 見つけられること（★校正）");
// ★★わざと 混ぜた 紙を 置いて、★落ちる ことを 見ます。
const bait = path.join(ROOT, "supabase", "_layer_join_bait.sql");
fs.writeFileSync(bait,
  "create or replace function public._bait_mix() returns int language sql as $$\n" +
  "  select count(*) from public.entries e join public.enrollments n" +
  "    on n.student_id = e.user_id;\n$$;\n", "utf8");
const r2 = run();
fs.unlinkSync(bait);
t(/_bait_mix/.test(r2.out), "★わざと 混ぜたら 名指しで 出る");
t(r2.code !== 0, "★わざと 混ぜたら 落ちる");

// ★★画面の 側でも 同じ ことを 確かめます。
const baitJs = path.join(ROOT, "lib", "_layerBait.js");
fs.writeFileSync(baitJs,
  'export function bait(supabase) {\n' +
  '  return supabase.from("entries").select("*, org:enrollments(*)");\n}\n', "utf8");
const r3 = run();
fs.unlinkSync(baitJs);
t(/_layerBait\.js/.test(r3.out), "★画面の 側でも 名指しで 出る");
t(r3.code !== 0, "★画面の 側でも 落ちる");

console.log("\n④ ★広すぎないこと（★これが いちばん 大事）");
// ★★Opus ──「if the guard flags any of these, it is wrong. fix the guard」
//   ★★学務どうしは、★どの 組み合わせでも 通る こと。
const okBait = path.join(ROOT, "lib", "_layerOkBait.js");
fs.writeFileSync(okBait,
  'export function a(s) {\n' +
  '  return s.from("enrollments").select("*, attendance(*)");\n}\n' +
  'export function b(s) {\n' +
  '  return s.from("memberships").select("*, org_posts(*)");\n}\n' +
  'export function c(s) {\n' +
  '  return s.from("profiles").select("*, memberships(*)");\n}\n', "utf8");
const r4 = run();
fs.unlinkSync(okBait);
t(!/_layerOkBait\.js/.test(r4.out), "★学務どうし・お名前引きは 通る（★止めない）");
t(r4.code === 0, "★通した まま 0 で 終わる");

console.log("\n⑤ ★表の 一覧は 1か所 だけ");
t(fs.existsSync(TABLES), "★tools/layer_tables.py が ある");
const tbl = fs.readFileSync(TABLES, "utf8");
t(/^HEALTH = \{/m.test(tbl) && /^ORG = \{/m.test(tbl),
  "★記録の 層と 学務の 層が、★そこに ある");
t(/^PERSONAL_OTHER = \{/m.test(tbl),
  "★『本人の その他』を 分けて いる（★広すぎない ため）");
t(/^UNDECIDED = \{/m.test(tbl), "★未決の 表を 置く ところが ある");
// ★★道具の 側に 表の 名前を 書き写して いないこと。
const tool = fs.readFileSync(TOOL, "utf8");
t(!/"enrollments"|"memberships"|"org_events"/.test(tool),
  "★道具に 表の 名前を 書き写して いない");
t(/★どの 層にも 載って いない 表: 0/.test(r.out) || /★どの 層にも 載って いない 表/.test(r.out),
  "★未知の 表を 報告する（★当てずっぽうで 決めない）");

console.log("\n⑥ ★この 見張りが 見て いない こと");
console.log("　★2つの 問いの 結果を、★あとで JavaScript で 結ぶ ことは 見えません。");
console.log("　★台帳の 書き出しが 無ければ、★②は 見て いません。");
console.log("　★組み立てて 作る 問い（動的SQL）は 見えません。");

console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
process.exit(ng === 0 ? 0 : 1);
