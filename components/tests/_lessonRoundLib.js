// ★`lib/lessonRound.js` を CommonJS から 読む ための 小さな 橋（★2026-09-24）。
//   ★★束は ES の 形 です。★見張りは CommonJS です。
//   ★★写しを 作りません ── ★その場で 読み、★`export` を 外して 動かします。
const fs = require("fs");
const path = require("path");
const src = fs.readFileSync(
  path.join(__dirname, "..", "..", "lib", "lessonRound.js"), "utf8");
const 本 = src
  .replace(/^import[^;]*;$/gm, "")
  .replace(/^export (const|function|let)/gm, "$1")
  .replace(/^export \{[^}]*\};?$/gm, "");
const m = { exports: {} };
// eslint-disable-next-line no-new-func
new Function("module", "exports", 本 + "\n;module.exports = { hubCounts, HUB_NOTES, HUB_STEPS, HUB_WARN };")(m, m.exports);
module.exports = m.exports;
