// ============================================================================
// 色の 名前が、★本当に あるか ── 見張り（★2026-09-11・実機の ご報告から）
//
//   ★★何が 起きたか。
//     components/OwnedLedger.jsx に background: C.bg と 書いていました。
//     ★★lib/tokens.js に bg は ありません。
//     ★★undefined に なり、★背景が 透けて、下の 画面が 写っていました。
//
//   ★★なぜ 気づけなかったか。
//     ★JavaScript は、★無い 名前を 読んでも 落ちません。undefined に なるだけです。
//     ★build も lint も 通ります。★実機でしか 見えません。
//     ★★同じ 形の 事故が、この家に もう 1つ ありました ──
//       ★optionalFields is not defined（★no-undef を 足す きっかけ）。
//       ★あちらは 変数、★こちらは 物の 中の 名前です。★lint は 見ません。
//
//   ★★だから、★C.◯◯ と 書いた 名前を、★ぜんぶ 数えます。
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode, ROOT } = require("./_source");

let failed = 0;
function ok(cond, label) {
  if (cond) console.log("  ok  " + label);
  else { console.log("  NG  " + label); failed++; }
}

/**
 * ★物の 中の 名前を、★かっこを 数えて 拾います。
 *
 *   ★★1行で 書いた もの（RADIUS）と、★何行にも 書いた もの（TYPE）が あります。
 *   ★★はじめ「行頭 2字下げ」だけを 数えて、★1行の ものを 見落としました。
 *     ★道具の 間違いで「無い」と 言いました。★数え方を 直しました。
 */
function membersOf(file, name) {
  const src = readCode(...file.split("/"));
  const at = src.indexOf(`export const ${name} = {`);
  if (at < 0) return null;
  let depth = 0, i = src.indexOf("{", at), end = i;
  for (; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") { depth--; if (depth === 0) { end = i; break; } }
  }
  const body = src.slice(src.indexOf("{", at) + 1, end);
  let d = 0, out = new Set(), cur = "";
  for (let k = 0; k < body.length; k++) {
    const c = body[k];
    if (c === "{" || c === "[") d++;
    else if (c === "}" || c === "]") d--;
    else if (d === 0) {
      if (c === ",") { cur = ""; continue; }
      if (c === ":") { const m = /([a-zA-Z][a-zA-Z0-9]*)\s*$/.exec(cur); if (m) out.add(m[1]); cur = ""; continue; }
      cur += c;
    }
  }
  return out;
}

const known = membersOf("lib/tokens.js", "C");

console.log("① 色の 一覧が 読めている");
ok(known.size >= 8, `★${known.size} 色（${[...known].slice(0, 5).join("・")}…）`);
ok(known.has("paper") && known.has("card") && known.has("ink"), "★おもな 色が ある");
ok(!known.has("bg"), "★bg は 無い（★これが 事故の もとでした）");

console.log("①-2 ★形（TYPE・SPACE・RADIUS）の 名前も 数える");
// ★★2026-09-11、★TYPE.note と RADIUS.pill が ありませんでした。
//   ★★TYPE.note は、★Note と Warn が 読んでいました。
//     ★undefined を 展開しても JS は 落ちません。★何も 起きないだけです。
//     ★→ ★但し書きの 字の 大きさも 色も、★1つも 効いていませんでした。
//   ★C だけを 数えていて、★形の ほうを 数えていませんでした。
const BAGS = [
  { as: "TYPE", from: "lib/uiKit.js" },
  { as: "SPACE", from: "lib/uiKit.js" },
  { as: "RADIUS", from: "lib/uiKit.js" }
];

console.log("② C.◯◯ と 書いた 名前が、ぜんぶ ある");
const files = [];
["components", "lib", "app"].forEach((d) => (function walk(x) {
  for (const f of fs.readdirSync(x, { withFileTypes: true })) {
    const p = path.join(x, f.name);
    if (f.isDirectory()) { if (!/^(tests|node_modules|\.next)$/.test(f.name)) walk(p); }
    else if (/\.(js|jsx)$/.test(f.name)) files.push(path.relative(ROOT, p));
  }
})(path.join(ROOT, d)));

const bad = [];
files.forEach((rel) => {
  if (rel === path.join("lib", "tokens.js")) return;
  const code = readCode(...rel.split(path.sep));
  // ★★C.◯◯ の 形だけを 見ます。★C は tokens の 色の 束です。
  [...code.matchAll(/\bC\.([a-zA-Z][a-zA-Z0-9]*)\b/g)].forEach((m) => {
    if (!known.has(m[1])) bad.push(`${rel} → C.${m[1]}`);
  });
});
ok(bad.length === 0, "★無い 色を 読んでいる ところが ない"
  + (bad.length ? "（" + [...new Set(bad)].slice(0, 5).join(" / ") + "）" : ""));

BAGS.forEach((bag) => {
  const set = membersOf(bag.from, bag.as);
  ok(set && set.size > 0, `★${bag.as} の 一覧が 読める（${set ? set.size : 0}）`);
  if (!set) return;
  const miss = [];
  files.forEach((rel) => {
    if (rel === bag.from.split("/").join(path.sep)) return;
    const code = readCode(...rel.split(path.sep));
    [...code.matchAll(new RegExp(`\\b${bag.as}\\.([a-zA-Z][a-zA-Z0-9]*)\\b`, "g"))].forEach((m) => {
      if (!set.has(m[1])) miss.push(`${rel} → ${bag.as}.${m[1]}`);
    });
  });
  ok(miss.length === 0, `★無い ${bag.as} を 読んでいない`
    + (miss.length ? "（" + [...new Set(miss)].slice(0, 4).join(" / ") + "）" : ""));
});

console.log("③ 背景を 決めずに、画面を 覆っていない");
// ★★画面いっぱいを 覆う 1枚は、★必ず 背景を 持つこと。
//   ★★持たないと、★下の 画面が 透けます。
files.filter((rel) => rel.endsWith(".jsx")).forEach((rel) => {
  const code = readCode(...rel.split(path.sep));
  // ★position: "fixed" と inset: 0 が 同じ 塊に あるとき
  [...code.matchAll(/position: "fixed", inset: 0[\s\S]{0,260}?\}/g)].forEach((m) => {
    const blk = m[0];
    // ★暗くする ための 覆いは、★rgba を 持っています。★それは 別です。
    if (/rgba\(/.test(blk)) return;
    ok(/background:/.test(blk), `★${rel} の 覆いが 背景を 持っている`);
  });
});

console.log(failed === 0 ? "\n全て ok" : "\n" + failed + "件 NG");
process.exit(failed === 0 ? 0 : 1);
