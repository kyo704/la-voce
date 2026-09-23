#!/usr/bin/env node
// STRIP: A（振る舞い）
// ============================================================================
// ★★★レッスンの 希望（★学生）の 画面 ── ★見本 `SC['レッスンの希望']`
//
//   ★★守る こと
//     ① 決めを 画面で 作って いない（★`lib/lessonRound.js` から 借りる）
//     ② ★授業の **名前**を 受け取って いない（★見本 …「先生に 伝わりません」）
//     ③ 授業の マスは 押せない
//     ④ ★理由の 欄が ない（★見本 …「理由は うかがいません」）
//     ⑤ しめきりで 残りの 日数を 数えて いない
//     ⑥ 但し書きが 見本の まま（★1字も 足さない）
//     ⑦ 字は `tx()` を 通す（★9か国語）
//     ⑧ 押す ところは 44 以上
// ============================================================================
const fs = require("fs");
const path = require("path");
const { readCode, readRaw } = require("./_source");

let 落ち = 0;
function t(cond, label) {
  if (cond) console.log("  ok   " + label);
  else { console.log("  NG   " + label); 落ち++; }
}

const 画 = readCode("components", "LessonPrefs.jsx");
const 生 = readRaw("components", "LessonPrefs.jsx");

console.log("① 決めは lib から 借りる");
["nextLevel", "markOf", "slotKey", "isClassSlot", "levelOf", "countLevels",
 "canEdit", "PREFS_NOTE", "LEVEL_WORDS", "DUE_NOTE"].forEach((n) => {
  t(new RegExp("\\b" + n + "\\b").test(画), "★" + n + " を 借りて いる");
});
t(/from "@\/lib\/lessonRound"/.test(画), "★出どころは lib/lessonRound");
t(/from "@\/lib\/myTimetable"/.test(画), "★曜日も lib から（DAYS）");
// ★★決めを その場で 作って いない こと。
t(!/=== 2|=== 1|level \? "◎"/.test(画), "★印や 数を 画面で 決めて いない");

console.log("\n② 授業の 名前を 受け取って いない");
// ★★★`props` に 名前が 無い こと。★受け取れなければ、★出す ことも できません。
// ★★★2026-09-23 ── ★ここで 自分の 字に 当たりました（★きょう 2度目）。
//   ★`TYPE.title`（★字の 大きさ）が、★`.title` に 当たって いました。
//   ★★★見たいのは「★**時間割の 行**から 名前を 読んで いないか」です。
//     ★だから、★時間割の 行を 指す 名（`t.` / `tt.` / `timetable`）の あとだけ を 見ます。
t(!/\b(t|tt|timetable|slot|cell)\.(title|teacher|room|memo)\b/.test(画),
  "★時間割の 行から 名前・先生・部屋・覚え書きを 読んで いない");
// ★★受け取る ところにも 無い こと（★props に 無ければ、★出す ことも できません）。
t(!/title|teacher|room|memo/.test(画.slice(画.indexOf("export default function LessonPrefs("),
  画.indexOf("export default function LessonPrefs(") + 260)),
  "★受け取る ところに 名前が ない");
t(/isClassSlot\(/.test(画), "★授業か どうかは 真偽 だけ で 判じて いる");

console.log("\n③ 授業の マスは 押せない");
t(/disabled=\{classSlot\}/.test(画), "★授業の マスは disabled");
t(/classSlot \? undefined : onTap/.test(画), "★授業の マスに 押す 手を 渡さない");

console.log("\n④ 理由の 欄が ない");
t(!/reason|理由/.test(画.replace(/理由は うかがいません。/g, "")), "★理由を 受ける ところが ない");

console.log("\n⑤ 残りの 日数を 数えて いない");
t(!/days_left|daysLeft|getTime\(\)/.test(画), "★日の 引き算を して いない");
t(/round\.due_on/.test(画), "★しめきりは 日づけ そのまま");

console.log("\n⑥ 但し書きは 見本の まま");
const lib = readRaw("lib", "lessonRound.js");
["理由は うかがいません。",
 "見るのは、担当の 先生と、日程を 組む 方だけです。ほかの 学生には 見えません。",
 "授業の コマは、はじめから × に しています。授業の 名前は 先生に 伝わりません。"
].forEach((s) => t(lib.includes(s), "★「" + s.slice(0, 18) + "…」が lib に ある"));
t(/PREFS_NOTE\.map/.test(画), "★画面は それを 並べるだけ");

console.log("\n⑦ 字は tx() を 通す");
// ★★★人に 見える 字は、★9か国語に なります（★台帳の 決め）。
const 裸 = [...生.matchAll(/>([^<>{}\n]*[ぁ-んァ-ヶ一-龠][^<>{}\n]*)</g)]
  .map((m) => m[1].trim()).filter((s) => s && !/^[　\s]*$/.test(s));
t(裸.length === 0, "★tx() を 通さない 字が ない" + (裸.length ? "（" + 裸.slice(0, 3).join("／") + "）" : ""));

console.log("\n⑧ 押す ところは 44 以上");
const 押 = [...画.matchAll(/minHeight: (\d+)/g)].map((m) => Number(m[1]));
t(押.length > 0 && 押.every((x) => x >= 44), "★どの 押しどころも 44 以上（" + 押.join("／") + "）");

console.log(落ち === 0 ? "\n★すべて 通りました" : "\n★" + 落ち + "件 落ちました");
process.exit(落ち === 0 ? 0 : 1);
