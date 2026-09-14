#!/usr/bin/env node

// ============================================================================
// ★部屋の 比は、★1か所で 決める（★2026-09-13）
//
//   ★出どころ 実機の ご報告 ──
//     「ながめる」と「したく」で、★同じ 家具の 位置が ずれて 見える。
//
//   ★★InteriorLayer に `ROOM_ASPECT = 4 / 3` が 決め打ちで ありました。
//     ★★部屋の 比は 3通り あります ──
//       ★ふつう 4/3 ／ ★広い 背景 7/5 ／ ★全画面（端末しだい）
//     ★★合うのは 1つ だけ。★残り 2つで 足もとが ずれます。
//
//   ★★同じ 決めごとが 2か所に ある 形です。★測った 値を 渡す ように しました。
// ============================================================================

const { readCode, readRaw } = require("./_source");

let ok = 0;
let ng = 0;
const t = (c, l) => { if (c) { console.log("  ✓ " + l); ok++; } else { console.log("  ✗ " + l); ng++; } };

const il = readCode("components", "InteriorLayer.jsx");
const ch = readCode("components", "CharacterHome.jsx");

console.log("① 決め打ちを 使って いない こと");
t(!/\bROOM_ASPECT\b\s*[*)]/.test(il) && !/heightPct \* ROOM_ASPECT/.test(il),
  "★換算の 式に ROOM_ASPECT を 直に 使って いない");
t(/ROOM_ASPECT_FALLBACK/.test(il), "★見当は「渡されなかった とき」だけ");
t(/heightPct \* roomAspect/.test(il), "★換算は 渡された 比を 使う");

console.log("\n② 3つの 換算 すべてに 渡して いる こと");
["bottomForFeet", "floorBottomPct"].forEach((fn) => {
  const m = il.match(new RegExp("function " + fn + "\\(([^)]*)\\)"));
  t(!!m && /roomAspect/.test(m[1]), "★" + fn + " が 比を 受け取る");
});
// ★★呼ぶ ところを 1つずつ 数えます。
//   ★★2026-09-13、★1つの 正規表現で まとめて 見ようと して 落としました。
//     ★★入れ子の かっこが あると、`[^)]*` は 途中で 切れます。
const calls = il.split("\n")
  .filter((l) => /(floorBottomPct|bottomForFeet)\(/.test(l))
  .filter((l) => !/^\s*function /.test(l));
t(calls.length > 0, "★呼ぶ ところが " + calls.length + " 行 ある");
const missing = calls.filter((l) => !/aspect/.test(l));
missing.forEach((l) => console.log("    ✗ " + l.trim().slice(0, 70)));
t(missing.length === 0, "★どの 呼び出しも 比を 渡して いる");

console.log("\n③ 呼ぶ 側が 測って いる こと");
t(/setRoomBoxH/.test(ch), "★高さを 測って いる");
t(/offsetHeight/.test(ch), "★組みつけの 高さ（変形の 影響を 受けない）");
t(/blockSize/.test(ch), "★ResizeObserver の border-box でも 高さを 取る");
// ★★2026-09-14、★比の 出どころが 変わりました（★lib/roomStage.js）。
//   ★★これまでは「箱の 幅 ÷ 箱の 高さ」。★画面ごとに ちがいました。
//     ★それが、★ながめると したくで 家具が ずれた 原因です。
//   ★★いまは **舞台**の 比。★1つ だけ です。
t(/const roomAspect = STAGE_ASPECT;/.test(ch), "★比は 舞台から 1つ だけ 取る");
t(/from "@\/lib\/roomStage"/.test(ch), "★舞台の 決まりを 取り寄せて いる");
t(/stageStyle\(roomBoxW, roomBoxH, STAGE_ASPECT, leftPct\)/.test(ch),
  "★舞台を 箱に 合わせ、★羊の ほうへ ずらして いる");
t(!/roomBoxHFallback/.test(ch), "★見当の 高さを もう 持って いない");
// ★★寄りが 二重に ならない こと。
//   ★★舞台が 箱を 覆う ぶんだけ、★カメラの 倍率を 減らします。
t(/ZOOM \/ \(stage\.w \/ roomBoxW\)/.test(ch), "★舞台の 寄りの ぶん、倍率を 減らす");
t(/<InteriorLayer roomAspect=\{roomAspect\}/.test(readRaw("components", "CharacterHome.jsx")),
  "★InteriorLayer に 渡して いる");

console.log("\n④ 3つの 比が まだ 帳面に ある こと（★見落とし 防止）");
const raw = readRaw("components", "CharacterHome.jsx");
// ★★2026-09-14、★箱の 比を 1つに しました。
//   ★★ふつう 4:3 ／ 広い 7:5 ／ 全画面 端末しだい の 3つ ありました。
//   ★★いまは どれも 7:5 です。★舞台と 同じ 比です。
//     ★★そう しないと、★舞台が 箱を 覆い、★部屋の 半分しか 見えません。
//       ★2026-09-14、★一度 そう なりました（★窓だけが 画面いっぱい）。
{
  const roomPart = raw.slice(raw.indexOf('id="room-anchor"'),
    raw.indexOf("isGardenExpanded"));
  t(!/"4 \/ 3"/.test(roomPart), "★部屋に 4:3 は もう 無い");
  t((roomPart.match(/aspectRatio: "7 \/ 5"/g) || []).length === 2,
    "★2つの 箱（全画面・したく）とも 7:5");
  t(/maxHeight: "calc\(100dvh/.test(roomPart), "★全画面は 高さの 上限だけ");
}

console.log("\n★★この 見張りが 見て いない こと");
console.log("　★字の 並びだけ を 見ます。★描かれた 位置は 見て いません。");
console.log("　★実機で、★ながめる と したく の 両方を お確かめください。");

console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
process.exit(ng === 0 ? 0 : 1);
