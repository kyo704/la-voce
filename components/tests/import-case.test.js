#!/usr/bin/env node
// STRIP: A（振る舞い）── ★取り込みの 道を 見ます。
/**
 * ★取り込みの 大小は ファイル名と 1文字ずつ 同じ（★2026-09-26）。
 *
 *   ★★★出どころ ── ★この 日、★`@/lib/naniWoKaku` と 書きました。
 *     ★実際の 名は `naniwoKaku.js`（★小さい w）です。
 *     ★★★手元（macOS）は 大小を 見ない ので、★`next build` が **通りました**。
 *       ★★Vercel は Linux です。★あちらは 大小を 見ます ── ★落ちます。
 *     ★★★つまり「手元で 通った」が、★本番で 落ちる 形 です。
 *       ★★見張りが 無ければ、★push して 初めて 分かります。
 *
 *   ★★較正 ── ★わざと 1文字 変えると 落ちる こと。
 */
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..", "..");
let pass = 0, fail = 0;
function t(c, label) {
  if (c) { console.log(`  ✓ ${label}`); pass++; } else { console.log(`  ✗ ${label}`); fail++; }
}

// ★★実際に 在る 名を、★大小の まま 集めます。
const 実 = new Set();
["lib", "components"].forEach((d) => {
  fs.readdirSync(path.join(ROOT, d)).forEach((f) => {
    if (/\.(js|jsx)$/.test(f)) 実.add(`${d}/${f}`);
  });
});

function 歩く(d, 出) {
  fs.readdirSync(d).forEach((n) => {
    const f = path.join(d, n);
    if (fs.statSync(f).isDirectory()) {
      if (n === "tests" || n === "node_modules") return;
      return 歩く(f, 出);
    }
    if (/\.jsx?$/.test(n)) 出.push(f);
  });
  return 出;
}
const 紙 = 歩く(path.join(ROOT, "components"), 歩く(path.join(ROOT, "lib"),
  歩く(path.join(ROOT, "app"), [])));

const 悪 = [];
紙.forEach((f) => {
  const s = fs.readFileSync(f, "utf-8");
  for (const m of s.matchAll(/from\s+"@\/(lib|components)\/([A-Za-z0-9_-]+)"/g)) {
    const [, d, n] = m;
    const 候 = [`${d}/${n}.js`, `${d}/${n}.jsx`];
    if (候.some((c) => 実.has(c))) continue;
    // ★★大小を 無視すれば 在る なら、★それが この 見張りの 獲物 です。
    const 近 = [...実].filter((x) => 候.some((c) => c.toLowerCase() === x.toLowerCase()));
    悪.push(`${path.relative(ROOT, f)} …… @/${d}/${n}`
      + (近.length ? `（実際は ${近.join("／")}）` : "（★その 紙が ありません）"));
  }
});

console.log("=== ★取り込みの 名は ファイル名と 1文字ずつ 同じ ===");
t(悪.length === 0, `★ちがう ものが ない（いま ${悪.length} 件）`);
悪.forEach((x) => console.log("     " + x));

// ★★較正 ── ★大小を 見て いる ことを 確かめます。
console.log("=== ★較正（★大小を 見て いる か） ===");
t(!実.has("lib/naniWoKaku.js"), "★`naniWoKaku.js`（大きい W）は 無い");
t(実.has("lib/naniwoKaku.js"), "★`naniwoKaku.js`（小さい w）が ある");

console.log(`\n${pass} 通り ／ ${fail} 落ち`);
if (fail) process.exit(1);
