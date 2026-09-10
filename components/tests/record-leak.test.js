#!/usr/bin/env node

// ============================================================================
// 記録の 画面（★門の中）に、★節の 外の ものが 残っていないことの 見張り
//
//   ★出どころ docs/reports/2026-09-11-A03シートの精査.md §2
//     ★2026-09-11、★実機で「これでいい を 押した あとも 古いものが 下に 残る」
//       と ご報告を いただきました。★4件 ありました。
//
//   ★★なぜ 前の 見張りが 見落としたか
//     ★★前の 見張り（a03-kiroku）は、★**節（SectionCard）だけ**を 見ていました。
//       ★引っ越しの 仕組みも、★節にしか 効きません。
//     ★★節では ないもの（保存ボタン・案内・取り消しの帯）は 素通りし、
//       ★しかも 1枚を 開くと **1枚の 中にも** 出ていました。
//
//   ★★この見張りが すること
//     ★記録の かたまりの 中で、★節の 外に 何かを 描いている 行を 探し、
//     ★★その 上に かかっている 条件を たどって、
//       ★`!layoutV2` が 1つも 無ければ、★見落としだと 言います。
//
//   ★★白い名簿を 置きません。★「これは 出してよい」を 増やすと、
//     ★★増やした ぶんだけ 見なく なります。
//     ★出したいものが あれば、★条件に !layoutV2 か recordSheet を 書いてください。
// ============================================================================

const { readRaw } = require("./_source");

let ok = 0, ng = 0;
function t(cond, label) {
  if (cond) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label); ng++; }
}

const L = readRaw("components", "VocalTracker.jsx").split("\n");
const start = L.findIndex((l) => l.includes("<RecordSectionHost layoutV2=")) + 1;
const end = L.findIndex((l, i) => i > start && l.includes("</RecordSectionHost>")) + 1;

console.log("記録の かたまり: " + (start + 1) + " 〜 " + end);
t(start > 0 && end > start, "★記録の かたまりが 見つかる");

// ★節（SectionCard）の 中は、★引っ越しの 仕組みが 面倒を 見ます。
const inCard = new Array(L.length).fill(false);
for (let i = start; i < end; i++) {
  if (!L[i].includes("<SectionCard ")) continue;
  let d = 0, j = i;
  for (; j < end; j++) {
    d += (L[j].match(/<SectionCard[ >]/g) || []).length
      - (L[j].match(/<\/SectionCard>/g) || []).length;
    if (d <= 0 && j > i) break;
  }
  for (let k = i; k <= j; k++) inCard[k] = true;
}

/** ★その行に かかっている 条件を、★上から たどって 集めます。 */
function guardsOf(target) {
  let depth = 0;
  const stack = [];
  for (let i = start; i < target - 1; i++) {
    const line = L[i];
    const opensCond = /\{[^}]*&&\s*\($/.test(line) || /\{[^}]*\?\s*\($/.test(line);
    const o = (line.match(/\(/g) || []).length;
    const c = (line.match(/\)/g) || []).length;
    if (opensCond) stack.push({ text: line.trim(), d: depth });
    depth += o - c;
    while (stack.length && depth <= stack[stack.length - 1].d) stack.pop();
  }
  return stack.map((x) => x.text);
}

// ★何かを 画面に 描いている 行。
const DRAWS = /^\s*(<button|<div|<p |<details|<input|<select|<textarea|<label|<Number|<Dot|<Tag|<Period|<Voice|<Section(?!Card))/;

const leaks = [];
for (let i = start; i < end; i++) {
  if (inCard[i]) continue;
  if (!DRAWS.test(L[i])) continue;
  const g = guardsOf(i + 1);
  // ★★門の外だけに 出す か、★1枚が 開いていない ときだけ 出す なら よい。
  const guarded = g.some((x) => /!layoutV2/.test(x) || /!recordSheet/.test(x));
  if (!guarded) leaks.push({ line: i + 1, text: L[i].trim().slice(0, 70), guards: g.slice(-2) });
}

console.log("\n★節の 外で、★門の中にも 出ているもの: " + leaks.length + " 件");
leaks.forEach((x) => {
  console.log("    " + x.line + ": " + x.text);
  x.guards.forEach((y) => console.log("        条件 " + y.slice(0, 78)));
});
t(leaks.length === 0,
  "★記録の 画面（門の中）に、★節の 外の ものが 残っていない");

// ★★ご報告の 4つを、★名指しで 見張ります（★同じものが 戻らないため）。
const raw = L.join("\n");
[
  ['t("saveButton")', "この日の記録を保存"],
  ["undoableSave &&", "取り消しの 帯"],
  ["夜に、睡眠や食事をまとめて記録します", "一日の記録への 案内"]
].forEach(([needle, name]) => {
  const at = [];
  L.forEach((l, i) => { if (i >= start && i < end && l.includes(needle)) at.push(i + 1); });
  at.forEach((n) => {
    // ★★その行 自身にも 条件が 書けます（★{!layoutV2 && undoableSave && (）。
    //   ★上だけを 見ると、★同じ行の 条件を 見落とします。
    const own = L[n - 1];
    t(guardsOf(n).some((x) => /!layoutV2/.test(x)) || /!layoutV2/.test(own),
      `★「${name}」（${n}行）は 門の外だけ`);
  });
});

console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
process.exit(ng === 0 ? 0 : 1);
