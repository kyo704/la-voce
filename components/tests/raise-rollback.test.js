#!/usr/bin/env node
// STRIP: A（振る舞い）── ★取り消される 書き込みを さがします。
/**
 * ★数える 表に 書いた あと `raise` を して いない（★2026-09-26・sql/104）。
 *
 *   ★★★出どころ ── ★本番で 守りが **一度も 効いて いません** でした。
 *     ★`join_koen_by_code` は、★合言葉の 打ち間違いを `code_attempts` に 記録し、
 *       ★その あと `raise exception` して いました。
 *     ★★`raise` は **直前の insert も 取り消します**。
 *       ★★本番で 数えました ── ★失敗 3回 → `code_attempts` **0行**。
 *       ★★だから「直近15分で 10回 失敗したら 断る」が 働いて いませんでした。
 *
 *   ★★★道具は Opus が 作った `tools/raise_rollback_lint.py` です。
 *     ★★この 見張りは ★その 道具を **必ず 走らせる** ため に あります。
 *       ★★道具は、★呼ばれなければ 何も 守りません。
 *     ★★較正 ── ★道具が 見つけた ときに 落ちる こと を 見ます（★下）。
 */
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..", "..");
let pass = 0, fail = 0;
function t(c, label) {
  if (c) { console.log(`  ✓ ${label}`); pass++; } else { console.log(`  ✗ ${label}`); fail++; }
}

const 道具 = path.join(ROOT, "tools", "raise_rollback_lint.py");
t(fs.existsSync(道具), "★道具が ある");

// ★★★道具の 既定は `sql` という 名の 折 です。★この 蔵には ありません。
//   ★★★だから 何も 読まずに「OK」と 出ます ── ★それは 守りでは ありません。
//     ★★2026-09-26 に 較正で 気づきました。★折を 名ざしで 渡します。
const 折 = ["supabase/opus", "supabase"];
function 走る(d) {
  try {
    return execFileSync("python3", [道具, d], { cwd: ROOT, encoding: "utf-8" });
  } catch (e) {
    return String((e && (e.stdout || e.message)) || "");
  }
}
折.forEach((d) => {
  // ★★読む 紙が 1枚も 無ければ、★「OK」は 意味を 持ちません。
  const 数 = fs.readdirSync(path.join(ROOT, d)).filter((f) => f.endsWith(".sql")).length;
  t(数 > 0, `★${d} に SQL が ある（${数} 枚）`);
  const 出 = 走る(d);
  console.log(出.split("\n").filter((x) => x.trim()).map((x) => "     " + x).join("\n"));
  t(/RESULT: OK/.test(出), `★${d} …… 取り消される 書き込みが 無い`);
});

// ★★較正 ── ★わざと 1件 作った 紙を 道具に 見せます。
const 仮 = path.join(ROOT, "supabase", "opus", "_calibration_raise.sql");
fs.writeFileSync(仮, [
  "create or replace function public.zzz_calib() returns void language plpgsql as $$",
  "begin",
  "  insert into public.code_attempts(code_hash, ip_hash) values ('x','y');",
  "  raise exception 'NOPE';",
  "end $$;"
].join("\n"), "utf-8");
const 較 = 走る("supabase/opus");
fs.unlinkSync(仮);
t(!/RESULT: OK/.test(較) || /zzz_calib|code_attempts/.test(較),
  "★較正 ── ★わざと 作った 1件を 道具が 見つける");

console.log(`\n${pass} 通り ／ ${fail} 落ち`);
if (fail) process.exit(1);
