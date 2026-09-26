#!/usr/bin/env node
// STRIP: B（言葉）── ★約束の 文を 見ます。★何も 落としません。
/**
 * ★区切り（一覧）の 見張り（★2026-09-25・design-v78）。
 *
 *   ★★★見る もの ──
 *     ①★4行の 断りが 1文字も 変わって いない か
 *     ②★理由を 書く ところが 無い か（★設計 §9 の 8番）
 *     ③★「（いまは まだです）」── ★`splitByMarkers` を くらべるが **呼んで いない** こと
 *        ★★★呼び始めたら この 見張りが 落ちます。★そこで 括弧を 外します。
 *        ★★★これが **外し忘れ** を 防ぐ 唯一の 仕掛け です。
 *     ④★字を 画面に 書き写して いない か
 *
 *   ★★較正 ── ★4行の どれか を 消すと ①が 落ちる こと。
 */
const fs = require("fs");
const path = require("path");
const { stripComments, readRaw, libUrl } = require("./_source");
const ROOT = path.join(__dirname, "..", "..");
let pass = 0, fail = 0;
function t(c, label) {
  if (c) { console.log(`  ✓ ${label}`); pass++; } else { console.log(`  ✗ ${label}`); fail++; }
}

async function main() {
  const libRaw = readRaw("lib", "periodMarkers.js");
  const jsx = readRaw("components", "Kugiri.jsx");
  const jsxCode = stripComments(jsx);
  const m = await import(libUrl("periodMarkers"));

  console.log("=== 一 ★下の 4行（★約束） ===");
  const 約 = [
    "置くのは 日だけ です。わけは うかがいません。",
    "良い・悪いは 出しません。前と あとを 分けるだけです。",
    "外しても、記録は 1つも 変わりません。",
    "くらべるときに 前と あとを 分けて 見られるように なります（いまは まだです）。"
  ];
  t(m.LIST_NOTES.length === 4, `★4行（いま ${m.LIST_NOTES.length}）`);
  約.forEach((l) => t(m.LIST_NOTES.includes(l), `★「${l.slice(0, 20)}…」`));
  t(m.LIST_HEAD_LINES.includes("日を 置くと、その 前と あとが 分かれます。"), "★上の 断り 1行目");
  t(m.LIST_HEAD_LINES.includes("記録は 止まりません。いつもどおり 書けます。"), "★上の 断り 2行目");

  console.log("=== 二 ★理由を 書く ところが 無い（★設計 §9 の 8番） ===");
  // ★★`type="button"` の `type` は 台帳の 列では ありません。★先に 落とします
  //   （★札は みな `type="button"` です。★落とさないと いつも 落ちます）。
  const 見る字 = jsxCode.replace(/type="button"/g, "");
  m.FORBIDDEN_COLUMNS.forEach((c) => {
    t(!new RegExp(`\\b${c}\\b`).test(見る字), `★画面に ${c} が 無い`);
  });
  t(!/<textarea|<input/.test(jsxCode), "★書く 口が 1つも 無い");
  // ★★★この 2つは **出る 字** を 見ます。★註を 落として から 読みます。
  //   ★★註には 消した わけを 書いて あります ── ★落とさないと 自分の 説明で 落ちます
  //     （★この 蔵で 2度 起きた 罠 です）。
  t(!/先生が 変わった/.test(jsxCode + stripComments(libRaw)),
    "★見本の 古い 例（理由）を 出して いない");
  t(!/書いても、書かなくても/.test(jsxCode + stripComments(libRaw)),
    "★消えた 1行を 出して いない");

  console.log("=== 三 ★「（いまは まだです）」の 外し忘れ を 防ぐ ===");
  // ★★`splitByMarkers` を 呼ぶ ところ（★見張り 以外）を 数え直します。
  const 呼ぶ = [];
  const 歩 = (d) => {
    for (const f of fs.readdirSync(d)) {
      const p = path.join(d, f);
      const st = fs.statSync(p);
      if (st.isDirectory()) { if (f !== "tests" && f !== "node_modules") 歩(p); continue; }
      if (!/\.(js|jsx)$/.test(f)) continue;
      if (p.endsWith(path.join("lib", "periodMarkers.js"))) continue;
      if (/splitByMarkers/.test(fs.readFileSync(p, "utf-8"))) 呼ぶ.push(path.relative(ROOT, p));
    }
  };
  ["components", "app", "lib"].forEach((d) => 歩(path.join(ROOT, d)));
  const まだ = m.LIST_NOTES.some((l) => l.includes("いまは まだです"));
  t(呼ぶ.length === 0 ? まだ : !まだ,
    呼ぶ.length === 0
      ? "★まだ 誰も 呼んで いない ので「いまは まだです」が 要る"
      : `★もう 呼んで います（${呼ぶ.join("／")}）── ★「いまは まだです」を 外して ください`);

  console.log("=== 四 ★字を 画面に 書き写して いない ===");
  約.forEach((l) => t(!jsx.includes(l), `★直書きして いない …… ${l.slice(0, 12)}…`));
  t(/from "@\/lib\/periodMarkers"/.test(jsx), "★字は lib から 受け取って いる");

  console.log(`\n${pass} 通り ／ ${fail} 落ち`);
  if (fail) process.exit(1);
}
main();
