#!/usr/bin/env node

// ============================================================================
// 数える ── ★画面（52）／ 下位画面 SC（76）／ シート SH（22）
//
//   ★出どころ 坂本さん経由 Opus の お指図（★2026-09-11・台帳 第3版）
//     「以下、3つを、明確に、区別してください。
//       ①画面：52（functions.md の単位）
//       ②下位画面（SC）：スマホ版で76
//       ③シート（SH）：スマホ版で22
//       これらを、混ぜて、1つの数にしないでください。
//       数を、報告する際は、必ず、単位を、明記してください。」
//     「『そろう』の意味は、枚数を、決め打ちしません。対象は、A群・B群・J群に
//       属する、すべての画面（下位画面・シートを含む）です。
//       枚数は、Code が、数えて、報告してください。」
//
//   ★★どう 数えるか
//     ★① 見本の コードから、★SC[] と SH[] の 名前を そのまま 取ります。
//     ★② その 1つ 1つが、★どこから 開かれるかを 辿ります。
//       ★★push('X') ／ openSheet('X') の 書いて ある 場所を 探し、
//         ★その 場所を 囲んで いる 関数（★S_きょう ／ SC['…'] ／ SH['…']）を
//         ★★見つけます。★それを 何度か 繰り返して、★根まで 上がります。
//     ★③ 根（★5つの タブ）と、★functions.md の 群を 結びます。
//
//   ★★私が 決めて いる ところは、★1つだけです ── ③の 結び方。
//     ★下の ROOT_GROUP に 書きます。★ここだけ 人の 判じです。
//     ★★どこにも 辿れない ものは「★根なし」と 出します。★黙って 振り分けません。
//
//   使い方  node tools/count-screens.js
// ============================================================================

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const M = fs.readFileSync(path.join(ROOT, "docs", "design", "pack-final",
  "00-動く見本（さわれる・全画面）.html"), "utf8");

/**
 * ★根（★見本の 5つの タブ）と、★functions.md の 群。
 *
 *   ★★ここだけが 人の 判じです。★出どころを 書きます。
 *     ★S_kyou　　 functions.md A01・A02
 *     ★S_kiroku　 functions.md A03
 *     ★S_furi　　 functions.md A04・A05（並べる・さかのぼる）＝ A群
 *     　　　　　　 ／ B01〜B04（くらべる・かぞえる）＝ B群
 *       ★★1つの タブに 2つの 群が 乗って います。
 *         ★だから、★ふりかえる から 開く ものは「A/B」と 出します。
 *         ★★勝手に どちらかに 寄せません。
 *     ★S_note　　 functions.md A06
 *     ★S_hitsuji　functions.md A07・A08 ／ J01〜J06
 *       ★★ここも 2つの 群が 乗って います。★「A/J」と 出します。
 */
const ROOT_GROUP = {
  S_kyou: "A",
  S_kiroku: "A",
  S_furi: "A/B",
  S_note: "A",
  S_hitsuji: "A/J",
  // ★★運営モード（★見本 1651行〜）。★functions.md の D・F・G・H です。
  //   ★★スマホ版の 見本なので、★F（PC・iPad）は 別の 見本に あります。
  //     ★ここでは「運営」と まとめて 出します。★A・B・J では ない、が 大事です。
  S_op: "運営"
};

