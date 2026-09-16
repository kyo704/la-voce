#!/usr/bin/env node

// ============================================================================
// ★学ぶの 画面が、★見本の 字を 持っていること
//
//   ★出どころ 見本 `SC['学ぶ']`（★docs/design/pack-final/… の 動く見本）
//   ★裁定 2026-09-15・坂本さん ──「㋐㋑㋒㋓㋔、全て 見本どおり 追加してください」
//
//   ★★見本には `SC['学ぶ']` が **2つ** ありました。
//     ★★JavaScript は **あとの ほう** を 使います。★前の ものは 動きません。
//     ★★写したのは 生きて いる ほう です。
//
//   ★★この見張りは 3つ 見ます。
//     ★① 字が lib/learnContent.js に あること（★1か所に まとめてある か）
//     ★② その 字を VocalTracker.jsx が **読んで** いること
//         ★★書いて あるだけでは 画面に 出ません。★読む 側も 見ます。
//     ★③ 言い換えない 約束（★9月9日の 裁定②）が 消えて いないこと
//
//   ★★字の 有無だけを 見る 見張りは、★退けられました（★2026-09-11・決まり⑤）。
//     ★★だから ② を 入れて います。★字は 使われて 初めて 画面です。
//
//   ★★見えたか どうかは、★これでは 分かりません。
//     ★★実機で 見て いただく ほか ありません。
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode } = require("./_source");

let ok = 0, ng = 0;
function t(cond, label) {
  if (cond) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label); ng++; }
}

// ★★読む はずの ものが 無いときは、★数えずに 止まります（★2026-09-14 の 決め）。
//   ★★足りないまま 数えた 答えは、★正しそうに 見えるぶん たちが 悪い。
const NEED = [["lib", "learnContent.js"], ["components", "VocalTracker.jsx"]];
const missing = NEED.filter((parts) =>
  !fs.existsSync(path.join(__dirname, "..", "..", ...parts)));
if (missing.length) {
  missing.forEach((parts) => console.log("★★ありません: " + parts.join("/")));
  console.log("　★数えません。★止まります。");
  process.exit(1);
}

const lib = readCode("lib", "learnContent.js");
const ui = readCode("components", "VocalTracker.jsx");

// ★見本の 字。★1文字も 変えて いません。
const MIHON = [
  // ★★★2026-09-16、★数を 決め打ちに するのを やめました（★決め ①・㋐）。
  //   ★★前は「7つの 章立ては …」でした。★けれど 画面には **9つ** 出て いました
  //     （★8・9 は「音楽家の商い」。★見られる 方にだけ 出ます）。
  //   ★★いまは `learnChapterNote(n)` が、★数えて 書きます。
  //     ★★だから この 見張りは、★数の ところを 見ません。★あとの 字を 見ます。
  ["㋐", "つの 章立ては、どの 仕事でも 同じです。中身だけ 入れ替わります。"],
  ["㋑", "これは どの 仕事の方にも 出る 章です。"],
  ["㋑", "声楽・アナウンサー・声優・ポップスの ほか、保育士・学校の先生・受付・コールセンター・介護・営業の方も、ここを 読みます。"],
  ["㋒", "ただし 書き方は 稽古の ことばの ままです。「授業の前は」「シフトの前は」と 言い換えません（9月9日の 裁定②）。"],
  ["㋓", "1記事 800〜1,500字。冒頭の 3行で 結論。図は 1枚まで。"],
  ["㋓", "その 仕事の ことばで 書きます（声楽の方に「発話」、アナウンサーの方に「パッサッジョ」と 言いません）。"],
  ["㋓", "「疑い／リスク／早期発見／予防」の 語を 使いません。出典は 記事の 末に 置きます。"],
  ["㋓", "撤回した ACWR の 記事は、ここに ありません。"],
  ["㋔", "読まなくても、アプリは 使えます。"]
];

console.log("① 見本の 字が lib/learnContent.js に あること");
MIHON.forEach(([mark, line]) => {
  t(lib.includes(line), mark + "「" + line.slice(0, 22) + "…」");
});

console.log("\n② その 字を 画面が 読んでいること");
// ★★書いて あるだけでは 出ません。★読み込みと 描画の 両方を 見ます。
t(/import\s*{[^}]*learnChapterNote[^}]*}\s*from\s*"@\/lib\/learnContent"/.test(ui),
  "learnChapterNote を 読み込んでいる");
t(/import\s*{[^}]*LEARN_COMMON_LINES[^}]*}\s*from\s*"@\/lib\/learnContent"/.test(ui),
  "LEARN_COMMON_LINES を 読み込んでいる");
t(/import\s*{[^}]*LEARN_NOTE[^}]*}\s*from\s*"@\/lib\/learnContent"/.test(ui),
  "LEARN_NOTE を 読み込んでいる");
t(/\{learnChapterNote\(learnChapters\.length\)\}/.test(ui),
  "㋐ を 描いている（★章の 数を 数えて います）");
t(/LEARN_COMMON_LINES\.map\(/.test(ui), "㋑㋒ を 描いている");
t(/LEARN_NOTE\.map\(/.test(ui), "㋓㋔ を 描いている");

// ★★太字は 見本が 指定して います。★飾りでは ありません。
t(/LEARN_COMMON_BOLD/.test(ui), "見本の 太字を 使っている");

// ★★置き場所 ── ㋑㋒ は「からだ（全職業共通）」の 見出しの 下です。
//   ★★見本では「からだ（どの 仕事でも）」を **選んだ** ときに 出ます。
//   ★★アプリの 職業の 選びは 5つ で、★「からだ」は 選べません。
//     ★★代わりに 一覧の 下に 節が あります。★そこが 同じ ところ です。
const iBody = ui.indexOf('t("bodyChapterHeading")');
const iWarn = ui.indexOf("LEARN_COMMON_LINES.map(");
t(iBody > 0 && iWarn > iBody, "㋑㋒ が「からだ（全職業共通）」の 見出しの すぐ後ろに ある");
// ★★㋓㋔ は いちばん 下。★㋑㋒ より 後ろ です。
t(ui.indexOf("LEARN_NOTE.map(") > iWarn, "㋓㋔ が いちばん 下に ある");

console.log("\n③ 言い換えない 約束（★9月9日の 裁定②）");
// ★★これは 設計の 決め です。★消したら 落とします。
//   ★★「授業の前は」「シフトの前は」と 書き換える 案が 出たら、
//     ★★この 見張りが 先に 止めます。
t(lib.includes("言い換えません（9月9日の 裁定②）"), "裁定②の 出どころが 書いてある");
t(lib.includes("保育士・学校の先生・受付・コールセンター・介護・営業"),
  "読む人の 仕事が 6つ 挙げてある");
t(lib.includes("稽古の ことばの まま"), "「稽古の ことばの まま」が 残っている");

console.log("\n④ 字は 1か所だけ");
// ★★同じ 決めが 2か所に あると、★片方だけ 直されます。
//   ★★この 蔵の 繰り返しの 傷です。★画面側に 直書きが 無いことを 見ます。
MIHON.forEach(([mark, line]) => {
  t(!ui.includes(line), mark + " が 画面側に 直書きされていない");
});

console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
process.exit(ng === 0 ? 0 : 1);
