#!/usr/bin/env node

// ============================================================================
// 注記（.note）を 畳む ── ★見本の foldNotes と 同じ 形か
//
//   ★出どころ docs/design/pack-final/00-動く見本（さわれる・全画面）.html
//     の foldNotes(root)（★git hash 7c7c720）
//
//   ★★見本は、★描くたびに .note を すべて 畳んでいます。
//     ★はじめは 閉じている。★札は「くわしい 決まりを 見る」。
//     ★開くと「閉じる」に なる。
//
//   ★★これは 訂正の 見張りです。
//     ★★2026-09-11、★私は「見本に 畳む しくみは ない」と 報告しました。
//       ★<details>／<summary> を 数えて 0 だったからです。
//       ★★見本は JavaScript で 畳んでいました。★数え方が 誤っていました。
//     ★★同じ 誤りを 繰り返さない ための 見張りです。
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode } = require("./_source");

let ok = 0;
let ng = 0;
function t(cond, label) {
  if (cond) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label); ng++; }
}

const mihon = fs.readFileSync(path.join(__dirname, "..", "..",
  "docs", "design", "pack-final", "00-動く見本（さわれる・全画面）.html"), "utf8");
const ui = readCode("components", "UiV2.jsx");

console.log("① 見本の 側");
t(/function foldNotes\(root\)/.test(mihon), "★見本に foldNotes がある");
t(mihon.includes("b.textContent='くわしい 決まりを 見る'"),
  "★はじめの 札は「くわしい 決まりを 見る」");
t(mihon.includes("'くわしい 決まりを 見る':'閉じる'"), "★開くと「閉じる」");
t(/e\.style\.display='none'/.test(mihon), "★はじめは 閉じている");
// ★★<details> では ありません。★ここが 誤りの もとでした。
t(!/<details/.test(mihon), "★見本は <details> を 使っていない（★誤りの もと）");

console.log("\n② 実装の 側");
t(ui.includes('NOTE_OPEN = "くわしい 決まりを 見る"'), "★札の 字が 同じ");
t(ui.includes('NOTE_CLOSE = "閉じる"'), "★開いた ときの 字が 同じ");
t(/fold = true/.test(ui), "★はじめは 畳む");
t(/useState\(false\)/.test(ui), "★はじめは 閉じている");
t(/fold && !open \? "none"/.test(ui), "★閉じている あいだは 出さない");
// ★★ink3 を 小さい字に 使わない、★という この 帳面の 決まり。
t(!/inkFaint|ink3/.test(ui.split("export function Note")[1] || ""),
  "★札に ink3 を 使っていない");

console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
process.exit(ng === 0 ? 0 : 1);
