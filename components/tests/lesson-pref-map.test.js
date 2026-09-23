#!/usr/bin/env node
// STRIP: A（振る舞い）
// ============================================================================
// ★★★希望の 地図（★先生・事務）── ★見本 `P_wariMap`
//
//   ★出どころ woolsong-2026-09-21_7.zip ／ 00-動く見本-PC・iPad（運営）.html（md5 29e1d658）
//     ★2026-09-23 に 展開・docs/design/pack-final/ に 反映。
//
//   ★★守る こと
//     ① 決めを 画面で 作って いない（lib/lessonRound から 借りる）
//     ② ★名前の 一覧を props で 受け取って いない（★受け取れば 出せて しまう）
//     ③ ★押すまで 名前を 引かない（`namesOf` は 選ばれて から だけ）
//     ④ 体の 記録を 1つも 受け取って いない
//     ⑤ 濃さは 62% まで（★真っ黒に しない）
//     ⑥ 字は tx() を 通す ／ ⑦ 押す ところは 44 以上
// ============================================================================
const path = require("path");
const fs = require("fs");
const { readCode, readRaw } = require("./_source");

let 落ち = 0;
function t(cond, label) {
  if (cond) console.log("  ok   " + label);
  else { console.log("  NG   " + label); 落ち++; }
}

const 画 = readCode("components", "LessonPrefMap.jsx");
const 生 = readRaw("components", "LessonPrefMap.jsx");

console.log("① 決めは lib から");
["prefWeight", "densityPercent", "isDarkCell", "cellWord", "slotKey",
 "MAP_NOTE", "MAP_EMPTY_HEAD", "MAP_EMPTY_HOW"].forEach((n) => {
  t(new RegExp("\\b" + n + "\\b").test(画), "★" + n + " を 借りて いる");
});
t(!/\* *2 *\+|\/ *max|> *38/.test(画), "★重み・濃さ・白字を 画面で 数えて いない");

console.log("\n② 名前の 一覧を 受け取って いない");
const 受 = 画.slice(画.indexOf("export default function LessonPrefMap("),
  画.indexOf("export default function LessonPrefMap(") + 200);
t(!/names\s*=|students\s*=|members\s*=/.test(受), "★props に 名前の 一覧が ない（" + 受.replace(/\s+/g, " ").slice(40, 150) + "）");
t(/namesOf/.test(受), "★名前は 手（namesOf）で 受け取る");

console.log("\n③ 押すまで 引かない");
t(/選 && namesOf \? namesOf\(選\) : null/.test(画), "★選ばれて から だけ 呼ぶ");
t(/!選 \?/.test(画), "★選ばれて いない ときは 別の ものを 出す");

console.log("\n④ 体の 記録を 受け取って いない");
["entries", "voiceQuality", "throatCondition", "sleepHours", "health", "体調"].forEach((w) => {
  t(!new RegExp(w).test(画), "★" + w + " を 受け取って いない");
});

console.log("\n⑤ 濃さは 62% まで");
const lib = readCode("lib", "lessonRound.js");
t(/\* 62\)/.test(lib), "★lib が 62 を 上限に して いる");
t(!/100\)/.test(lib.slice(lib.indexOf("export function densityPercent"),
  lib.indexOf("export function densityPercent") + 300)), "★100% に して いない");

console.log("\n⑥⑦ 字と 押しどころ");
const 裸 = [...生.matchAll(/>([^<>{}\n]*[ぁ-んァ-ヶ一-龠][^<>{}\n]*)</g)]
  .map((m) => m[1].trim()).filter((s) => s && !/^[　\s]*$/.test(s));
t(裸.length === 0, "★tx() を 通さない 字が ない" + (裸.length ? "（" + 裸.slice(0, 2).join("／") + "）" : ""));
const 押 = [...画.matchAll(/minHeight: (\d+)/g)].map((m) => Number(m[1]));
t(押.length > 0 && 押.every((x) => x >= 44), "★押しどころは 44 以上（" + 押.join("／") + "）");

console.log(落ち === 0 ? "\n★すべて 通りました" : "\n★" + 落ち + "件 落ちました");
process.exit(落ち === 0 ? 0 : 1);
