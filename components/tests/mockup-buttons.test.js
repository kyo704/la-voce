#!/usr/bin/env node
// STRIP: B（見える 字）
// ============================================================================
// ★★★見本の ボタンは、★書いて ある ところへ 行く
//
//   ★出どころ 2026-09-23（design-v36）──
//     ★「下書きを 作って、香盤表へ」と 書いて あるのに、★配役へ 行く 形が ありました。
//     ★★坂本さんが 実際に 触って 見つけられました。
//     ★★★機械で 先に 見つけられる 型 です。
//
//   ★★中で 動かして いるのは `tools/button_check.py` です（★Opus の 道具）。
//     ★ここは その 道具を **必ず 走らせる** ための 入れ物 です。
//     ★★手で 走らせる 道具は、★走らせ忘れます。
//
//   ★★★見つからない ときも 赤に します ──
//     ★playwright が 無い ／ 見本が 無い ／ 押せる所 0 ── ★どれも「静かに 緑」に しません。
//     ★（★2026-09-23、★この 家で 6本の 見張りが「何も 見て いないのに 緑」でした）
//
//   ★★出どころの 見本 …… woolsong-2026-09-21_8.zip（★2026-09-23 展開）
//     ／ docs/design/pack-final/
// ============================================================================
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
let 落ち = 0;
function t(cond, label) {
  if (cond) console.log("  ok   " + label);
  else { console.log("  NG   " + label); 落ち++; }
}

// ★★押せる所が ある 見本（★「個人」は 押せる所 0 なので 外します）
const 見本 = [
  "00-動く見本-PC・iPad（運営）.html",
  "00-動く見本-iPhoneで開く用.html",
  "00-動く見本（さわれる・全画面）.html"
];

console.log("① 道具そのもの");
// ★★★道具は **見本と 同じ 棚** に 置きます（`docs/design/pack-final/tools/`）。
//   ★`tools/` に 写すと、★次の zip で 見本 だけ 新しく なり、★道具が 古い まま 残ります。
//   ★★（★この 家の くり返す 不具合 ── ★同じ ものが 2か所に あって、片方だけ 動く）
//   ★★★あちらの 道具は `PACK = dirname(tools/)` を 前提に して います。
//     ★見本の 隣に ある とき **だけ** 正しく 走ります。
const 道具 = path.join(ROOT, "docs", "design", "pack-final", "tools", "button_check.py");
t(fs.existsSync(道具), "★`tools/button_check.py` が ある");
let 自 = "";
try { 自 = execFileSync("python3", [道具, "--selftest"], { encoding: "utf8" }); } catch (e) { 自 = String(e.stdout || e); }
t(/SELFTEST PASS/.test(自), "★道具の 自己試験が 通る");
// ★★★「自己試験が PASS」だけ では 足りません。
//   ★中身を 骨抜きに しても、★PASS の 字は 出ます（★2026-09-23 に 試して 分かりました）。
//   ★★★だから **本物の 見本を わざと 壊して**、★赤に なる ことを 毎回 見ます。
//     ★見つけない 道具は、★世の中が きれいなのでは なく、★壊れて いる のかも しれません。

{
  const 元 = path.join(ROOT, "docs", "design", "pack-final", 見本[0]);
  if (fs.existsSync(元)) {
    const 写 = path.join(require("os").tmpdir(), "button_check_calib.html");
    const 中 = fs.readFileSync(元, "utf8");
    const 印 = "push(\\'置ける枠\\'";
    t(中.includes(印), "★壊す ところが 見本に ある（" + 印 + "）");
    fs.writeFileSync(写, 中.split(印).join("push(\\'★ありえない画面\\'"));
    let 出 = "", 落 = false;
    try { execFileSync("python3", [道具, 写], { encoding: "utf8", cwd: ROOT }); }
    catch (e) { 出 = String(e.stdout || ""); 落 = true; }
    t(落 && /NG B1/.test(出), "★★わざと 壊した 見本で **赤に なる**（★道具が 生きて いる）");
    try { fs.unlinkSync(写); } catch (e) { /* ★残っても 害は ありません */ }
  } else {
    t(false, "★壊して 試す ための 見本が ない");
  }
}

console.log("\n② 見本が ある");
見本.forEach((f) => t(fs.existsSync(path.join(ROOT, "docs", "design", "pack-final", f)), "★" + f.slice(0, 22)));

console.log("\n③ 走らせる");
見本.forEach((f) => {
  const p = path.join(ROOT, "docs", "design", "pack-final", f);
  if (!fs.existsSync(p)) { t(false, "★" + f.slice(0, 22) + " ── 見本が ない"); return; }
  let 出 = "", 落 = false;
  try { 出 = execFileSync("python3", [道具, p], { encoding: "utf8", cwd: ROOT }); }
  catch (e) { 出 = String(e.stdout || ""); 落 = true; }
  // ★★「押せる所 0」は、★通ったのでは なく **見て いない** です。
  const m = 出.match(/押せる所\s+(\d+)/);
  const 数 = m ? Number(m[1]) : -1;
  t(数 > 0, "★" + f.slice(0, 22) + " ── 押せる所を 数えられた（" + 数 + "）");
  const NG = 出.split("\n").filter((l) => l.trim().startsWith("NG"));
  t(!落 && NG.length === 0, "★" + f.slice(0, 22) + " ── 行き先が 合って いる"
    + (NG.length ? "（" + NG[0].trim().slice(0, 80) + "）" : ""));
});

console.log(落ち === 0 ? "\n★すべて 通りました" : "\n★" + 落ち + "件 落ちました");
process.exit(落ち === 0 ? 0 : 1);
