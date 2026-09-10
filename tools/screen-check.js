// ============================================================================
// 1画面ぶんの 突き合わせ（★2026-09-11・全画面の 見直し）
//
//   ★観点（★坂本さんの ご指示）
//     ① 見た目（★色・置きかた・文字の 大きさ・余白）
//     ② 押した ときの 詳細・遷移（★古い 実装が 残っていないか）
//     ③ データの 表示（★名前と 中身の 混同が ないか）
//     ④ ボタンが 実際に 効くか
//
//   ★★③は 機械で 当てられません。★けれど「札の 言葉」と
//     ★「読んでいる 欄」を 並べて 出せば、★目で 見やすく なります。
//
//   使い方  node tools/screen-check.js A01
// ============================================================================

const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const { readCode, readRaw } = require(path.join(ROOT, "components/tests/_source"));

// ★どの 画面が、どの 部品で できているか。★ここだけは 手で 書きます。
// ★★言葉は 部品の 中だけでは ありません。
//   ★★決めごとの 一枚（lib/…）が 持っている ものが たくさん あります。
//     ★はじめ 部品だけを 見て、★lib の 言葉を ぜんぶ「無い」と 出していました。
const MAP = {
  A01: { mihon: "A01-きょう生徒", parts: ["HomeV2", "TodayBand"], libs: ["todayBand", "todayCard"] },
  A02: { mihon: "A02-きょう先生出欠の帯", parts: ["TodayBand"], libs: ["todayBand", "viewAs", "lessonCounts"] },
  A03: { mihon: "A03-記録2タップで完成", parts: ["RecordV2Head", "RecordSheets"], libs: ["recordV2", "recordSheets", "fieldGroups"] },
  A04: { mihon: "A04-ふりかえるならべる", parts: ["LookBackV2", "LineUpChart"], libs: ["lineUp"] },
  A05: { mihon: "A05-ふりかえるさかのぼる", parts: ["LookBackV2", "LookBackPanel", "RangeCalendar"], libs: ["lookBack", "rangeCalendar"] },
  A06: { mihon: "A06-ノート", parts: ["NotesV2"], libs: ["notes", "practiceNote"] },
  A07: { mihon: "A07-ひつじながめる既定", parts: ["CharacterHome"], libs: ["homeDrawer", "sheepSpeech"] },
  A08: { mihon: "A08-ひつじしたく引き出し", parts: ["HomeDrawer", "WardrobePanel", "DrawerItemGrid"], libs: ["homeDrawer", "drawerItems"] },
  A09: { mihon: "A09-ひつじさがす別画面", parts: ["DrawerSearch"], libs: ["drawerSearch"] },
  A10: { mihon: "A10-歯車もっと", parts: ["UiV2", "DailyAskPicker"], libs: ["moreMenu", "dailyAsk"] },
  A11: { mihon: "A11-運営モード別のシェル", parts: ["OpsShell", "OpsHome"], libs: ["opsShell", "opsPerms"] }
};

const key = (process.argv[2] || "").toUpperCase();
const spec = MAP[key];
if (!spec) { console.log("使い方: node tools/screen-check.js A01"); process.exit(1); }

const P = path.join(ROOT, "docs/design/pack-final/screens");
const html = fs.readFileSync(path.join(P, spec.mihon + ".html"), "utf8");
const txtPath = path.join(P, spec.mihon + ".txt");
const txt = fs.existsSync(txtPath) ? fs.readFileSync(txtPath, "utf8") : "";

// ★実装の 本文（★注記を 外した もの）
// ★★下タブは、どの 画面にも 出ます。★いつも 足します。
//   ★はじめ 入れ忘れて、★「ふりかえる」が どの 画面でも「無い」と 出ていました。
const parts = [...spec.parts, "TabBarV2"];
const code = parts.map((n) => {
  const p = path.join(ROOT, "components", n + ".jsx");
  return fs.existsSync(p) ? readCode("components", n + ".jsx") : "";
}).join("\n");
const vt = readCode("components", "VocalTracker.jsx");
const libs = (spec.libs || []).map((n) => {
  const p = path.join(ROOT, "lib", n + ".js");
  return fs.existsSync(p) ? readCode("lib", n + ".js") : "";
}).join("\n");
// ★★下タブなどの 言葉は lib/translations.js に あります。★いつも 足します。
const tr = readCode("lib", "translations.js");
const all = code + "\n" + libs + "\n" + vt + "\n" + tr;

