#!/usr/bin/env node
/**
 * ③ グラフが、文字の倍率に付いてくること（2026-09-05 夜）
 *
 *   ★★実機で「グラフだけ小さいまま」とご報告がありました。
 *     ★グラフが縮んだのではありません。★まわりだけが伸びていました。
 *     ★上限（maxWidth）が px の決め打ちで、★倍率に付いてこなかったためです。
 *
 *   実行  node components/tests/graph-scaling.test.js
 */

const { readCode } = require("./_source");

let pass = 0;
let fail = 0;
function ok(label, cond) {
  if (cond) { pass += 1; console.log("  ✓ " + label); }
  else { fail += 1; console.log("  ✗ " + label); }
}

const vt = readCode("components", "VocalTracker.jsx");

console.log("\n① ★上限が、倍率に付いてくること");
// ★★px の決め打ちに戻したら、★ここで落ちます。
const capped = (vt.match(/maxWidth: "min\(100%, calc\(260px \* var\(--scale\)\)\)"/g) || []).length;
const cappedVar = (vt.match(/maxWidth: `min\(100%, calc\(\$\{width\}px \* var\(--scale\)\)\)`/g) || []).length;
// ★★2026-09-10、★偏差値の カードを 消しました（★裁定）。
//   ★★2か所 あった うちの 1つが、★その カードの 中に ありました。
//   ★★言い分は「★上限が 倍率に 付いてくること」です。★数では ありません。
//     ★1つでも 残っていれば、★その 形は 守られています。
//     ★★倍率の 付いていない 決め打ちが 無いことは、★②が 見ています。
ok(`★決め打ちの 260px を、倍率つきにした（${capped} か所）`, capped >= 1);
ok("★倍率の 付いていない 260px が 残っていない", !/maxWidth: "?min\(100%, 260px\)"?|maxWidth: 260/.test(vt));
ok(`★width を使う3つも、倍率つきにした（${cappedVar} か所）`, cappedVar === 3);
// ★★min(100%, …) を落とさないこと。★狭い画面で、はみ出します。
ok("★狭い画面でも、画面幅を超えない（min(100%, …)）",
  !/maxWidth: `calc\(\$\{width\}px \* var\(--scale\)\)`/.test(vt));

console.log("\n② ★px の決め打ちが、残っていないこと");
ok("★maxWidth: 260 が残っていない", !/maxWidth: 260\b/.test(vt));
ok("★maxWidth: width が残っていない", !/maxWidth: width\b/.test(vt));

console.log("\n③ ★目盛りの文字も、倍率に付いてくること");
// ★★SVG の座標での fontSize="7" は、★倍率に付いてきません。
//   ★rem にすると、★根の大きさに付いてきます。
ok('★fontSize="7" のような、座標での決め打ちが無い',
  !/fontSize="[0-9]/.test(vt));

console.log("\n③-2 ★グラフの高さも、倍率に付いてくること");
// ★★横だけ広がって、★高さが変わらないと、★つぶれて見えます。
//   ★決めは1か所（chartHeight）。★あちこちに calc を書かないこと。
ok("★高さの決めが、1か所にある", /function chartHeight\(px\)/.test(vt));
ok("★倍率をかけている", /calc\(\$\{px\}px \* var\(--scale\)\)/.test(vt));
// ★★2026-09-07、★18 → 17 に下げました。
//   ★声の時差マップ・快適帯・効いた習慣ランキングを外し、★図が減ったためです。
//   ★★この数は、★下げるときだけ理由を書くこと。
//     ★上げるのは自由です。★下げるのは、★消したときだけです。
const used = (vt.match(/height: chartHeight\(/g) || []).length;
ok(`★グラフの入れ物に、当てている（${used} か所）`, used >= 17);
// ★★px の決め打ちに戻したら、落ちます。
ok("★グラフの入れ物に、px の決め打ちが残っていない",
  !/width: "100%", height: [0-9]+ \}\}/.test(vt));

console.log("\n④ ★伸び縮みできる形であること（viewBox）");
// ★viewBox が無い SVG は、★width と height のままで、伸び縮みしません。
const svgs = (vt.match(/<svg[\s\S]{0,200}?>/g) || []);
const noViewBox = svgs.filter((t) => !/viewBox/.test(t));
// ★★1つだけ、意図して viewBox を持たないものがあります（Sparkline）。
//   ★文字の脇に置く、小さな線です。★大きくすると、行が崩れます。
ok(`★viewBox の無い SVG は、1つだけ（いま ${noViewBox.length}）`, noViewBox.length <= 1);
ok("★その1つは、文字の脇の小さな線（flexShrink: 0）",
  noViewBox.length === 0 || /flexShrink: 0/.test(noViewBox[0]));

// ★★進捗は、棒ではなく丸で出すこと（★2026-09-07・規約 §3-F、Opus の裁定）。
//   ★棒と割合は、★「どこまで来たか」より「まだ足りない」を強く見せます。
//   ★★同じ丸を2つ作らないこと。★ProgressDots は1つだけです。
//     ★危うく2つ目を作るところでした。★既にあるものを呼びます。
{
  const vt2 = readCode("components", "VocalTracker.jsx");
  const defs = (vt2.match(/function ProgressDots\(/g) || []).length;
  ok(`★ProgressDots の定義は1つだけ（いま ${defs}）`, defs === 1);
  // ★★2026-09-10、★解放までの 進捗そのものを 消しました（★坂本さんの お決め）。
  //   ★★言い分は「★進捗を 棒（割合）で 見せない」でした。
  //     ★見せなく なった のだから、★言い分は より 強く 満たされています。
  //   ★★残った 丸（ProgressDots）は、★鍵の かかった カードの ほうです。
  //     ★そちらは まだ ありますので、★棒に なっていないことを 見ます。
  ok("★解放までの進捗が、もう無い", vt2.indexOf("nextUnlock &&") < 0);
  const lock = vt2.indexOf("<ProgressDots current={current}");
  const nearLock = lock >= 0 ? vt2.slice(Math.max(0, lock - 700), lock + 200) : "";
  ok("★鍵の かかった カードの 進捗は、丸で 出している", lock >= 0);
  ok("★そこにも、割合の 棒を 使っていない",
    lock >= 0 && !/width: `\$\{Math\.min\(100/.test(nearLock));
  ok("★割合の数字を出していない", !/％/.test(nearLock));
}

console.log(`\n★とおった ${pass} ／ ★落ちた ${fail}`);
process.exit(fail === 0 ? 0 : 1);
