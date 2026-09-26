#!/usr/bin/env node
// STRIP: B（言葉）── ★約束の 文を 見ます。★何も 落としません。
/**
 * ★この 教室の 運営 の 見張り（★2026-09-25・design-v76）。
 *
 *   ★★★見る もの ──
 *     ①★下の 2行（★約束）が 1文字も 変わって いない か
 *     ②★2行目「生徒の 健康の 記録には たどりつけません」が 本当 か
 *        ★★`entries` へ 行く 道が 1つも 無い こと
 *     ③★行が できことで 出し分けられて いる か（★役職の 名で 決めて いない）
 *     ④★行き先が 名ざし か（★行の 名が「名簿」なら 名簿へ 着く）
 *     ⑤★字を 画面に 書き写して いない か
 *
 *   ★★較正 ── ★できことを 空に すると 行が 0 に なる こと。
 */
const fs = require("fs");
const path = require("path");
const { stripComments, readRaw, libUrl, inMihon } = require("./_source");
const ROOT = path.join(__dirname, "..", "..");
let pass = 0, fail = 0;
function t(c, label) {
  if (c) { console.log(`  ✓ ${label}`); pass++; } else { console.log(`  ✗ ${label}`); fail++; }
}

async function main() {
  const libRaw = readRaw("lib", "kyoshitsuOps.js");
  const jsx = readRaw("components", "KyoshitsuOps.jsx");
  const jsxCode = stripComments(jsx);
  const vt = stripComments(readRaw("components", "VocalTracker.jsx"));
  // ★★すり替えは `_source.js` の `libUrl` に 寄せました（★2026-09-26）。
  const b64 = (...q) => libUrl(q[q.length - 1]);
  const m = await import(libUrl("kyoshitsuOps"));

  console.log("=== 一 ★下の 2行（★約束） ===");
  t(m.NOTES.length === 2, `★2行（いま ${m.NOTES.length}）`);
  // ★★★覚えません ── ★見本から 数えます（★`_source.js` の `inMihon`・2026-09-26）。
  //   ★★写して 持って いた 字に **空きが 1つ 多く** 入って いました
  //     （★「ことだけ です」／★見本は「ことだけです」）。
  //   ★★★これで 3つめ です。★見張りが 間違った 字を 守る 形 を 止めます。
  m.NOTES.forEach((l) => t(inMihon(l), `★見本に 同じ 字が ある …… 「${l.slice(0, 16)}…」`));
  t(m.NOTES.includes("生徒の 健康の 記録には たどりつけません（画面そのものが ありません）。"),
    "★2行目");

  console.log("=== 二 ★健康の 記録へ 行く 道が 無い ===");
  ["entries", "questionnaire_responses", "cycle_periods", "period_markers"].forEach((tb) => {
    t(!new RegExp(tb).test(jsxCode), `★画面が ${tb} に 触れて いない`);
    t(!new RegExp(tb).test(stripComments(libRaw)), `★字の 側も ${tb} に 触れて いない`);
  });
  // ★★6つの 行き先の どれも、★記録の 画面では ない こと。
  const 先 = m.ROWS.map((r) => r.to);
  ["きょう", "記録", "ふりかえる", "しらべる"].forEach((x) => {
    t(!先.includes(x), `★行き先に「${x}」が 無い`);
  });

  console.log("=== 三 ★できことで 出し分けて いる（★役職の 名では ない） ===");
  t(m.rowsOf({ perms: [] }).length === 0, "★1つも 持たない 方には 1行も 出ない");
  t(m.rowsOf({ perms: ["meibo"] }).map((r) => r.to).join() === "名簿,招く",
    "★`meibo` だけ の 方には 名簿と 招く");
  t(m.rowsOf({ perms: ["master"] }).map((r) => r.to).join() === "役職の一覧,組織",
    "★`master` だけ の 方には 役職と 学部・学科");
  t(m.rowsOf({ perms: ["koma"] }).map((r) => r.to).join() === "場所を決める", "★`koma` は 場所");
  // ★★役職の 名で 決めて いない こと。
  t(!/owner|admin|teacher|staff|"学長"/.test(stripComments(libRaw)), "★役職の 名が 1つも 無い");
  // ★★行ける ものだけ 出す こと（★押せない 札を 置かない）。
  t(m.rowsOf({ perms: ["meibo"], canGo: () => false }).length === 0,
    "★行けない 行は 出ない");

  console.log("=== 四 ★行き先が 名ざし ===");
  t(/const 教室の運営の行き先 = (\(\) => \(\{|\{)/.test(vt), "★行き先の 表が ある");
  // ★★★2026-09-26 ── ★こちらも 呼べる もの に しました。
  const i = vt.indexOf("const 教室の運営の行き先 = () => ({") >= 0
    ? vt.indexOf("const 教室の運営の行き先 = () => ({")
    : vt.indexOf("const 教室の運営の行き先 = {");
  const 表 = vt.slice(i, vt.indexOf("const 教室の運営へ行ける", i));
  m.ROWS.forEach((r) => t(表.includes(`"${r.to}"`), `★${r.to} …… 表に ある`));
  t(/"名簿": \{ tab: "roster" \}/.test(表), "★名簿は 名簿の 帯へ");
  t(/initialTab=\{opsWant/.test(vt), "★開いて 入る 帯を 渡して いる");
  t(/initialSection=\{opsWant/.test(vt), "★開いて 入る 節も 渡して いる");
  // ★★渡した 名を そのまま 信じて いない こと（★中で 判じ直す）。
  const shell = stripComments(readRaw("components", "OpsShell.jsx"));
  t(/tabs\.some\(\(t\) => t\.key === initialTab\)/.test(shell), "★持って いない 帯は 開かない");
  const hub = stripComments(readRaw("components", "OpsSettingsHub.jsx"));
  t(/mayOpen\(perms, initialSection/.test(hub), "★開けない 節は 開かない");

  console.log("=== 五 ★字を 画面に 書き写して いない ===");
  m.NOTES.forEach((l) => t(!jsx.includes(l), `★直書きして いない …… ${l.slice(0, 12)}…`));
  t(/from "@\/lib\/kyoshitsuOps"/.test(jsx), "★字は lib から 受け取って いる");
  // ★★できことの 数は 数えて いる（★書き写して いない）。
  t(m.subLineOf({ postName: "学長", myName: "坂本 響", perms: ["meibo", "post"] })
    === "学長　坂本 響　／　できること 2", "★できことの 数を 数えて いる");

  console.log(`\n${pass} 通り ／ ${fail} 落ち`);
  if (fail) process.exit(1);
}
main();
