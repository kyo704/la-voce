#!/usr/bin/env node

// ============================================================================
// ★2つの 層を、★1つの 中で 混ぜない こと（★裁定 その55／その57）
//
//   ★★弁護士の 確認を 取らない と 決めました（★2026-09-14・坂本さん）。
//     ★★だから、★分けて ある ことを **機械で** 守ります。
//
//   ★★禁じる こと ── ★`entries`（体調）と、
//     ★`enrollments` ／ `memberships` ／ `org_*`（学校）を、
//     ★**1つの 問い・1つの 関数**で 一緒に 読む こと。
//
//   ★★なぜ これで 足りるか（★裁定 その55 の 言葉）──
//     ★★もし 突合の 読み方が 誤って いても、
//       ★「1つの 鍵で しまって いた」までで 留まります。
//       ★「混ぜた」には なりません。
//     ★★直せる 指摘と、★形が 壊れて いる ことの ちがいです。
//
//   ★★数えるのは `tools/layer_join_guard.py` です。
//     ★★この 見張りは、★それを 呼んで 落ちるかを 見ます。
// ============================================================================

const { execFileSync } = require("child_process");
const path = require("path");

let ok = 0;
let ng = 0;
const t = (c, l) => { if (c) { console.log("  ✓ " + l); ok++; } else { console.log("  ✗ " + l); ng++; } };

const ROOT = path.join(__dirname, "..", "..");
const TOOL = path.join(ROOT, "tools", "layer_join_guard.py");

console.log("① 層が 分かれて いること");
let out = "";
let code = 0;
try {
  out = execFileSync("python3", [TOOL], { cwd: ROOT, encoding: "utf8" });
} catch (e) {
  out = String((e.stdout || "") + (e.stderr || ""));
  code = e.status || 1;
}
if (code !== 0) {
  console.log(out.split("\n").filter((l) => l.includes("✗")).join("\n"));
}
t(code === 0, "★混ざって いる ところが ない");

console.log("\n② 数えた 中身");
const m1 = out.match(/★生きて いる 紙で 混ざって いる: (\d+)/);
const m2 = out.match(/★混ざって いる: (\d+)/g);
t(!!m1 && m1[1] === "0", "★台帳の 関数・ビュー 0");
t(!!m2, "★画面・サーバの 問いも 数えて いる");

console.log("\n③ 道具が 本当に 見つけられること（★校正）");
// ★★通る ことだけを 見ると、★何も 見て いない 道具でも 通ります。
//   ★★だから「わざと 混ぜた もの」を 見つけられるかを 確かめます。
//   ★★2026-09-11 の お決め ──
//     ★「道具は、★答えの 分かって いる ものに 当てて から 使う」。
const fs = require("fs");
const calDir = path.join(ROOT, "lib", "__cal_layer");
const calSql = path.join(ROOT, "supabase", "__cal_layer.sql");
fs.mkdirSync(calDir, { recursive: true });
fs.writeFileSync(path.join(calDir, "bad.js"),
  'export async function bad(s) {\n'
  + '  return s.from("entries").select("date, enrollments(grade_label)");\n}\n');
fs.writeFileSync(calSql,
  "create or replace function public.__cal_layer()\n"
  + "returns void language sql as $$\n"
  + "  select 1 from public.entries e join public.memberships m on m.user_id = e.user_id;\n$$;\n");
let calCode = 0;
let calOut = "";
try {
  calOut = execFileSync("python3", [TOOL], { cwd: ROOT, encoding: "utf8" });
} catch (e) {
  calOut = String(e.stdout || "");
  calCode = e.status || 1;
}
fs.rmSync(calDir, { recursive: true, force: true });
fs.rmSync(calSql, { force: true });
t(calCode !== 0, "★わざと 混ぜたら 落ちる");
t(/__cal_layer/.test(calOut), "★台帳の ほうを 名指しで 出す");
t(/__cal_layer\/bad\.js/.test(calOut), "★画面の ほうも 名指しで 出す");

console.log("\n④ のけて いる ところの わけ");
const tool = fs.readFileSync(TOOL, "utf8");
t(/ALLOWED_FILES/.test(tool), "★のける 並びが 1か所に ある");
t(/lib\/exportData\.js/.test(tool) && /lib\/accountDeletion\.js/.test(tool),
  "★書き出しと 退会は のけて いる");
t(/つなぎ合わせでは ありません/.test(tool), "★なぜ のけるかを 書いて いる");

console.log("\n★★この 見張りが 見て いない こと");
console.log("　★台帳に 直に 作った 関数は 見えません。★紙だけ です。\n" +
  "　★★これは 紙を 読みます。★SQLエディタで 直に 作った 関数は、\n" +
  "　★ここには 映りません。★台帳の 目録が、★もう 半分 です。\n" +
  "　★★倉庫の 24件／別名 18件 と、★目録の 20件 の 差は、★まさに それです。\n" +
  "　★どちらの 数も まちがって いません。★見て いる ものが 違います。");
console.log("　★2つの 問いの 結果を、★あとで JavaScript で つなぐ ことは 見えません。");

console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
process.exit(ng === 0 ? 0 : 1);
