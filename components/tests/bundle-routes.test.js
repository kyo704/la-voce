#!/usr/bin/env node
// STRIP: A（振る舞い）── ★道が つながって いるか を 見ます。
/**
 * ★束の 行き先の 見張り（★2026-09-25・D群）。
 *
 *   ★★★見る もの ──
 *     ①★`束の行き先` の 鍵が、★ぜんぶ `BUNDLE_DEF` の `to` に ある か
 *       ★★打ち間違えた 鍵は、★**永久に 出ない 行** に なります。
 *         ★★落ちなければ 気づけません ── ★見張りが 無ければ 静かに 消えます。
 *     ②★`canGo` と `onGo` が **同じ 表** から 出て いる か
 *       ★★2つに 分けると、★出して いる のに 行けない 行 が 生まれます。
 *     ③★出す 行が 1つも 無い 束は、★入口ごと 出ない か
 *     ④★`readyAt` の 無い 行が 出て いない か
 *
 *   ★★較正 ── ★表に 出どころの 無い 鍵を 足すと ① が 落ちる こと。
 */
const fs = require("fs");
const path = require("path");
const { stripComments, readRaw } = require("./_source");
const ROOT = path.join(__dirname, "..", "..");
let pass = 0, fail = 0;
function t(c, label) {
  if (c) { console.log(`  ✓ ${label}`); pass++; } else { console.log(`  ✗ ${label}`); fail++; }
}

async function main() {
  const libRaw = readRaw("lib", "moreBundles.js");
  const m = await import("data:text/javascript;base64,"
    + Buffer.from(libRaw, "utf-8").toString("base64"));
  const vt = stripComments(readRaw("components", "VocalTracker.jsx"));

  // ★★表を 源から 切り出します。★数を 覚えません。
  const i = vt.indexOf("const 束の行き先 = {");
  t(i > 0, "★行き先の 表が ある");
  const j = vt.indexOf("const 束へ行ける", i);
  const 表 = vt.slice(i, j);
  const 鍵 = [...表.matchAll(/^\s{4}"([^"]+)":/gm)].map((x) => x[1]);
  t(鍵.length > 0, `★表に 行が ある（${鍵.length} 行）`);

  // ★★見本の 側の すべての 行き先。
  const to = [];
  m.BUNDLES.forEach((b) => {
    ((m.BUNDLE_DEF[b] || {}).groups || []).forEach((g) => {
      (g.rows || []).forEach((r) => to.push(r.to));
    });
  });

  console.log("=== 一 ★表の 鍵は ぜんぶ 見本の 行き先 ===");
  // ★★★「この 教室の 運営」の 行も 行き先 です（★2026-09-25・design-v76）。
  //   ★★束の 行では ありませんが、★同じ 表が 引きます。
  //     ★★`組織` と `場所を決める` は 束に ありません ── ★あちらの 6行 です。
  const ko = await import("data:text/javascript;base64," + Buffer.from(
    readRaw("lib", "kyoshitsuOps.js")
      .replace('"@/lib/opsPerms"', JSON.stringify("data:text/javascript;base64," + Buffer.from(
        readRaw("lib", "opsPerms.js"), "utf-8").toString("base64"))),
    "utf-8").toString("base64"));
  ko.ROWS.forEach((r) => to.push(r.to));
  // ★★★束の 行でも、★教室の 運営の 行でも ない 行き先（★2026-09-26）。
  //   ★★見本では **別の 画面の 中から** 押します。★束には 出て きません。
  //   ★★★それでも 表に 要ります ── ★`moreSection` を 開く 道は 1つ だから です。
  //     ★★ここに 名と 親を 書きます。★書いて あれば 通します。
  //       ★打ち間違えれば、★名が 合わず 落ちます（★較正 済み）。
  const 別の親 = {
    "見た目を選ぶ": "経歴（★見本 `nRep` の 行「見た目を 選ぶ」）",
    "日を選ぶ": "しらべる（★受診用の 1枚）"
  };
  Object.keys(別の親).forEach((k) => to.push(k));
  const 迷 = 鍵.filter((k) => !to.includes(k));
  t(迷.length === 0,
    `★出どころの 無い 鍵が ない${迷.length ? "（★" + 迷.join("／") + "）" : ""}`);

  Object.entries(別の親).forEach(([k, v]) => {
    t(鍵.includes(k) && !!v.trim(), `★${k} …… 親を 書いて ある（${v.slice(0, 20)}…）`);
  });

  console.log("=== 二 ★`canGo` と `onGo` は 同じ 表から ===");
  t(/const 束へ行ける = \(to\) => typeof 束の行き先\[to\] === "function"/.test(vt),
    "★行ける かは 表を 引いて いる");
  t(/const f = 束の行き先\[to\]/.test(vt), "★開く のも 同じ 表を 引いて いる");
  t(/canGo=\{束へ行ける\}/.test(vt), "★画面に 同じ ものを 渡して いる");
  t(/onGo=\{束を開く\}/.test(vt), "★押した ときも 同じ 表");

  console.log("=== 三 ★出す 行の 無い 束は、★入口ごと 出ない ===");
  // ★★`canGo` を 与えた ときと、★何も 通さない ときを 比べます。
  const 行ける = (x) => 鍵.includes(x);
  const 出る = m.entrancesOf({ hasClass: true, canGo: 行ける }).map((b) => b.key);
  const 空 = m.BUNDLES.filter((b) => m.groupsOf(b, 行ける).length === 0);
  空.forEach((b) => t(!出る.includes(b), `★${b} …… 中身が 無い ので 入口も 出ない`));
  t(出る.length > 0, `★出る 入口が ある（${出る.length} つ ／ ${出る.join("・")}）`);
  // ★★教室を 持たない 方には 学校の 行を 出しません（★見本と 同じ）。
  const 教室なし = m.entrancesOf({ hasClass: false, canGo: 行ける }).map((b) => b.key);
  t(!教室なし.includes("学校の機能"), "★教室が 無い 方に 学校の 行を 出さない");

  console.log("=== 四 ★`readyAt` の 無い 行は 出ない ===");
  let 未 = 0, 出 = 0;
  m.BUNDLES.forEach((b) => {
    m.groupsOf(b, () => true).forEach((g) => g.rows.forEach((r) => {
      出 += 1; if (!r.readyAt) 未 += 1;
    }));
  });
  t(未 === 0, `★日付の 無い 行が 出て いない（出る ${出} 行 ／ 日付なし ${未}）`);

  console.log("=== 五 ★下の 2行（★約束） ===");
  t(m.ENTRANCE_NOTES.includes("ここに 無いものは、下の タブに あります。"),
    "★「ここに 無いものは、下の タブに あります。」");
  t(m.ENTRANCE_NOTES.includes("（きょう・記録・ふりかえる・ノート・ひつじ）"),
    "★帯の 5つを 名のって いる");
  // ★★約束した とおり、★帯は 5つ です。
  const tabs = (m.ENTRANCE_NOTES.join("").match(/きょう|記録|ふりかえる|ノート|ひつじ/g) || []).length;
  t(tabs === 5, `★5つ 書いて ある（いま ${tabs}）`);

  console.log(`\n${pass} 通り ／ ${fail} 落ち`);
  if (fail) process.exit(1);
}
main();
