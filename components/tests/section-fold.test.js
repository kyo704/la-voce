#!/usr/bin/env node

// ============================================================================
// 記録（A03）の 古い節 ── ★隠さず、★畳む
//
//   ★出どころ 坂本さんの お決めの 訂正（★2026-09-11 夜）
//     「「隠す」のではなく、見本と、同じ、JavaScriptによる、
//       畳む仕組み(<Note fold>)を、使ってください。」
//
//   ★★なぜ 訂正に なったか
//     ★★私が「見本に 畳む しくみは ない」と 誤って ご報告しました。
//       ★<details>／<summary> を 数えて 0 だったからです。
//       ★★見本は JavaScript で 畳んで いました（foldNotes ／ 詳しく 書く）。
//     ★★隠すと、★パッサッジョの通りにくさ・高音の出しやすさ の
//       ★入口が 1つも 無くなり、★書けなく なります。
//
//   ★★この見張りが 見ること
//     ① 隠して いない（★sectionIsOpen が false を 返さない）
//     ② 畳んでいる（★sectionIsFolded）
//     ③ 札の 字が 見本の もので ある
//     ④ 門の外（38人）は 畳まない
//     ⑤ 閉じている あいだも 中身を 消していない（★打ちかけが 消えない）
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

(async () => {
  const src = fs.readFileSync(path.join(__dirname, "..", "..", "lib", "recordV2.js"), "utf-8");
  const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));

  const SHEET_SECTIONS = ["sleep", "voice", "practice", "hydration", "meal",
    "body", "exercise", "mental", "practiceNote", "typeFields"];

  console.log("① 隠して いない");
  SHEET_SECTIONS.forEach((k) => {
    t(m.sectionIsOpen(k, { layoutV2: true, openSheet: null }) === true,
      "★" + k + " は 画面に 出る");
  });
  // ★★1枚が かぶさっている あいだは、★下に 節を 並べません。
  t(m.sectionIsOpen("typeFields", { layoutV2: true, openSheet: "こえ" }) === false,
    "★1枚が 開いている あいだは 出さない");

  console.log("\n② 畳んでいる");
  SHEET_SECTIONS.forEach((k) => {
    t(m.sectionIsFolded(k, { layoutV2: true }) === true, "★" + k + " は 畳む");
  });
  // ★★表に 無い節（★気候・滞在地）は 畳みません。★見本の 1枚に 入りません。
  t(m.sectionIsFolded("env", { layoutV2: true }) === false, "★env は 畳まない");

  console.log("\n③ 札の 字（★見本の もの）");
  const mihon = fs.readFileSync(path.join(__dirname, "..", "..",
    "docs", "design", "pack-final", "00-動く見本（さわれる・全画面）.html"), "utf8");
  t(m.FOLD_OPEN === "詳しく 書く", "★開く 札は「詳しく 書く」");
  t(mihon.includes("詳しく 書く（分で）"), "★その 字が 見本に ある（SH['koe']）");
  t(m.FOLD_CLOSE === "閉じる", "★閉じる 札は「閉じる」");
  t(mihon.includes("'くわしい 決まりを 見る':'閉じる'"), "★その 字が 見本に ある");

  console.log("\n④ 門の外（38人）");
  SHEET_SECTIONS.forEach((k) => {
    if (m.sectionIsFolded(k, { layoutV2: false }) !== false) {
      t(false, "★" + k + " を 門の外で 畳んでいる");
    }
  });
  t(SHEET_SECTIONS.every((k) => m.sectionIsFolded(k, { layoutV2: false }) === false),
    "★門の外では 1つも 畳まない");
  t(SHEET_SECTIONS.every((k) => m.sectionIsOpen(k, { layoutV2: false, openSheet: "こえ" }) === true),
    "★門の外では ぜんぶ 出る");

  console.log("\n⑤ 閉じている あいだも 中身を 消さない");
  const ui = readCode("components", "VocalTracker.jsx");
  // ★★描き直すと、★打ちかけの 字が 消えます。★display だけ 消します。
  t(/display: hidden \? "none" : undefined/.test(ui), "★display だけ 消している");
  t(!/hidden \? null : children/.test(ui), "★中身を 捨てて いない");
  t(/sectionIsFolded\(fold, foldState\)/.test(ui), "★畳むか どうかを lib に 聞いている");

  console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
  process.exit(ng === 0 ? 0 : 1);
})();