const names = {
  sc: [...new Set([...M.matchAll(/SC\['([^']*)'\]\s*=/g)].map((m) => m[1]))],
  sh: [...new Set([...M.matchAll(/SH\['([^']*)'\]\s*=/g)].map((m) => m[1]))]
};

/** ★その 場所を 囲んで いる 関数の 名前。 */
function ownerAt(pos) {
  const head = M.slice(0, pos);
  const marks = [
    ...head.matchAll(/SC\['([^']*)'\]\s*=\s*function/g),
    ...head.matchAll(/SH\['([^']*)'\]\s*=\s*function/g),
    ...head.matchAll(/function (S_[a-zA-Z]+)\s*\(/g)
  ].map((m) => ({ at: m.index, name: m[0].startsWith("SC[") ? "SC:" + m[1]
    : (m[0].startsWith("SH[") ? "SH:" + m[1] : m[1]) }));
  if (!marks.length) return null;
  marks.sort((a, b) => a.at - b.at);
  return marks[marks.length - 1].name;
}

/** ★その 名前を 開く ところ ぜんぶ。 */
function openersOf(kind, name) {
  const esc = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const fn = kind === "sc" ? "push" : "openSheet";
  const re = new RegExp(fn + "\\(\\\\?'" + esc + "\\\\?'", "g");
  const out = [];
  let m;
  while ((m = re.exec(M))) {
    const o = ownerAt(m.index);
    if (o) out.push(o);
  }
  // ★★rowIn(…, 'ねむり') のように、★名前を 組み立てて 開く ものも あります。
  if (!out.length && kind === "sh") {
    const re2 = new RegExp("rowIn\\([^)]*'" + esc + "'", "g");
    while ((m = re2.exec(M))) {
      const o = ownerAt(m.index);
      if (o) out.push(o);
    }
  }
  return [...new Set(out)];
}

/** ★根（S_…）まで 上がります。 */
function rootsOf(kind, name, seen) {
  const key = kind + ":" + name;
  const been = seen || new Set();
  if (been.has(key)) return [];
  been.add(key);
  const ups = openersOf(kind, name);
  const out = [];
  ups.forEach((u) => {
    if (/^S_/.test(u)) { out.push(u); return; }
    const [k, n] = u.split(":");
    out.push(...rootsOf(k === "SC" ? "sc" : "sh", n, been));
  });
  return [...new Set(out)];
}

const rows = [];
const tally = {};
function add(g) { tally[g] = (tally[g] || 0) + 1; }

["sc", "sh"].forEach((kind) => {
  names[kind].forEach((n) => {
    const roots = rootsOf(kind, n);
    const gs = [...new Set(roots.map((r) => ROOT_GROUP[r] || "？").flatMap((x) => x.split("/")))];
    const g = roots.length === 0 ? "★根なし" : gs.sort().join("/");
    rows.push({ kind: kind.toUpperCase(), name: n, roots: roots.join("／") || "──", group: g });
    add(g);
  });
});

// ── 出します
const out = [];
out.push("# 数えた 結果 ── 画面（52）／ 下位画面 SC（76）／ シート SH（22）");
out.push("");
out.push("★この 表は tools/count-screens.js が 書き出します。★手で 書いて いません。");
out.push("★名前は 見本の コードから そのまま 取って います。");
out.push("");
out.push("## ★単位ごとの 数");
out.push("");
out.push("| 単位 | 数 | 出どころ |");
out.push("|---|---|---|");
out.push("| ①画面 | **52** | functions.md（★A11＋B4＋C3＋D6＋E4＋F8＋G7＋H3＋J6） |");
out.push("| ②下位画面（SC） | **" + names.sc.length + "** | 見本の `SC['…']` |");
out.push("| ③シート（SH） | **" + names.sh.length + "** | 見本の `SH['…']` |");
out.push("");
out.push("★★混ぜて いません。★別の 単位です。");
out.push("");
out.push("## ★SC・SH を、★どの 群から 開くか");
out.push("");
out.push("| 群 | SC・SH の 数 |");
out.push("|---|---|");
Object.keys(tally).sort().forEach((g) => out.push("| " + g + " | " + tally[g] + " |"));
out.push("");

const target = rows.filter((r) => /A|B|J/.test(r.group) && r.group !== "★根なし");
out.push("## ★①「そろう」の 対象");
out.push("");
out.push("A群・B群・J群 から 開く 下位画面・シート ── **" + target.length + " 枚**");
out.push("");
out.push("| 単位 | 名前 | 根（見本の タブ） | 群 |");
out.push("|---|---|---|---|");
rows.filter((r) => r.group === "★根なし").forEach((r) =>
  out.push("| " + r.kind + " | " + r.name + " | ★どこからも 開きません | ★根なし |"));
out.push("");
out.push("### ★群ごと");
out.push("");
["A", "A/B", "A/J", "B", "J"].forEach((g) => {
  const list = rows.filter((r) => r.group === g);
  if (!list.length) return;
  out.push("**" + g + "　" + list.length + "枚**");
  out.push("");
  out.push(list.map((r) => r.kind + "-" + r.name).join(" ／ "));
  out.push("");
});
const other = rows.filter((r) => !["A", "A/B", "A/J", "B", "J", "★根なし"].includes(r.group));
out.push("### ★A・B・J の 外");
out.push("");
out.push(other.length ? other.map((r) => r.kind + "-" + r.name + "（" + r.group + "）").join(" ／ ") : "（★ありません）");
out.push("");

fs.writeFileSync(path.join(ROOT, "docs", "reports", "_screen-count.md"), out.join("\n") + "\n", "utf8");
console.log(out.join("\n"));
