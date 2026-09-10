// ============================================================================
// ★文字の 大きさの 設定が、★ちゃんと 効くか（★2026-09-11）
//
//   ★出どころ docs/design/pack-final/文字の大きさ.md §3
//     「html { font-size: calc(16px * var(--scale)) }」
//     「★文字と、文字に付く 余白・高さ　→ ★rem
//       ★枠線・角丸・影・絵の大きさ　　 → ★px のまま」
//
//   ★★この 見張りが 生まれた いきさつ（★実機の 写真・2026-09-11）。
//     ★見本の tokens.md は px で 書かれています（17px・13.5px …）。
//     ★★それを その まま px で 入れていました。
//     ★★px は、★文字の 大きさの 設定で 1つも 変わりません。
//     ★★しかも 古い ところは rem の ままです。
//       ★★同じ 画面に、★大きくなる 字と ならない 字が 混じりました。
//       ★注記だけが 大きく 見えていたのは、★これです。
//
//   ★★確かめること
//     ① 文字の 大きさが、★ぜんぶ rem で あること。
//     ② 枠線・角丸・押せる 大きさは px の ままで あること。
//     ③ 数が 見本の px と 合っていること（★1rem ＝ 16px）。
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode, readRaw } = require("./_source");

let failed = 0;
function ok(cond, label) {
  if (cond) { console.log("  ok  " + label); }
  else { console.log("  NG  " + label); failed++; }
}

const ROOT = path.join(__dirname, "..", "..");
const src = readRaw("lib", "uiKit.js");
const code = readCode("lib", "uiKit.js");

console.log("① 文字の 大きさは rem");
// ★★TYPE の 中に、★裸の px（数字だけ）の fontSize が 無いこと。
const typeAt = code.indexOf("export const TYPE = {");
const typeEnd = code.indexOf("\n};", typeAt);
const type = code.slice(typeAt, typeEnd);
const bare = [...type.matchAll(/fontSize: (\d)/g)].map((m) => m[0]);
ok(bare.length === 0, "★裸の px が ない" + (bare.length ? "（" + bare.join(", ") + "）" : ""));
ok((type.match(/fontSize: rem\(/g) || []).length === 11, "★11 とも rem を 通している");

console.log("② 枠線・角丸・押せる 大きさは px の まま");
ok(/borderRadius: RADIUS\.card/.test(code), "★角丸は 数の まま");
ok(/1px solid/.test(code), "★枠線は px の まま");
ok(/tapMin: 44/.test(code), "★押せる 大きさは 44px の まま");
// ★★44 を rem に すると、★小さい 設定で 44 を 下回ります。
//   ★「どの段でも 44 以上」の 決めが 崩れます。
ok(!/tapMin: rem\(/.test(code), "★押せる 大きさを rem に していない");

console.log("③ 数が 見本と 合っている");
const want = { 17: "title", 10.5: "h3", 13.5: "body", 13: "li", 11.5: "mini", 11: "usual", 26: "big", 12: "bigUnit", 10: "tab", 16: "btn" };
Object.keys(want).forEach((px) => {
  ok(new RegExp("rem\\(" + px.replace(".", "\\.") + "\\)").test(type),
    "★" + want[px] + " は " + px + "px（見本のとおり）");
});
// ★1rem ＝ 16px。★倍率 1 では、★見た目が 1つも 変わらないこと。
ok(/\(Number\(px\) \/ 16\)/.test(code), "★1rem ＝ 16px で 割っている");

console.log("④ 画面の 側にも、★大きな 裸の px が 残っていないか");
// ★★小さい 数（★9・10 など）は 目盛りや 印の 字で、★見本も px で 書いています。
//   ★ここでは、★本文の 大きさ（★13 以上）だけを 見ます。
[["components/UiV2.jsx", "UiV2"], ["components/HomeV2.jsx", "HomeV2"],
 ["components/RecordV2Head.jsx", "RecordV2Head"]].forEach(([f, name]) => {
  const c = readCode(...f.split("/"));
  const big = [...c.matchAll(/fontSize: (\d\d(?:\.\d)?)(?![0-9a-zA-Z])/g)]
    .map((m) => Number(m[1])).filter((n) => n >= 13);
  ok(big.length === 0, "★" + name + " に 大きな 裸の px が ない"
    + (big.length ? "（" + big.join(", ") + "）" : ""));
});

console.log("⑤ 決めが 1か所に ある");
ok(/文字と、文字に付く 余白・高さ/.test(src), "★分け方が 書いてある");
ok(/rem\(15\)|rem\(11\)|rem\(SPACE\.cardPadY\)/.test(code), "★文字に 付く 余白も rem");

console.log(failed === 0 ? "\n全て ok" : "\n" + failed + "件 NG");
process.exit(failed === 0 ? 0 : 1);