console.log(`══════ ${key}　${spec.mihon}`);
console.log(`　部品 ${spec.parts.join(" / ")}\n`);

// ── ① 見た目 ── 見本の CSS の 数と、実装の 数
console.log("① 見た目 ── 見本の CSS の 数");
const css = html.slice(html.indexOf("<style>") + 7, html.indexOf("</style>"));
const rules = [...css.matchAll(/\.([a-z0-9 .]+)\{([^}]*)\}/g)];
const sizes = new Map();
rules.forEach((m) => {
  const fs2 = /font-size:\s*([0-9.]+)px/.exec(m[2]);
  if (fs2) sizes.set("." + m[1].trim(), fs2[1]);
});
[...sizes.entries()].slice(0, 14).forEach(([sel, px]) => {
  const inCode = new RegExp(`rem\\(${px.replace(".", "\\.")}\\)`).test(all)
    || new RegExp(`fontSize: ${px.replace(".", "\\.")}`).test(all);
  console.log(`　${inCode ? "○" : "★"} ${sel.padEnd(14)} ${px}px`);
});

// ── ② 画面に 出る 言葉
//
//   ★★.txt は 要素が つながった 形です（★「こえの調子ふつうあなたのふだん」）。
//     ★★あれを そのまま くらべると、★ぜんぶ「無い」に なります。★使えません。
//   ★★HTML の 中の 文字そのものを 拾います。★1つずつに なります。
console.log("\n② 画面に 出る 言葉（★HTML の 文字）");
const SAMPLE = /^(高木|井上|青木|柴田|黒田|服部|大西|斎藤|三浦|小林|田中|渡辺|佐藤|田村|坂本|山田|高橋)|ラ・ボエーム|冬の旅|からたちの花|プッチーニ|シューベルト|山田耕筰|ミミ|○○|第1ホール|音楽大学|声楽科|9:41|●●●/;
const body = html.slice(html.indexOf("</style>") + 8)
  .replace(/<svg[\s\S]*?<\/svg>/g, "")
  .replace(/<img[^>]*>/g, "");
const lines = [...new Set(
  body.split(/<[^>]+>/)
    .map((t) => t.replace(/&[a-z]+;/g, " ").trim())
    .filter((t) => t.length >= 3 && /[ぁ-んァ-ヶ一-龥]/.test(t) && !SAMPLE.test(t))
)];
let hit = 0;
lines.forEach((l) => {
  // ★★頭の 印（＋ ✓ ‹ ›）は、★別の 要素で 描いています。★外して くらべます。
  const bare = l.replace(/^[＋✓‹›\s]+/, "").replace(/[›\s]+$/, "");
  const ok = all.includes(l) || (bare.length >= 3 && all.includes(bare));
  if (ok) hit++;
  else console.log(`　★無い　${l.slice(0, 46)}`);
});
console.log(`　── ${hit}/${lines.length}`);

// ── ③ 札の 言葉と、読んでいる 欄
console.log("\n③ 札の 言葉と、読んでいる 欄（★目で 見ます）");
spec.parts.forEach((n) => {
  const p = path.join(ROOT, "components", n + ".jsx");
  if (!fs.existsSync(p)) return;
  const c = readCode("components", n + ".jsx");
  [...c.matchAll(/title=\{?["'“]([^"'”]{2,24})["'”]\}?[\s\S]{0,160}?entry\.([a-zA-Z]+)/g)]
    .forEach((m) => console.log(`　${n}　「${m[1]}」← entry.${m[2]}`));
  [...c.matchAll(/label: "([^"]{2,24})", field: "([a-zA-Z_]+)"/g)]
    .forEach((m) => console.log(`　${n}　「${m[1]}」← ${m[2]}`));
});

// ── ④ 押しどころ
console.log("\n④ 押しどころ");
spec.parts.forEach((n) => {
  const p = path.join(ROOT, "components", n + ".jsx");
  if (!fs.existsSync(p)) return;
  const c = readCode("components", n + ".jsx");
  const btn = (c.match(/<button/g) || []).length;
  const on = (c.match(/on(Click|MouseDown|PointerDown)/g) || []).length;
  const todo = (c.match(/onClick=\{\(\) => \{\s*\}\}/g) || []).length;
  console.log(`　${n.padEnd(16)} button ${btn} ／ 手 ${on} ／ ★空 ${todo}`);
});
