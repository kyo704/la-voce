// ============================================================================
// ★見張り ── ★押しどころを、★負の 余白で 縮めない（★2026-09-18・実機の ご報告）
//
//   ★★★坂本さんの 実機で、★札が 箱の 外に はみ出して いました。
//     ★★題は 10.5px、★札は 44px（★押しどころの 下限）。
//     ★★その 差を `marginTop: -10 / marginBottom: -10` で **打ち消して** いました。
//   ★★★負の 余白は「場所を 詰める」もの では ありません。
//     ★★描く 大きさは 44px の まま です。★上下に はみ出します。
//     ★★箱の 内側の 余白が 小さい と、★枠を 越えます。
//
//   ★★直し方 ── ★行そのものを 44px に します。★打ち消しません。
//     ★★1行 ぶん 高く なります。★はみ出すより よい こと です。
//
//   ★★★この 見張りは、★同じ 形が 戻って こない ように する もの です。
//     ★★1px・2px の 寄せ（`marginTop: -1` など）は 咎めません。
//     ★★咎めるのは ── ★**押しどころ と 同じ 塊の 中の、★大きな 負の 余白**。
// ============================================================================

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { readCode } = require("./_source");

const ROOT = path.join(__dirname, "..");
const 画面たち = fs.readdirSync(path.join(ROOT))
  .filter((f) => f.endsWith(".jsx"));

let 数 = 0;
function ok(cond, 名) {
  数 += 1;
  assert.ok(cond, "★落ちました ── " + 名);
  console.log("  ok  " + 名);
}

// ★★★較正 ── ★わざと 作った 1件を 見つけられるか。
//   ★★本物の 欠けを 目印に しません（★直した 日に 止まります）。
function 咎める(src) {
  const 見つけた = [];
  // ★★`{ … }` の 塊ごとに 見ます。★同じ 塊に 両方 あるか。
  const 塊 = src.match(/\{[^{}]*\}/g) || [];
  塊.forEach((b) => {
    const 負 = /margin(Top|Bottom):\s*-(\d+)/.exec(b);
    if (!負) return;
    if (Number(負[2]) < 4) return;           // ★1〜3px の 寄せは 咎めません
    if (!/minHeight:\s*(SPACE\.tapMin|4[4-9]|[5-9]\d)/.test(b)) return;
    見つけた.push(b.replace(/\s+/g, " ").slice(0, 90));
  });
  return 見つけた;
}

ok(咎める('{ marginTop: -10, minHeight: SPACE.tapMin, padding: "0 10px" }').length === 1,
  "★較正 ── わざと 作った 1件を 見つける");
ok(咎める('{ marginTop: -1, minHeight: SPACE.tapMin }').length === 0,
  "★較正 ── 1px の 寄せは 咎めない");
ok(咎める('{ marginTop: -10, fontSize: 12 }').length === 0,
  "★較正 ── 押しどころで なければ 咎めない");

const 当たり = [];
画面たち.forEach((f) => {
  咎める(readCode("components", f)).forEach((b) => 当たり.push(f + " … " + b));
});
ok(当たり.length === 0,
  "押しどころを 負の 余白で 縮めて いない"
  + (当たり.length ? "\n　　" + 当たり.join("\n　　") : ""));

console.log("\n★" + 数 + "件 通りました ── 押しどころと 負の 余白");
