#!/usr/bin/env node
/**
 * 同じファイルの、使われていない写しが残っていないか（2026-08-31）
 *
 * ★なぜ要るか
 *   このリポジトリの履歴は GitHub の Web UI からの
 *   「Add files via upload」の連続で、いくつかのファイルが
 *   ★import されない写しとして二重に残っていました。
 *
 *     components/VocalTracker.jsx   ←→  VocalTracker.jsx（リポジトリ直下）
 *     app/api/feedback/route.js     ←→  feedback_route.js
 *     components/HealthInfo.jsx     ←→  lib/HealthInfo.jsx
 *     lib/healthInfoContent.js      ←→  lib/lib/healthInfoContent.js
 *
 *   直下の VocalTracker.jsx は 12,213 行で、生きている側より
 *   ★4,583 行も古いまま残っていました（最終更新 2026-08-26）。
 *   同じ関数が2つあるので、片方を直しても画面は1ミリも変わりません。
 *   ★「直したのに変わらない」は、ここから生まれます。
 *
 * ★このテストは、写しが戻ってきたら落ちます。
 */
const fs = require("fs");
const path = require("path");
let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

const ROOT = path.join(__dirname, "..", "..");

console.log("=== ★使われていない写しが無い ===");
const GONE = [
  ["VocalTracker.jsx", "components/VocalTracker.jsx"],
  ["feedback_route.js", "app/api/feedback/route.js"],
  ["lib/HealthInfo.jsx", "components/HealthInfo.jsx"],
  ["lib/lib/healthInfoContent.js", "lib/healthInfoContent.js"],
  // ★2026-09-01 に削除。どこからも import されていないのに、
  //   entries の健康の列（服薬・気持ち・声のメモ）を丸ごと select していました。
  //   使われていないものは、いつか使われます（今日2度その形の不具合を直しました）。
  //   生きているのは app/admin/page.js のほうです。
  ["components/AdminDashboard.jsx", "app/admin/page.js"]
];
GONE.forEach(([stale, live]) => {
  assertTrue(!fs.existsSync(path.join(ROOT, stale)),
    `★${stale} が無い（生きているのは ${live}）`);
  assertTrue(fs.existsSync(path.join(ROOT, live)), `${live} はある`);
});

console.log("\n=== ★同じ名前の関数が2つ以上ない ===");
// 画面に出る大きな関数は、定義が1つだけであること。
function definitionsOf(name) {
  const found = [];
  const walk = (dir) => {
    fs.readdirSync(dir, { withFileTypes: true }).forEach((d) => {
      const p = path.join(dir, d.name);
      if (d.isDirectory()) {
        if (["node_modules", ".next", ".git", "docs", "tests"].includes(d.name)) return;
        walk(p);
      } else if (/\.(js|jsx)$/.test(d.name)) {
        if (new RegExp(`function ${name}\\s*\\(`).test(fs.readFileSync(p, "utf8"))) {
          found.push(path.relative(ROOT, p));
        }
      }
    });
  };
  walk(ROOT);
  return found;
}
["getCorrelationData", "CorrelationScatter", "entryToRow", "rowToEntry"].forEach((fn) => {
  const defs = definitionsOf(fn);
  assertTrue(defs.length === 1, `★${fn} の定義は1つだけ（${defs.join(" / ") || "見つからない"}）`);
});

console.log("\n=== 生きている VocalTracker は1つだけ ===");
const importers = [];
const walk2 = (dir) => {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((d) => {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) {
      if (["node_modules", ".next", ".git", "tests"].includes(d.name)) return;
      walk2(p);
    } else if (/\.(js|jsx)$/.test(d.name)) {
      const src = fs.readFileSync(p, "utf8");
      const m = /from\s+"([^"]*VocalTracker[^"]*)"/.exec(src);
      if (m) importers.push(`${path.relative(ROOT, p)} → ${m[1]}`);
    }
  });
};
walk2(path.join(ROOT, "app"));
assertTrue(importers.length === 1, `import しているのは1か所（${importers.join(", ")}）`);
assertTrue(importers[0] && importers[0].includes("@/components/VocalTracker"),
  "★import 先は components/VocalTracker.jsx");

console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
process.exit(failCount === 0 ? 0 : 1);
