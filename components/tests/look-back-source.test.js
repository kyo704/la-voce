#!/usr/bin/env node

// ============================================================================
// ★さかのぼる（A05）── ★見本の 字と、★2つの 出どころ（★2026-09-14）
//
//   ★出どころ 坂本さん ──「見本通りに 合わせる。★2つの 出どころを 行ごとに
//     書き分け、★『本番だけに すると 0件に なる』の 一文も 追加」
//
//   ★★この 見張りは 3つを 見ます。
//     ① 見本の 字が、★1文字も 変わって いないこと（★空白も 含みます）
//     ② 出どころの 札が、★lib に 1つ だけ ある こと
//     ③ 合わせる ところが、★lib に 1つ だけ ある こと
//
//   ★★①の 空白が 大事です。★2026-09-14、★字は 合って いたのに
//     ★分かち書きの 空白が 3つ 抜けて いました。★それで「無い」と 数えました。
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode, readRaw } = require("./_source");

const ROOT = path.join(__dirname, "..", "..");
const MI = path.join(ROOT, "docs", "design", "pack-final",
  "00-動く見本（さわれる・全画面）.html");

let ok = 0;
let ng = 0;
function t(cond, label) {
  if (cond) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label); ng++; }
}

const mihon = fs.readFileSync(MI, "utf8");
const panel = readCode("components", "LookBackPanel.jsx");
const lib = readCode("lib", "lookBack.js");
const v2 = readCode("components", "LookBackV2.jsx");
const app = panel + "\n" + lib + "\n" + v2;

console.log("① ★見本の 字（★空白も 1文字です）");

// ★★見本の sakanobo() の 中の 字だけを 見ます。★ほかの 画面と 混ぜません。
const i = mihon.indexOf("function sakanobo(");
const seg = mihon.slice(i, mihon.indexOf("\nfunction ", i + 10));

const WORDS = [
  "出なかった日を 選ぶと、その前の 3日に 書いたことが そのまま 出ます。",
  "△出づらい と書いた日",
  "本番で 出なかった日",
  "2つとも 使います ── △出づらいと 書いた日 と 本番で 出なかった日。",
  "本番だけに すると、0件に なります。",
  "文章を 添えません。確率も 割合も 出しません。",
  "前の3日 ›",
  "まだ、出づらいと 書いた日が ありません。",
  "記録の「声の 出来」に △出づらい を つけた日が、ここに 並びます。"
];
WORDS.forEach((w) => {
  // ★★まず、★その 字が **見本に ある** こと。★私の 造語で ないこと。
  //   ★★2026-09-14、★B02 で 自分の 造語を 見本の 字として 数えました。
  const flat = seg.replace(/<[^>]*>/g, "");
  const inMihon = seg.includes(w) || flat.includes(w);
  t(inMihon, "★見本に ある「" + w.slice(0, 22) + "」");
  if (inMihon) t(app.includes(w), "★アプリに ある「" + w.slice(0, 22) + "」");
});

console.log("\n② ★出どころの 札は、★lib が 1つ だけ 持つ");

t(/export const LOOK_BACK_SOURCE/.test(lib), "★LOOK_BACK_SOURCE が lib に ある");
t(/LOOK_BACK_SOURCE/.test(panel) === false,
  "★画面は 札を 書き写して いない（★sourceOf を 通す）");
// ★★画面に 札の 字を 直に 書いて いないこと。
t(!/["「]本番で 出なかった日["」]/.test(panel),
  "★画面に「本番で 出なかった日」を 直書きして いない");
t(!/["「]△出づらい と書いた日["」]/.test(panel),
  "★画面に「△出づらい と書いた日」を 直書きして いない");

console.log("\n③ ★合わせる ところは、★lib に 1つ だけ");

t(/export function lookBackDays/.test(lib), "★lookBackDays が ある");
t(!/export function lookBackableDays/.test(lib),
  "★lookBackableDays は 消した（★呼び手が 無く なった・N-1）");
t(/lookBackDays\(notOutDays/.test(v2), "★画面は lookBackDays を 呼ぶ");
// ★★画面の 中で、★もう一度 合わせて いないこと。
t(!/\[\.\.\.\(notOut/.test(v2) && !/new Set\(\)/.test(panel),
  "★画面で 合わせ直して いない");

console.log("\n④ ★両方に 当てはまる 日の 決め");

// ★★本番で 出なかった日 が 勝ちます。★強い 事実だから です。
//   ★★決め方が lib に 書いて ある こと。★画面で 決めない こと。
t(/notOut/.test(lib) && /★本番で 出なかった、の ほうが 強い 事実/.test(readRaw("lib", "lookBack.js")),
  "★どちらが 勝つかを lib に 書いて いる");

console.log("\n⑤ ★古い 呼び方を 壊して いないこと");

// ★★`VocalTracker` は fields つきで 呼びます。★そちらは 札を 渡しません。
t(/sources/.test(panel), "★sources を 受け取る");
t(/if \(!sources\) return null/.test(panel),
  "★sources が 無ければ 札を 出さない（★見当で 貼らない）");

console.log("\n⑥ ★この 見張りが 見て いない こと");
console.log("　★字が あるか だけ です。★どの行に どの札が 出るかは 見て いません。");
console.log("　★★実機で お確かめ ください。");

console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
process.exit(ng === 0 ? 0 : 1);
