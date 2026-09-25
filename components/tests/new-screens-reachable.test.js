#!/usr/bin/env node
// STRIP: A（振る舞い）
// ============================================================================
// ★★★作った 画面は、★どこかから 呼ばれて いる
//
//   ★出どころ 2026-09-23 ──
//     ★レッスン割の 4画面が、★どこからも 呼ばれて いませんでした。
//     ★★見張りは ぜんぶ 緑 でした ── ★画面を 1枚ずつ しか 見て いなかった からです。
//   ★★★同じ ことを もう 一度 しない ための 見張り です。
//     ★`tools/screen_impl.json` に 書いた 画面を 数え、
//     ★★その 部品が **ほかの 紙から 呼ばれて いるか** を 見ます。
//
//   ★★呼ばれて いない ものは、★`まだ つないで いない` に 書きます。
//     ★★★書いて あれば 通します。★書いて なければ 止めます。
//       ★「作った」と「届く」は 別 です。★どちらかを 選んで、★書き残します。
// ============================================================================
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
let 落ち = 0;
function t(cond, label) {
  if (cond) console.log("  ok   " + label);
  else { console.log("  NG   " + label); 落ち++; }
}

function 歩く(d, 出) {
  if (!fs.existsSync(d)) return 出;
  fs.readdirSync(d).forEach((n) => {
    const f = path.join(d, n);
    if (fs.statSync(f).isDirectory()) {
      if (n === "tests" || n === "node_modules") return;
      return 歩く(f, 出);
    }
    if (/\.jsx?$/.test(n)) 出.push(f);
  });
  return 出;
}

const 紙 = 歩く(path.join(ROOT, "app"), 歩く(path.join(ROOT, "components"), []));
const 中 = {};
紙.forEach((f) => {
  中[f] = fs.readFileSync(f, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");
});

const 待 = JSON.parse(fs.readFileSync(path.join(ROOT, "tools", "not_wired_yet.json"), "utf8"));

// ★★★2026-09-25 ── ★数える 先を **対応表から 置場そのもの** に 変えました。
//   ★★それまでは `tools/screen_impl.json`（★26枚）だけを 数えて いました。
//     ★★あの 紙に 書き忘れた 画面は、★1枚も 数えられて いませんでした ──
//       ★★実際に 27枚が 抜けて いました（★作って、見本と 見比べ、見張りも 付けた のに、
//         ★どこからも 呼ばれて いない 画面 です）。
//   ★★★対応表は 人が 書きます。★置場は 書き忘れられません。
//     ★★だから 源は 置場 です。★`components/*.jsx` を ぜんぶ 数えます。
//   ★★`VocalTracker` は 入口 そのもの なので 除きます。
const 部品 = fs.readdirSync(path.join(ROOT, "components"))
  .filter((n) => n.endsWith(".jsx"))
  .map((n) => path.basename(n, ".jsx"))
  .filter((n) => n !== "VocalTracker")
  .sort();

console.log("① 作った 画面の 部品");
t(部品.length > 0, "★部品が ある（" + 部品.length + "本）");

console.log("\n② 呼ばれて いるか");
// ★★★呼ばれ方は 2つ あります ──
//   ①★札として 置く（`<Yotei …>`）── ★画面 です
//   ②★名を もらう（`import { ScreenHead } from "@/components/UiV2"`）── ★部品 です
//   ★★★②を 数えて いなかった ので、★`UiV2` や `RecordSheets` のような
//     ★みんなが 使う 部品まで「呼ばれて いない」に 出て いました。
//     ★★出す 側に 倒すのは 安全 ですが、★本物の 27枚が 紛れます。
const 使われる = (n) => 紙.filter((f) => {
  if (path.basename(f) === n + ".jsx") return false;
  const s = 中[f];
  if (new RegExp("<" + n + "\\b").test(s)) return true;
  return new RegExp('from\\s+["\'](?:@/components/|\\./)' + n + '["\']').test(s);
});

const 未 = [];
部品.forEach((n) => {
  if (使われる(n).length === 0) 未.push(n);
});
部品.forEach((n) => {
  const 呼 = 使われる(n);
  const 書 = Object.prototype.hasOwnProperty.call(待, n);
  if (呼.length > 0) {
    t(!書, "★" + n + " ── 呼ばれて いる（★待ちの 紙に 書いて いない）");
  } else {
    t(書, "★" + n + " ── 呼ばれて いない ★わけが 書いて ある");
    if (書) t(/いつ つなぐ/.test(待[n]), "★" + n + " ── いつ つなぐかが 書いて ある");
  }
});

console.log("\n③ 待ちの 紙に、★もう 呼ばれて いる ものが 残って いない");
Object.keys(待).filter((k) => !k.startsWith("_")).forEach((n) => {
  t(部品.includes(n), "★" + n + " ── 作った 画面の 一覧に ある");
});

console.log("\n★呼ばれて いない …… " + 未.length + "本");
未.forEach((n) => console.log("    " + n));

console.log(落ち === 0 ? "\n★すべて 通りました" : "\n★" + 落ち + "件 落ちました");
process.exit(落ち === 0 ? 0 : 1);
