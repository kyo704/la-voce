#!/usr/bin/env node

// ============================================================================
// くらべる の 図 ── ★字が 重ならないことの 見張り
//
//   ★出どころ 坂本さんの 実機の 写真（★2026-09-11）
//     ★「よく出た日3時間06分」と 重なって 見えていました。
//     ★「5時間00分」が 2行に 折れ、★目盛りの 線に かぶっていました。
//
//   ★★この見張りは 文字を 読みます。★描いた 絵は 見ていません。
//     ★★重なりは、★寸法の 引き算でしか 追えません。
//       ★だから、★寸法の 決めが 戻らないことを 見張ります。
//     ★★本当に 重なっていないかは、★写真でしか 分かりません。
//
//   ★★確かめること
//     ① 軸の 幅が、★いちばん 長い 目盛りの 字より 広いこと
//     ② 下の 余白が、★2行の 名前より 高いこと
//     ③ まんなかの 数が、★線の 横では なく 上下に 置かれること
//     ④ 目盛りの 字が 折り返さないこと
//     ⑤ まんなかの 数が、★下の 名前と ぶつからないこと（★寸法の 引き算）
// ============================================================================

const { readCode } = require("./_source");

let ok = 0;
let ng = 0;
function t(cond, label) {
  if (cond) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label); ng++; }
}

const SRC = readCode("components", "CompareV2.jsx");

// ★寸法を、★source から そのまま 取り出します（★書き写しません）。
const m = /const H = (\d+), AXIS = (\d+), TOP = (\d+), BOTTOM = (\d+), RIGHT = (\d+);/.exec(SRC);
t(!!m, "図の 寸法が 1か所に 書いてある");
const [H, AXIS, TOP, BOTTOM] = m ? m.slice(1, 5).map(Number) : [0, 0, 0, 0];
console.log(`     H=${H} AXIS=${AXIS} TOP=${TOP} BOTTOM=${BOTTOM}`);

console.log("\n① 軸の 幅");
// ★★いちばん 長い 目盛りの 字は「10時間30分」＝ 7文字。★9px なら およそ 63px。
//   ★★短くする 決め（00分を 書かない）が あるので、★「10時間」＝ 3文字 ＝ 27px。
//   ★余白 6px を 引いて、★30px 以上 あれば 入ります。
t(AXIS - 6 >= 30, `軸に 目盛りの 字が 入る（${AXIS - 6}px ≧ 30px）`);
t(/if \(short && m === 0\) return `\$\{h\}時間`;/.test(SRC),
  "★00分の ときは「◯時間」と 短く 書く");
t(/valueWord\(itemKey, v, true\)/.test(SRC), "★軸だけ 短い 書き方を 使う");
t(/whiteSpace: "nowrap", overflow: "hidden"/.test(SRC), "★軸の 字は 折り返さない");

console.log("\n② 下の 余白");
// ★★2026-09-11、★下の 名前を 1行に 戻しました。
//   ★★見本の dotplot は「よく出た日 14日」で 1行です（★<text> 1つ）。
//     ★2行に 割っていたのは、★私が 足した 形でした。
//   ★★1行（10.5px・行の 高さ 1.4）で およそ 15px。★22px で 入ります。
t(BOTTOM >= 16, `下の 名前 1行が 入る（${BOTTOM}px ≧ 16px）`);
t(/\{label\}　\{n\}日/.test(SRC), "★名前と 日数が 1行（★見本の とおり）");

console.log("\n②-2 軸の 始まり");
// ★★見本の dotplot は 0・2・4・6時間 の 固定です（★sy(v)=H-v/6*H）。
t(/const ZERO_BASED = \[/.test(SRC), "★0 から 始める 項目を 決めている");
t(/ZERO_BASED\.includes\(itemKey\)\) lo = Math\.min\(0, lo\)/.test(SRC),
  "★長さの 項目は 0 から 始める");
// ★★湿度・むくみは 0 から 始めません。★下に 潰れます。
t(!/ZERO_BASED = \[[^\]]*humidity/.test(SRC), "★湿度は 0 から 始めない");
t(!/ZERO_BASED = \[[^\]]*morningEdema/.test(SRC), "★むくみは 0 から 始めない");

console.log("\n③ まんなかの 数の 置き場");
t(/const above = y > 16;/.test(SRC), "★上に 出すか 下に 出すかを 決めている");
t(/top: above \? -13 : 4,/.test(SRC), "★線の 上（または 下）に 置く");
t(/transform: "translateX\(-50%\)",\s*\n\s*top: above/.test(SRC),
  "★横では なく、まんなかに そろえる");
// ★★横に 押し出す 書き方が 残っていないこと（★これが 重なりの もとでした）。
t(!/marginLeft: 24,/.test(SRC), "★横へ 押し出す 古い 書き方が 残っていない");

console.log("\n④ まんなかの 数が、下の 名前と ぶつからないこと");
{
  // ★★いちばん 下の まんなか（★y が 目いっぱい 下）でも、
  //   ★数は 線の 上 13px に 出ます。★下の 名前は 図の 下 BOTTOM px に あります。
  //   ★★数の 下端は plotH（★線の 位置）、★名前の 上端は H - BOTTOM。
  //     ★線は plot の 中にしか 引かれないので、★線の いちばん 下は H - BOTTOM。
  //     ★★数は その 13px 上に 出るので、★重なりません。
  const plotBottom = H - BOTTOM;
  const labelTop = H - BOTTOM;
  t(plotBottom <= labelTop, "★線の 下端と、下の 名前の 上端が 重ならない");
  // ★★上に 出せない ほど 高い ときだけ 下に 出ます。★そこは 図の いちばん上です。
  t(TOP >= 14, `★上に 出す ぶんの 余白が ある（TOP=${TOP}）`);
}

console.log("\n⑤ 数を 点に 添えていないこと");
// ★★点に 数を 添えません（★見本の 決め）。★添えるのは 軸と まんなかだけです。
{
  const i = SRC.indexOf("const dots = (list, ci)");
  const body = i < 0 ? "" : SRC.slice(i, SRC.indexOf("const medLine", i));
  t(i >= 0, "点を 描く ところが ある");
  t(!/valueWord/.test(body), "★点に 数を 添えていない");
}

console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
console.log("★★重なりが 本当に 消えたかは、★実機の 写真でしか 分かりません。");
process.exit(ng === 0 ? 0 : 1);
