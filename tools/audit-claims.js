#!/usr/bin/env node

// ============================================================================
// A4　売り文句と 画面の 突き合わせ
//
//   ★出どころ Woolsong 総合評価（Opus・9月10日）§2
//     「②営業資料の 売り文句と 画面の 突き合わせ（1日）
//       ── 営業資料v5 × functions.md × 画面の実物。
//       「並べる」が 上下に 並べて いなかったのは、この 検査が なかったから」
//   ★台帳-保留していること A4
//
//   ★★3つを 突き合わせます。
//     ★① functions.md　★どの 画面に 何を 置くか（★正）
//     ★② 画面の 実物　 ★撮った ときの 書き出し（json）
//     ★③ 営業資料v5　　★★PDF です。★私には 字に できません。
//       ★★だから、★①と ②だけ 機械で 回します。
//       ★★③は、★別に 突き合わせた ものが あります
//         （docs/reports/2026-09-09-営業資料の8項目-調べた結果.md）。
//
//   ★★functions.md の 各画面の 節から、★「かぎ」に なる 字を 拾います。
//     ★★私が 字を 選んで いません。★「」で 囲まれた ところと、
//       ★★★の 付いた 行を そのまま 使います。
//
//   使い方  node tools/audit-claims.js
// ============================================================================

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const FN = path.join(ROOT, "docs", "design", "pack-final", "functions.md");
const FR = path.join(ROOT, "docs", "design", "compare", "all", "frames");

/** ★functions.md の 画面の 記号 → ★撮った コマの 名前。 */
const SCREEN_OF = {
  A01: "画面-きょう",
  A03: "画面-記録",
  A04: "画面-ふりかえる-並べる",
  A05: "画面-ふりかえる-さかのぼる",
  A06: "画面-ノート-稽古",
  A10: "SC-もっと",
  B01: "画面-ふりかえる-くらべる",
  B03: "画面-ふりかえる-かぞえる",
  J04: "SC-たな"
};

function sections() {
  const src = fs.readFileSync(FN, "utf8").split("\n");
  const out = [];
  let cur = null;
  src.forEach((l) => {
    const m = l.match(/^### ([A-Z][0-9][0-9A-Z-]*)\s+(.+)$/);
    if (m) { cur = { key: m[1], title: m[2], lines: [] }; out.push(cur); return; }
    if (/^#/.test(l)) { cur = null; return; }
    if (cur) cur.lines.push(l);
  });
  return out;
}

/**
 * ★その 節の「押す」と「目的」の 行から、★画面に 出るはずの 字を 拾います。
 *
 *   ★★functions.md の 節は、★こういう 形です。
 *     目的　… ／ 読む　… ／ 書く　… ／ 押す　… ／ 出さない　…
 *   ★★「押す」の 行に、★押しどころの 名前が 並んで います。
 *     ★★これが「画面に 出て いる はず」の ものです。
 *   ★★「出さない」の 行は、★逆です。★出て いたら 誤りです。
 *     ★だから、★分けて 数えます。
 *
 *   ★★字は、★／ と ・ と 、 で 切ります。★★や （…） は 落とします。
 *     ★私が 言い換えて いません。★切って 落とすだけです。
 */
function splitItems(line) {
  return line
    .replace(/^[^　]*　/, "")
    .split(/[／・]/)
    .map((x) => x.replace(/★/g, "").replace(/（[^）]*）/g, "").replace(/→.*$/, "").trim())
    .filter((x) => x.length >= 2 && x.length <= 24);
}

function claimsOf(sec) {
  const out = { must: [], never: [] };
  sec.lines.forEach((l) => {
    if (/^押す　/.test(l)) out.must.push(...splitItems(l));
    if (/^出さない　/.test(l)) out.never.push(...splitItems(l));
  });
  // ★★「」で 囲まれた 字も 足します。★見本の 言い回しです。
  const body = sec.lines.join("\n");
  const re = /「([^「」\n]{4,40})」/g;
  let m;
  while ((m = re.exec(body))) out.must.push(m[1]);
  out.must = [...new Set(out.must)];
  out.never = [...new Set(out.never)];
  return out;
}

function textsOf(key) {
  const p = path.join(FR, key + "@390.json");
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"))
      .map((d) => String(d.text || "").replace(/\s+/g, "")).join("\n");
  } catch (e) { return null; }
}

const rows = [];
rows.push("# A4　売り文句と 画面の 突き合わせ");
rows.push("");
rows.push("★この 表は tools/audit-claims.js が 書き出します。★手で 書いて いません。");
rows.push("");
rows.push("★★functions.md の 各画面の 節から、★「」で 囲まれた 字を そのまま 拾い、");
rows.push("　★撮った 画面の 書き出しに 出て いるかを 数えます。");
rows.push("");
rows.push("★★営業資料v5 は PDF です。★私には 字に できません。");
rows.push("　★別に 突き合わせた ものが あります");
rows.push("　（docs/reports/2026-09-09-営業資料の8項目-調べた結果.md）。");
rows.push("");
rows.push("| 画面 | functions.md の 題 | 押す（出る はず） | 出て いる | **出て いない** | 出さない（出たら 誤り） | ★出て しまって いる |");
rows.push("|---|---|---|---|---|---|---|");

const missing = [];
const leaks = [];
sections().forEach((sec) => {
  const key = SCREEN_OF[sec.key];
  const c = claimsOf(sec);
  const txt = key ? textsOf(key) : null;
  if (txt == null) {
    rows.push(`| ${sec.key} | ${sec.title} | ${c.must.length} | ── 撮って いません | ── | ${c.never.length} | ── |`);
    return;
  }
  const has = (w) => txt.includes(w.replace(/\s+/g, ""));
  const hit = c.must.filter(has);
  const miss = c.must.filter((w) => !has(w));
  const leak = c.never.filter(has);
  rows.push(`| ${sec.key} | ${sec.title} | ${c.must.length} | ${hit.length} | **${miss.length}** | ${c.never.length} | ${leak.length ? "**" + leak.length + "**" : "0"} |`);
  if (miss.length) missing.push({ key: sec.key, title: sec.title, miss });
  if (leak.length) leaks.push({ key: sec.key, title: sec.title, leak });
});

rows.push("");
rows.push("## 出て いない もの（★画面ごと）");
rows.push("");
if (!missing.length) rows.push("（★1つも ありません）");
missing.forEach((m) => {
  rows.push("### " + m.key + "　" + m.title);
  rows.push("");
  m.miss.forEach((w) => rows.push("- 「" + w + "」"));
  rows.push("");
});
rows.push("## ★出さない はずが、出て しまって いる もの");
rows.push("");
if (!leaks.length) rows.push("（★1つも ありません）");
leaks.forEach((m) => {
  rows.push("### " + m.key + "　" + m.title);
  rows.push("");
  m.leak.forEach((w) => rows.push("- **「" + w + "」**"));
  rows.push("");
});
rows.push("## ★この 表の 読み方");
rows.push("");
rows.push("★★「出て いない」＝ ★不具合、とは 限りません。");
rows.push("　★functions.md の 「」には、★決まりごとの 言い方も 入ります。");
rows.push("　★（例）「出しません」「聞きません」── ★画面に 出ないのが 正しい。");
rows.push("★★だから、★この 表は **見る ところの 一覧**です。★判じるのは 人です。");
rows.push("");

fs.writeFileSync(path.join(ROOT, "docs", "reports", "_claims-matrix.md"),
  rows.join("\n") + "\n", "utf8");
console.log(rows.slice(11, 60).join("\n"));
console.log("\n★docs/reports/_claims-matrix.md に 書き出しました");
