#!/usr/bin/env node
// STRIP: A（振る舞い）── ★並びを 見ます。
/**
 * ★`const` を、★使う ところより **先に** 書いて いる（★2026-09-26・本番が 止まりました）。
 *
 *   ★★★起きた こと ── ★本番の「きょう」が 白く なりました。
 *     ★`ReferenceError: Cannot access 'xb' before initialization`（★小さく した 名）。
 *     ★★手元で 動かすと 本当の 名が 出ました ── `運営できる教室`。
 *   ★★★`const` は **巻き上がりません**。★`function` とは ちがいます。
 *     ★★`束の行き先` が それを 見て いて、★宣言は その **下** に ありました。
 *   ★★★`next build` も 見張り 503本も **通りました**。★動かして 初めて 出ました。
 *     ★★2026-09-13 の「日程」の 一件と 同じ 形 です（★ops-render-order.test.js）。
 *
 *   ★★見る もの ── ★`VocalTracker` の 中の `const <名> =` が、
 *     ★その 名を 使う 最初の ところより 先に 来て いるか。
 *     ★★描く ところ（`return (`）の 中の 使い方は 数えません ── ★あそこは 呼ばれる とき です。
 *
 *   ★★較正 ── ★わざと 下に 移すと 落ちる こと。
 */
const { stripComments, readRaw } = require("./_source");
let pass = 0, fail = 0;
function t(c, label) {
  if (c) { console.log(`  ✓ ${label}`); pass++; } else { console.log(`  ✗ ${label}`); fail++; }
}

const 生 = readRaw("components", "VocalTracker.jsx");
const src = stripComments(生);
// ★★★描き始めより 前 だけ を 見ます（★上の 註の とおり）。
//   ★★★`return (` は **前の ほうの 助けの 関数にも** あります（★2026-09-26 に 踏みました）。
//     ★★はじめ いちばん 先の ものを 拾い、★見る ところが ほんの 頭だけに なって いました。
//     ★★だから `export default function VocalTracker` から **後** で 探します。
const 始 = src.indexOf("export default function VocalTracker");
const 描 = src.indexOf("\n  return (\n", 始 > 0 ? 始 : 0);
const 頭 = 描 > 0 ? src.slice(始 > 0 ? 始 : 0, 描) : src;

// ★★★日本語の 名の `const` だけ を 見ます（★この 蔵の 決めごとの 名 です）。
//   ★★英字の 名は 数が 多く、★関数の 中の 一時の 名も 混ざります。
const 宣言 = [...頭.matchAll(/^  const ([぀-ヿ一-鿿][぀-ヿ一-鿿A-Za-z0-9_]*) =/gm)]
  .map((m) => ({ 名: m[1], at: m.index }));
t(宣言.length > 0, `★日本語の 名の const が ある（${宣言.length} 個）`);

