// ============================================================================
// ★押しても 何も 起きない ところ／★無い 名前を 読んでいる ところ を 探す
//
//   ★きっかけ 坂本さんの ご報告（★2026-09-11）
//     「ふりかえる・ノート・羊のおうちを 含め、多数の 不具合」
//     「ボタンが、実際に、機能しているか」
//     「データの 表示が 正しいか（★名前と 中身の 混同が ないか）」
//
//   ★★きょう 出た 3件は、どれも build も lint も 通りました。
//     ★目で 見ても「動いているように 見える」形で 壊れていました。
//   ★★だから、★機械で 拾えるものを 先に 全部 拾います。
//
//   使い方  node tools/dead-controls.js
// ============================================================================

const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const { readCode } = require(path.join(ROOT, "components/tests/_source"));

const files = [];
["components", "lib", "app"].forEach((d) => (function walk(x) {
  for (const f of fs.readdirSync(x, { withFileTypes: true })) {
    const p = path.join(x, f.name);
    if (f.isDirectory()) { if (!/^(tests|node_modules|\.next)$/.test(f.name)) walk(p); }
    else if (/\.(js|jsx)$/.test(f.name)) files.push(path.relative(ROOT, p));
  }
})(path.join(ROOT, d)));

// ── ① 無い 名前を 読んでいる ところ ──────────────────────
function membersOf(file, name) {
  const src = readCode(...file.split(path.sep));
  const at = src.indexOf(`export const ${name} = {`);
  if (at < 0) return null;
  // ★★1行で 書いた もの（RADIUS）と、★何行にも 書いた もの（TYPE）が あります。
  //   ★★はじめ「行頭 2字下げ」だけを 数えて、★1行の ものを 全部 見落としました。
  //     ★RADIUS.card を「無い」と 言いました。★道具の 間違いです。
  //   ★★かっこを 数えて 切り、★その 中の 名前を ぜんぶ 拾います。
  let depth = 0, i = src.indexOf("{", at), end = i;
  for (; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") { depth--; if (depth === 0) { end = i; break; } }
  }
  const body = src.slice(src.indexOf("{", at) + 1, end);
  // ★入れ子の 中の 名前は 拾いません（★深さ 1 だけ）。
  let d = 0, out = new Set(), cur = "";
  for (let k = 0; k < body.length; k++) {
    const c = body[k];
    if (c === "{" || c === "[") d++;
    else if (c === "}" || c === "]") d--;
    else if (d === 0) {
      if (c === ",") { cur = ""; continue; }
      if (c === ":") {
        const m = /([a-zA-Z][a-zA-Z0-9]*)\s*$/.exec(cur);
        if (m) out.add(m[1]);
        cur = "";
        continue;
      }
      cur += c;
    }
  }
  return out;
}
const BAGS = [
  { as: "C", from: path.join("lib", "tokens.js"), name: "C" },
  { as: "TYPE", from: path.join("lib", "uiKit.js"), name: "TYPE" },
  { as: "SPACE", from: path.join("lib", "uiKit.js"), name: "SPACE" },
  { as: "RADIUS", from: path.join("lib", "uiKit.js"), name: "RADIUS" }
];
console.log("① ★無い 名前を 読んでいる ところ");
let bad1 = 0;
BAGS.forEach((bag) => {
  const known = membersOf(bag.from, bag.name);
  if (!known) { console.log(`  ？ ${bag.name} の 一覧が 読めません`); return; }
  const hits = [];
  files.forEach((rel) => {
    if (rel === bag.from) return;
    const code = readCode(...rel.split(path.sep));
    [...code.matchAll(new RegExp(`\\b${bag.as}\\.([a-zA-Z][a-zA-Z0-9]*)\\b`, "g"))].forEach((m) => {
      if (!known.has(m[1])) hits.push(`${rel} → ${bag.as}.${m[1]}`);
    });
  });
  const uniq = [...new Set(hits)];
  bad1 += uniq.length;
  console.log(`  ${uniq.length === 0 ? "○" : "★"} ${bag.name}（${known.size}）  ${uniq.length}件`);
  uniq.slice(0, 8).forEach((h) => console.log("      " + h));
});

// ── ② 押しても 何も 起きない ところ ──────────────────────
console.log("\n② ★押しても 何も 起きない ところ");
const dead = [];
files.filter((r) => r.endsWith(".jsx")).forEach((rel) => {
  const code = readCode(...rel.split(path.sep));
  // ★空の 手（onClick={() => {}}）
  [...code.matchAll(/on[A-Z][a-zA-Z]*=\{\(\)\s*=>\s*\{\s*\}\}/g)]
    .forEach(() => dead.push(`${rel}　空の 手`));
  // ★undefined を 渡している
  [...code.matchAll(/on[A-Z][a-zA-Z]*=\{undefined\}/g)]
    .forEach(() => dead.push(`${rel}　undefined を 渡している`));
  // ★button なのに 手が 1つも ない（★同じ 塊に onClick が 無い）
  [...code.matchAll(/<button[^>]*>/g)].forEach((m) => {
    // ★★押しどころは onClick だけでは ありません。
    //   ★はじめ onClick だけを 数えて、★onMouseDown の button を
    //   ★★「押せない」と 言いました。★道具の 間違いです。
    if (!/on(Click|PointerDown|MouseDown|TouchStart|KeyDown)|type="submit"/.test(m[0])) {
      dead.push(`${rel}　手の 無い button`);
    }
  });
});
const deadU = [...new Set(dead)];
console.log(`  ${deadU.length === 0 ? "○" : "★"} ${deadU.length}件`);
deadU.slice(0, 12).forEach((h) => console.log("      " + h));

// ── ③ 札の 名前と、出している 値の 食い違い ───────────────
console.log("\n③ ★札の 名前と、出している 値");
console.log("  ★これは 機械で 当てられません。★1画面ずつ 目で 見ます。");
console.log("  ★きょう 1件 見つけました（★ならべるの「こえ」が のどの 値）。");

// ── ④ 呼ばれていない 部品 ────────────────────────────
console.log("\n④ ★作ったのに、どこからも 呼ばれていない 部品");
const comps = fs.readdirSync(path.join(ROOT, "components"))
  .filter((f) => f.endsWith(".jsx")).map((f) => f.replace(".jsx", ""));
const all = files.map((rel) => readCode(...rel.split(path.sep))).join("\n");
const orphan = comps.filter((c) => {
  const used = new RegExp(`from "@/components/${c}"`).test(all);
  return !used;
});
console.log(`  ${orphan.length === 0 ? "○" : "★"} ${orphan.length}件`);
orphan.forEach((c) => console.log("      components/" + c + ".jsx"));

console.log(`\n★合計 ── 無い名前 ${bad1}件 ／ 押せない ${deadU.length}件 ／ 孤児 ${orphan.length}件`);
