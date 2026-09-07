// ============================================================================
// /api/version の flags は、実際に読まれている変数だけを並べる（2026-09-07）
//
//   ★★2026-09-07、★NEXT_PUBLIC_PAID_GATE_USER_IDS を並べてしまいました。
//     ★どこからも読まれていない名前で、★いつも false を返します。
//     ★★「何か足りない」と読めて、★坂本さんを迷わせました。
//
//   ★規則：書いている値は、必ずどこかで読まれているか。
// ============================================================================

const { readCode } = require("./_source");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
let failed = 0;
function ok(name, cond, extra) {
  if (cond) { console.log("  ○ " + name); return; }
  failed++; console.log("  ✗ " + name + (extra ? "\n      " + extra : ""));
}

const route = readCode("app", "api", "version", "route.js");

// ★flags の中だけを見ます。
//   ★★上の commit を出すところにも NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA があります。
//     ★あれは Vercel が入れるもので、★こちらの旗ではありません。
const flagsBlock = route.slice(route.indexOf("flags: {"),
  route.indexOf("}", route.indexOf("flags: {")));
const watched = [...flagsBlock.matchAll(/process\.env\.(NEXT_PUBLIC_[A-Z_]+)/g)].map((m) => m[1]);

console.log("■ 並べた変数が、どこかで読まれているか");
// ★アプリの側（route 以外）で、その名前が使われているかを見ます。
const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === ".next" || e.name.startsWith(".")) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(js|jsx)$/.test(e.name) && !p.includes("api/version")
             && !p.includes("components/tests")) files.push(p);
  }
})(ROOT);
const all = files.map((p) => fs.readFileSync(p, "utf-8")).join("\n");

for (const name of watched) {
  ok(`${name} は、どこかで読まれている`, all.includes(name),
    "★どこからも読まれていません。★外すか、読む場所を作ってください。");
}
ok("並べた数が1つ以上", watched.length > 0);

console.log("■ 値そのものを、返していないこと");
// ★★中身は、人を指す ID です。★外へ出しません。
ok("★真偽だけを返している",
  watched.every((n) => new RegExp(
    `process\\.env\\.${n} \\|\\| ""\\)\\.trim\\(\\) !== ""`).test(flagsBlock)),
  flagsBlock.replace(/\s+/g, " ").slice(0, 120));

console.log(failed === 0 ? "\n✅ すべて通りました" : "\n❌ " + failed + " 件");
process.exit(failed === 0 ? 0 : 1);
