#!/usr/bin/env node

// ============================================================================
// ★羊の おうち ── 実機の ご指摘 4件（★2026-09-14・坂本さん）
//
//   ① ながめるで「したく」と「配置を変える」が 重なる
//   ② したくへ 切り替わる カメラが 遅い
//   ③ 天井が 低く 感じる
//   ④ 家具の 当たり判定が 見た目より 狭い
//
//   ★★この 見張りは、★字を 読みます。★画面は 見て いません。
//     ★★見えかたは docs/design/compare/sheep-room/ の 絵で お確かめください。
//     ★★①の 重なりは、★測った 数から 出して います ──
//       したく（測り）　 x 280–374 ／ y 708–756（★position: fixed）
//       部屋の 箱（測り）上 139 ／ 高さ 634 → ★下端 773
//       配置を変える　　 bottom-2 right-2 なら y 737–765・右 382
//       → ★縦に 19px、★横は ほぼ 全部 重なります。
// ============================================================================

const { readCode, readRaw } = require("./_source");

let ok = 0;
let ng = 0;
function t(cond, label) {
  if (cond) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label); ng++; }
}

const ui = readRaw("components", "CharacterHome.jsx");
const stage = readCode("lib", "roomStage.js");
const sheep = readCode("lib", "sheepInteriorV2.js");
const cam = readCode("lib", "roomCamera.js");

console.log("① ★2つの ボタンが、同じ 隅に いないこと");

// ★「したく」は 画面に 貼りついて います（★右下・bottom 88）。
const vt = readRaw("components", "VocalTracker.jsx");
t(/position: "fixed", right: 16, bottom: 88/.test(vt),
  "★「したく」は 右下に 貼りついて いる（★測り x280-374 / y708-756）");

// ★だから「配置を変える」は、★右下に 置けません。
const arrangeRight = (ui.match(/absolute bottom-2 right-2 text-xs/g) || []).length;
const arrangeLeft = (ui.match(/absolute bottom-2 left-2 text-xs/g) || []).length;
t(arrangeRight === 0, "★「配置を変える」が 右下に いない（★" + arrangeRight + " 件）");
t(arrangeLeft === 2, "★2か所 とも 左下（★部屋と 庭・" + arrangeLeft + " 件）");

console.log("\n② ★切り替えの 速さ");

t(/export const ROOM_SWITCH_MS/.test(cam), "★切り替えの 秒数は lib が 持つ");
t(/walkMs: camSwitching \? ROOM_SWITCH_MS : WALK_MS/.test(ui),
  "★追う ときは WALK_MS、★切り替えは ROOM_SWITCH_MS");
// ★★描いて いる 最中に 決めて いること。
//   ★★useEffect で 決めると、★最初の 1枚が 古い 秒数の まま です。
//     ★★2026-09-14、★実際に そう なりました（★2843ms の まま）。
t(/camModeRef\.current !== camMode && !camSwitching/.test(ui),
  "★切り替えは 描く 最中に 見分けて いる（★effect では ない）");
t(!/camSwitchAtRef|Date\.now\(\) - cam/.test(ui),
  "★描く 最中に Date.now\\(\\) を 読んで いない（★hydration が 壊れます）");

console.log("\n③ ★天井 ── 余りの 分け方");

t(/export const STAGE_BLEED_TOP_RATIO/.test(stage), "★分け方は lib が 持つ");
t(/export function stageOffsetY/.test(stage), "★ずらす 量も lib が 持つ");
// ★★`stageBleed` と 舞台の 置き場所が、★同じ 比から 出て いること。
//   ★★別々に 計算すると、★色の 帯と 舞台の 上端が ずれます。
//     ★★それが この 倉庫の 持病の 形です（★同じ 決めが 2か所）。
t(/stageOffsetY\(roomBoxW, roomBoxH, STAGE_ASPECT\)/.test(ui),
  "★画面は stageOffsetY を 通して いる");
t(!/\(h - f\.h\) \/ 2/.test(stage), "★半分ずつ の 直書きが 残って いない");
{
  const m = stage.match(/STAGE_BLEED_TOP_RATIO = ([\d.]+)/);
  const r = m ? Number(m[1]) : null;
  t(r !== null && r > 0.5 && r <= 0.75,
    "★上に 多く 配って いる（★0.5 より 大きく 0.75 以下・★いま " + r + "）");
}

console.log("\n④ ★掴める ところ");

t(/export const GRAB_PAD_PX/.test(sheep), "★広げる 量は lib が 持つ");
t(/export const EDIT_OUTLINE_INSET_PX/.test(sheep), "★点線の 外への はみ出しも lib が 持つ");
t(/inset: -EDIT_OUTLINE_INSET_PX/.test(ui), "★点線が lib の 数を 使って いる");
t(/inset: -GRAB_PAD_PX/.test(ui), "★掴める 板が lib の 数を 使って いる");
t(!/inset: -4,/.test(ui), "★-4 の 直書きが 残って いない");
{
  // ★★掴める ところは、★点線より **外** で ある こと。
  //   ★★内側だと、★見えて いる 枠の 中なのに 掴めない 帯が 残ります。
  //     ★★それが、★この ご指摘 そのもの でした。
  const g = Number((sheep.match(/GRAB_PAD_PX = (\d+)/) || [])[1]);
  const o = Number((sheep.match(/EDIT_OUTLINE_INSET_PX = (\d+)/) || [])[1]);
  t(g > o, "★掴める ところが、★点線より 外に ある（★掴 " + g + " > 点 " + o + "）");
  t(g - o >= 6, "★少なくとも 6px は 外（★指の 腹の ぶん・★いま " + (g - o) + "）");
}
// ★★透明な 板が、★「うごかす」の あいだ だけ 出ること。
//   ★★いつも 出して いると、★ながめる ときに 羊や 窓を 押しにくく なります。
t(/\{editMode && \(\s*<div aria-hidden="true" style=\{\{ position: "absolute", inset: -GRAB_PAD_PX/.test(ui),
  "★掴める 板は「うごかす」の あいだ だけ");

console.log("\n⑤ ★この 見張りが 見て いない こと");
console.log("　★重なりも、★天井の 高さも、★指で 掴める かも、★字では 分かりません。");
console.log("　★★docs/design/compare/sheep-room/ の 絵と、★実機で お確かめください。");
console.log("　★★④は、★試しの 口座に 家具が 1つも 無く、★動かして 確かめて いません。");

console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
process.exit(ng === 0 ? 0 : 1);
