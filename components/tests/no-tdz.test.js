// ============================================================================
// 描くたびに落ちる書き方（一時的死角）を、見つけます（2026-09-07）
//
//   ★★2026-09-07、★本番のダッシュボードが開けなくなりました。
//     ReferenceError: Cannot access 'uZ' before initialization
//
//   ★原因は1行でした。
//     ★paidGateApplies が、★subscribed を読んでいました。
//     ★その subscribed は、★1,800行ほど下で作られていました。
//
//   ★★const と let は、★書いた行より前では、★存在しないのと同じです。
//     ★var や function とは、★ここが違います（巻き上げが効きません）。
//     ★★組み立て（next build）も、★next lint も、★これを見つけません。
//       ★型の話でも、★綴りの話でもないからです。★順番の話です。
//
//   ★だから、★順番だけを見る検査を、★別に置きます。
//
//   ★見るのは「部品の本体で、宣言より前に読んでいる名前」だけです。
//     ★関数の中は見ません。★関数は、呼ばれるときには、もう作られています。
// ============================================================================

const { readRaw } = require("./_source");

let failed = 0;
function ok(name, cond, extra) {
  if (cond) { console.log("  ○ " + name); return; }
  failed++; console.log("  ✗ " + name + (extra ? "\n      " + extra : ""));
}

/**
 * ★1つの関数の中だけを見ます。
 *
 *   ★★2026-09-07、★最初はファイル全体を見て、★大量の誤りを出しました。
 *     ★別の関数の引数と、★部品の中の名前が、★たまたま同じだったためです。
 *     ★「同じ名前＝同じもの」ではありません。★関数が違えば、別のものです。
 *   ★だから、★字下げ0の関数ごとに切ってから、★その中だけで見ます。
 */
function topLevelFunctionBlocks(src) {
  const lines = src.split("\n");
  const blocks = [];
  let start = null;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (start === null && /^(export default )?function [A-Za-z0-9_$]+\s*\(/.test(l)) start = i;
    else if (start !== null && l === "}") { blocks.push({ from: start, to: i, lines: lines.slice(start, i + 1) }); start = null; }
  }
  return blocks;
}

/**
 * ★その関数の本体で、★そのまま走る行の const / let を集めます。
 *   ★字下げ2つの行だけです。★関数の中の関数は、あとから走ります。
 */
function bodyBindings(blockLines) {
  const out = [];
  blockLines.forEach((line, i) => {
    const arr = line.match(/^ {2}(?:const|let)\s+\[\s*([A-Za-z0-9_$,\s]+?)\s*\]\s*=/);
    if (arr) {
      arr[1].split(",").map((x) => x.trim()).filter(Boolean).forEach((n) => out.push({ name: n, at: i }));
      return;
    }
    const one = line.match(/^ {2}(?:const|let)\s+([A-Za-z0-9_$]+)\s*=/);
    if (one) out.push({ name: one[1], at: i });
  });
  return out;
}

/**
 * ★そのまま走る「ひとかたまり」を作ります。
 *
 *   ★★2026-09-07、★字下げ2つの行だけを見ていました。
 *     ★ところが、今回の壊れは、★こう書かれていました。
 *
 *       const paidGateApplies = !mayViewSummary({
 *         subscribed: subscribed === true,      ← ★字下げ4つ
 *       });
 *
 *     ★読んでいる行は、★字下げ4つでした。★見張りは、素通りしました。
 *     ★★1行ずつ見てはいけません。★1つの文として見ます。
 *
 *   ★字下げ2つで始まり、★それより深い行が続くあいだを、★1つの文とします。
 *   ★★その文に「=>」が入っていたら、★中身はあとから走るかもしれません。
 *     ★useMemo(() => …) が、それです。★そういう文は、飛ばします。
 *     ★見逃す側に倒します。★誤って挙げるより、ましです。
 */
function statementRuns(blockLines) {
  const runs = [];
  for (let i = 0; i < blockLines.length; i++) {
    const l = blockLines[i];
    if (!l.trim()) continue;
    if (l.match(/^ */)[0].length !== 2) continue;
    let j = i + 1;
    while (j < blockLines.length) {
      const n = blockLines[j];
      if (!n.trim()) { j++; continue; }
      if (n.match(/^ */)[0].length <= 2) break;
      j++;
    }
    runs.push({ at: i, lines: blockLines.slice(i, j) });
    i = j - 1;
  }
  return runs;
}

/**
 * ★宣言より前の、★そのまま走る文で読んでいないか。
 */
function usedBeforeDeclared(blockLines, bindings, offset) {
  const hits = [];
  const runs = statementRuns(blockLines);
  for (const b of bindings) {
    const re = new RegExp("(?<![A-Za-z0-9_$.])" + b.name.replace(/\$/g, "\\$") + "(?![A-Za-z0-9_$])");
    for (const run of runs) {
      if (run.at >= b.at) break;
      const body = run.lines.join("\n");
      // ★あとから走るものは、飛ばします。
      //   ★=> の中身、★function の中身。★呼ばれるときには、もう作られています。
      //   ★★名前つきの関数（function handlePointerUp() {…}）も同じです。
      //     ★2026-09-07、★これを飛ばしていなくて、★1件誤って挙げました。
      if (/^\s*function\s/.test(run.lines[0])) continue;
      if (/=>|function\s*\(/.test(body)) continue;
      // ★注釈と、物の名札を外してから見ます。
      const bare = body
        .replace(/\/\/.*$/gm, "")
        .replace(/([A-Za-z0-9_$]+)\s*:/g, ":");
      // ★宣言そのものは飛ばします。
      if (/^ {2}(const|let)\s/.test(run.lines[0]) && re.test((run.lines[0].split("=")[0] || ""))) continue;
      if (re.test(bare)) {
        hits.push({ name: b.name, declaredAt: b.at + offset + 1, usedAt: run.at + offset + 1,
          text: run.lines[0].trim().slice(0, 90) });
        break;
      }
    }
  }
  return hits;
}

function scan(src) {
  const out = [];
  for (const blk of topLevelFunctionBlocks(src)) {
    out.push(...usedBeforeDeclared(blk.lines, bodyBindings(blk.lines), blk.from));
  }
  return out;
}

console.log("■ この検査そのものが、見つけられること");
{
  const fake = [
    "function C() {",
    "  const a = b + 1;",
    "  const b = 2;",
    "  return a;",
    "}"
  ].join("\n");
  const hits = scan(fake);
  ok("★わざと壊した例を、見つけられる", hits.some((h) => h.name === "b"),
    JSON.stringify(hits));
}

console.log("■ 本物の画面");
for (const file of ["VocalTracker.jsx", "CharacterHome.jsx", "WardrobePanel.jsx", "SheepDressed.jsx"]) {
  const src = readRaw("components", file);
  const hits = scan(src);
  ok(`${file} に、宣言より前で読んでいる名前が無い`, hits.length === 0,
    hits.map((h) => `${h.name}: ${h.usedAt}行目で読み、${h.declaredAt}行目で作っている\n        ${h.text}`).join("\n      "));
}

console.log(failed === 0 ? "\n✅ すべて通りました" : "\n❌ " + failed + " 件");
process.exit(failed === 0 ? 0 : 1);
