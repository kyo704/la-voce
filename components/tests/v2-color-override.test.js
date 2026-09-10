#!/usr/bin/env node

// ============================================================================
// 門の中の 色の 塗り替えが、★字の 色に 当たっていないこと
//
//   ★★2026-09-11、★くらべる の 比較画像で 見つかりました。
//     ★★選ばれた 札「前の夜」が、★白地に 白字で 消えていました。
//     ★★順番 の 1番目の 丸も、★同じ 理由で 消えていました。
//
//   ★★原因
//     ★app/globals.css の .woolsong-v2 [style*="#FFFDF8"] が、
//     ★★字の 色に #FFFDF8 を 使っている ところにも 当たっていました。
//       ★選ばれた 札は「地＝えんじ／字＝#FFFDF8」です。
//       ★★その 地が !important で 白に され、★字も 白の まま でした。
//
//   ★★直し方
//     ★「background」と 書いてある ところだけを 選びます。
//     ★★React は 書いたままの 字で 出します（background:#FFFDF8）。
//       ★CSSOM から 置いた ものは rgb() に なるので、★両方 書きます。
//
//   ★★これは、★字を 読んで 見つけられない 種類の 間違いでした。
//     ★見張り 267本 すべてが 通っていました。★比較画像が 見つけました。
// ============================================================================

const { readRaw } = require("./_source");

let ok = 0;
let ng = 0;
function t(cond, label) {
  if (cond) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label); ng++; }
}

// ★★覚え書き（/* … */）を 外します。★覚え書きの 中に、
//   ★★直す前の 書き方を そのまま 引いて いるからです。
//   ★★これを 忘れると、★見張りが 自分の 説明に つまずきます
//     （★この 帳面で 3度 起きています）。
const css = readRaw("app", "globals.css").replace(/\/\*[\s\S]*?\*\//g, "");
const block = css.slice(css.indexOf(".woolsong-v2"));

console.log("① 地だけを 選んでいること");
// ★★色の 名前だけで 選ぶ 書き方が、★1つも 残っていないこと。
// ★★「background」で 始まる 書き方を 先に 外し、★残りを 見ます。
//   ★残っていれば、★色の 名前だけで 選んでいる ことに なります。
const rest = block.replace(/\[style\*="background[^"]*"\]/g, "");
[
  '[style*="#FFFDF8"]',
  '[style*="#F6F1E7"]',
  '[style*="rgb(255, 253, 248)"]',
  '[style*="rgb(246, 241, 231)"]'
].forEach((sel) => {
  t(!rest.includes(sel), "★" + sel + " を、★そのままでは 使っていない");
});

console.log("\n② 地の 書き方を、★4通り とも 用意していること");
// ★★React が 書く 形と、★CSSOM が 書く 形は ちがいます。
[
  'background:#FFFDF8', 'background-color:#FFFDF8',
  'background: rgb(255, 253, 248)',
  'background:#F6F1E7', 'background-color:#F6F1E7',
  'background: rgb(246, 241, 231)'
].forEach((w) => {
  t(block.includes('[style*="' + w + '"]'), "★" + w);
});

console.log("\n③ 白字の 札が、★門の中で 消えないこと");
// ★★選ばれた 札は「地＝えんじ／字＝#FFFDF8」です。
const ui = readRaw("components", "UiV2.jsx");
t(/background: on \? C\.curtain : C\.card/.test(ui), "★選ばれた 札の 地は えんじ");
t(/color: on \? "#FFFDF8"/.test(ui), "★選ばれた 札の 字は #FFFDF8");
// ★★この 2つが 揃っている 限り、★①②が 崩れると 見えなく なります。

console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
process.exit(ng === 0 ? 0 : 1);
