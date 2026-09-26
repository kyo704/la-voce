#!/usr/bin/env node
// STRIP: A（振る舞い）── ★手（フック）が 置かれて いるか を 見ます。
/**
 * ★直す たびに 見張りが ひとりでに 走る 仕掛けが、★まだ ある か（★較正③・2026-09-26）。
 *
 *   ★★★なぜ 見張るか ── ★仕掛けそのものが、★いちばん 静かに 消えます。
 *     ★`.githooks/` を 消しても、★走れ なく しても、★何も 赤に なりません。
 *     ★★そして「走らせるのを 忘れる」ところへ 戻ります。★それが 元の 痛み でした。
 *
 *   ★★見る もの ── ①手が 2つ とも ある ②走れる ③中身を 持って いない
 *     （★判じは `tools/hook_guard.py` が 1つ だけ 持ちます）④その 道具の 較正が 通る。
 *
 *   ★★較正 ── ★`tools/hook_guard.py --selftest` が、★わざと 落ちる 1件 を
 *     ★自分で 仕込んで 見つけます。★そこが 通らなければ ここも 通りません。
 */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..", "..");
let 数 = 0, 落 = 0;
const t = (名, ok, 註) => {
  数 += 1; if (!ok) 落 += 1;
  console.log(`  ${ok ? "✓" : "✗"} ${名}${註 ? "  -- " + 註 : ""}`);
};

console.log("=== 一 手が 置いて ある ===");
for (const h of ["pre-commit", "pre-push"]) {
  const p = path.join(ROOT, ".githooks", h);
  const ある = fs.existsSync(p);
  t(`★.githooks/${h} が ある`, ある);
  if (!ある) continue;
  const st = fs.statSync(p);
  t(`★.githooks/${h} は 走れる`, (st.mode & 0o111) !== 0, "mode " + (st.mode & 0o777).toString(8));
  const 中 = fs.readFileSync(p, "utf8");
  t(`★.githooks/${h} は 道具を 呼ぶ だけ`, /tools\/hook_guard\.py/.test(中));
  // ★★★手の 中に 判じを 書かせません（★台帳 08-1 ── ★同じ 判じが 2つに なると、
  //   ★片方 だけ 直されて ずれます）。★呼ぶ 行と 註 だけ の 短さ を 見ます。
  const 実 = 中.split("\n").filter((l) => l.trim() && !l.trim().startsWith("#"));
  t(`★.githooks/${h} に 判じを 書いて いない`, 実.length <= 2, `${実.length} 行`);
}

console.log("\n=== 二 道具が 自分の 較正を 通る ===");
let 出 = "", rc = 0;
try {
  出 = execFileSync("python3", [path.join(ROOT, "tools/hook_guard.py"), "--selftest"],
    { encoding: "utf8", cwd: ROOT });
} catch (e) { 出 = String((e.stdout || "") + (e.stderr || "")); rc = e.status == null ? 1 : e.status; }
t("★hook_guard.py --selftest が 通る", rc === 0 && /SELFTEST PASS/.test(出),
  (出.trim().split("\n").slice(-1)[0] || "").slice(0, 90));

console.log("\n=== 三 重い ものを commit の 前に 置いて いない ===");
const 道具 = fs.readFileSync(path.join(ROOT, "tools/hook_guard.py"), "utf8");
const commit段 = (道具.match(/def commit段\(\):[\s\S]*?\n\n\ndef /) || [""])[0];
t("★commit の 前に 見張り 一式（8分）を 置いて いない", !/検_見張り一式/.test(commit段));
t("★commit の 前に 骨組み くらべ（ブラウザ）を 置いて いない", !/検_dom/.test(commit段));
const push段 = (道具.match(/def push段\([\s\S]*?\n\n\n/) || [""])[0];
t("★push の 前に 見張り 一式が ある", /検_見張り一式/.test(push段));

console.log(`\n  ${数 - 落} / ${数}`);
process.exit(落 ? 1 : 0);
