#!/usr/bin/env node
// STRIP: A（振る舞い）
// ============================================================================
// ★★★裁定で 決めた 表示が、★実装に 残って いるか（★裁定179 §3）
//
//   ★中身は `tools/display_guard.py` に あります。★ここでは 呼ぶだけ です。
//   ★★裁定179 は「release_check の 中で 走らせる」と 書いて います。
//     ★★`release_check.py` は Opus の 手元の 道具 で、★この 家に ありません。
//     ★★★だから、★いつも 走る ところ（★見張りの 束）に 置きます。
//       ★置かないと、★作った 日だけ 走って、★次の 日から 誰も 呼びません。
//
//   ★★当たり合わせも 道具の 側に あります（`--selftest`）。★ここで 一緒に 走らせます。
// ============================================================================
const { spawnSync } = require("child_process");
const path = require("path");

const 道 = path.join(__dirname, "..", "..", "tools", "display_guard.py");

function 走る(引) {
  const r = spawnSync("python3", [道, ...引], { encoding: "utf8" });
  return { code: r.status, out: (r.stdout || "") + (r.stderr || "") };
}

let 落ち = 0;
const 自 = 走る(["--selftest"]);
console.log(自.out.trim());
if (自.code !== 0) { console.log("  NG   ★当たり合わせが 通りません"); 落ち++; }
else console.log("  ok   ★当たり合わせが 通りました");

const 本 = 走る([]);
console.log(本.out.trim());
if (本.code !== 0) { console.log("  NG   ★裁定の 表示が 守られて いません"); 落ち++; }
else console.log("  ok   ★裁定の 表示は ぜんぶ 残って います");

console.log(落ち === 0 ? "\n★すべて 通りました" : "\n★" + 落ち + "件 落ちました");
process.exit(落ち === 0 ? 0 : 1);
