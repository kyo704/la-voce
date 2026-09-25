#!/usr/bin/env node
// STRIP: A（振る舞い）── ★幅の 数を 見ます。
/**
 * ★門の 中の 本文の はば（★2026-09-26・坂本さんの お決め）。
 *
 *   ★★★見る もの ──
 *     ①★`app/globals.css` の 数 と `lib/renraku.js` の `BODY_WIDTH` が 同じ か
 *        ★★数を 覚えません。★両方を 読んで 突き合わせます。
 *     ②★門の 外（38人）の 容れ物が **そのまま** か
 *        ★★`<main className="max-w-3xl` を 書き替えて いない こと。
 *     ③★門の 中だけに かかって いる か（★`.woolsong-v2` の 下）
 *     ④★運営（`OpsShell`）に かかって いない か（★`<main>` の 外に ある こと）
 *
 *   ★★較正 ── ★片方の 数を 変えると ①が 落ちる こと。
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
  const css = fs.readFileSync(path.join(ROOT, "app", "globals.css"), "utf-8");
  const ren = readRaw("lib", "renraku.js");
  // ★★`renraku.js` は ほかの 紙を 読み込みます。★`@/` を 解けないので、
  //   ★数だけ を 字から 取ります（★1か所 しか ありません）。
  const bw = /export const BODY_WIDTH = (\d+)/.exec(ren);
  const m = { BODY_WIDTH: bw ? Number(bw[1]) : null };
  t(m.BODY_WIDTH !== null, `★\`BODY_WIDTH\` が 読めた（${m.BODY_WIDTH}）`);

  console.log("=== 一 ★数は 1つの もと から ===");
  // ★★註を 落として から 読みます（★註に 数が 出て います）。
  const 素 = css.replace(/\/\*[\s\S]*?\*\//g, " ");
  const 規 = /\.woolsong-v2\s+main\s*\{[^}]*max-width:\s*(\d+)px/.exec(素);
  t(!!規, "★門の 中の はばが 書いて ある");
  if (規) {
    t(Number(規[1]) === Number(m.BODY_WIDTH),
      `★同じ 数（css ${規[1]} ／ BODY_WIDTH ${m.BODY_WIDTH}）`);
  }

  console.log("=== 二 ★門の 外（38人）は そのまま ===");
  const vt = readRaw("components", "VocalTracker.jsx");
  t(/<main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-16"/.test(vt),
    "★`<main>` の `max-w-3xl` を 書き替えて いない");
  // ★★`max-w-3xl` を 640 相当に すり替えて いない こと。
  t(!/max-w-\[640px\]|max-w-screen-sm/.test(vt), "★Tailwind の 幅を 別の ものに していない");

  console.log("=== 三 ★門の 中だけ ===");
  t(/\.woolsong-v2\s+main/.test(素), "★`.woolsong-v2` の 下に 書いて ある");
  // ★★門を もう1つ 作って いない こと。
  const 門 = (素.match(/\.woolsong-v2/g) || []).length;
  t(門 > 0, `★門は `.concat(`\`woolsong-v2\` 1つ（${門} か所で 使用）`));
  t(!/data-v2-width|\.layout-v2-640/.test(素), "★新しい 印を 増やして いない");

  console.log("=== 四 ★運営には かからない ===");
  const code = stripComments(vt);
  const i = code.indexOf('<main className="max-w-3xl');
  const j = code.indexOf("</main>");
  const o = code.indexOf("<OpsShell");
  t(i > 0 && j > i, "★`<main>` が 1つ ある");
  t(!(i < o && o < j), "★`OpsShell` は `<main>` の 外に ある");

  console.log(`\n${pass} 通り ／ ${fail} 落ち`);
  if (fail) process.exit(1);
}
main();