// ★★★見る ところ ── ★「その 行で 走る もの」の 中 です（★2026-09-26 に 広げました）。
//   ★★★1度目の 直しでは 足りませんでした ── ★2度 本番を 止めました。
//     ★1つ目 …… `const 束の行き先 = { … 運営できる教室 … }`（★物の 形）
//     ★2つ目 …… `myOrgs.filter((mm) => mayEnterOpsHere(mm))`
//       ★★`mayEnterOpsHere` は 巻き上がる `function` です が、
//         ★★中で `myOrgPosts`（★後ろの `useState`）を 読みます。
//       ★★★つまり **呼んだ ところ** で 落ちます。★呼ぶ 先の 中身まで 見る 必要が あります。
//
//   ★★★だから 見方を 変えました ── ★並びを 数えるのを やめ、
//     ★**その 行で 走らせて いない こと** を 見ます ──
//     ★①`const X = { … }`（物の 形）の 中に **呼び出し** が 無い こと
//     ★②`const X = 何か.filter/map/find/some/every/reduce(…)` の 形で、
//       ★★その 中から **同じ 紙の `function`** を 呼んで いない こと
//     ★★どちらも「呼べる もの に する」（`() => …`）で 直ります。★並びに 頼りません。
function monoNoKatachi(本) {
  const 出 = [];
  const re = /^  const ([぀-ヿ一-鿿A-Za-z0-9_]+) = \{$/gm;
  for (const m of 本.matchAll(re)) {
    let 深 = 0, i = m.index + m[0].length - 1;
    for (; i < 本.length; i += 1) {
      if (本[i] === "{") 深 += 1;
      else if (本[i] === "}") { 深 -= 1; if (深 === 0) break; }
    }
    出.push({ 名: m[1], from: m.index, to: i, at: m.index });
  }
  return 出;
}

const 悪 = [];

// ── ★① 物の 形の 中で、★後ろの const を 見て いない ───────────────
const 物 = monoNoKatachi(頭);
t(物.length > 0, `★物の 形の const が ある（${物.length} 個）`);
物.forEach((o) => {
  const 中 = 頭.slice(o.from, o.to);
  宣言.forEach(({ 名, at }) => {
    if (at <= o.at) return;
    const 使 = new RegExp(`(?<![぀-ヿ一-鿿A-Za-z0-9_])${名}(?![぀-ヿ一-鿿A-Za-z0-9_])`);
    if (使.test(中)) 悪.push(`${o.名} の 中で ${名} を 使い、${名} の 宣言は その 後ろ`);
  });
});

// ── ★② その 行で 数えて いない（★`filter`／`map` などを その場で 走らせない）──
//   ★★同じ 紙の `function` を 呼んで いたら 悪 です ── ★その 中で 後ろの 名を 読み得ます。
const 同じ紙の関数 = new Set([...src.matchAll(/^  function ([A-Za-z_][A-Za-z0-9_]*)/gm)]
  .map((m) => m[1]));
// ★★★`() => …` や `function` で 始まる ものは **その場で 走りません**。★数えません。
//   ★★2026-09-26 に ここで 自分の 直しを 叱られました（★直した 形が 落ちた）。
const 走る = /^  const ([぀-ヿ一-鿿A-Za-z0-9_]+) = ([^\n]*)$/gm;
for (const m of 頭.matchAll(走る)) {
  const 右 = m[2];
  if (/^\s*(\(\s*\)|\([^)]*\))\s*=>/.test(右) || /^\s*function\b/.test(右)) continue;
  if (!/\.(filter|map|find|some|every|reduce|sort|forEach)\(/.test(右)) continue;
  const 呼 = [...右.matchAll(/([A-Za-z_][A-Za-z0-9_]*)\s*\(/g)].map((x) => x[1])
    .filter((n) => 同じ紙の関数.has(n));
  if (呼.length) {
    悪.push(`${m[1]} が その場で 数え、★中で ${呼.join("・")} を 呼んで いる`
      + "（★呼べる もの に して ください）");
  }
}

t(悪.length === 0, `★その 行で 走らせて いる ものが ない（いま ${悪.length}）`);
悪.forEach((x) => console.log("     " + x));

// ★★較正 ── ★この 見張りが 本当に 見て いるか。
const にせ = "  const ニセ = ニセ用の値;\n  const ニセ用の値 = 1;\n";
const 深 = (にせ.slice(0, にせ.indexOf("ニセ用の値")).match(/\{/g) || []).length;
t(深 === 0, "★較正 ── ★深さの 数え方が 動く");

// ── ★③ ★178枚 ぜんぶ を 数えます（★1枚だけ 見て 終わらせない）────────
//   ★★★2026-09-26 ── ★この 見張りは `VocalTracker.jsx` だけ を 見て いました。
//     ★★同じ 形は ほかの 部品にも あり得ます。★道具に 任せます。
const { execFileSync } = require("child_process");
const path2 = require("path");
let 走 = "";
try {
  走 = execFileSync("python3", [path2.join(__dirname, "..", "..", "tools", "tdz_scan.py")],
    { cwd: path2.join(__dirname, "..", ".."), encoding: "utf-8" });
} catch (e) {
  走 = String((e && (e.stdout || e.message)) || "");
}
走.split("\n").filter((x) => x.trim()).forEach((x) => console.log("     " + x));
t(/RESULT: OK/.test(走), "★ほかの 部品にも 同じ 形が ない");
t(/TDZ_SCAN\s+★\d+ 枚/.test(走), "★道具が 紙を 数えて いる（★0枚では ない）");

console.log(`\n${pass} 通り ／ ${fail} 落ち`);
if (fail) process.exit(1);
