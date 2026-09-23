#!/usr/bin/env node

// ============================================================================
// 共通の 部品 ── ★見本の CSS と 同じ 形か
//
//   ★出どころ 坂本さんの お決め ㋑（★2026-09-11）
//     「共通の部品を、先に揃えてから、1画面ずつ」
//   ★見本 docs/design/pack-final/00-動く見本（さわれる・全画面）.html の <style>
//
//   ★★なぜ 要るか
//     ★一斉の 確かめ（tools/audit-source.js）で、★31画面の うち 24画面が
//     ★見本と 半分も 合って いませんでした。
//     ★★「余分な もの」が 20件を 超える 画面が 12。
//       ★その 多くは、★同じ 形を 画面ごとに 書き写した ものでした。
//
//   ★★この 見張りは、★見本の CSS を その場で 読んで くらべます。
//     ★私が 数を 書き写して いません。★見本が 変われば、★ここが 落ちます。
//
//   ★★2つだけ、★わざと ちがえて います。
//     ★① ink3 は 小さい字に 使いません（★2026-09-10・坂本さんの お決め）。
//     ★② 入力欄の 字は 16px（★見本は 13.5px）。★iOS の 拡大を 止めるため。
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode, readRaw } = require("./_source");

let ok = 0;
let ng = 0;
function t(cond, label) {
  if (cond) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label); ng++; }
}

const M = fs.readFileSync(path.join(__dirname, "..", "..",
  "docs", "design", "pack-final", "00-動く見本（さわれる・全画面）.html"), "utf8");
const css = M.slice(0, M.indexOf("</style>"));
const ui = readCode("components", "UiV2.jsx");

// ★★空きを 取った CSS を 1本に します。★行の 折り返しで つまずかない ため。
const flat = css.replace(/\s+/g, "");

/**
 * ★見本の CSS から、★その class の 中身を 取り出します。
 *
 *   ★★「.mkbox{」のような 長い 名前に 当たらない ように します。
 *     ★前の 1文字が 名前の 続きで なければ、★それが その class です。
 *   ★★覚え書きの 終わり（★／）や 印（★＊）の あとにも 来ます。
 *     ★★2026-09-11、★ここで .fl と .sw を 取り逃しました。
 *       ★「};,」だけを 許して いて、★「/」を 落として いました。
 *   ★★同じ 名前が 2度 出る ことが あります（★dark の ぶん）。
 *     ★はじめに 見つけた ものを 使います。★見本の 並びの とおりです。
 */
const NAME_CHAR = /[A-Za-z0-9_.#-]/;
// ★★★同じ 名に、★決まりが **2つ以上** ある ことが あります（★2026-09-16）。
//   ★★トークンの 層が 入って、★`.box{margin-bottom:var(--sp2)}` が
//     ★もとの `.box{...}` より **前**に 置かれました。
//   ★★この 関数は 先頭の 1つだけ を 返して いたので、
//     ★「見本に `.box padding:0 14px` が 無い」と 出しました。
//     ★★在ります。★2つめに 在りました。★道具が 見て いなかった だけ です。
//   ★★きょう 4度目の「絵は 正しい、数えが 誤り」です。
//   ★★だから、★全部を 繋いで 返します。
function ruleOf(sel, from = 0) {
  const out = [];
  let i = flat.indexOf(sel + "{", from);
  while (i >= 0) {
    const before = i === 0 ? "" : flat[i - 1];
    if (!(before && NAME_CHAR.test(before))) {
      const j = flat.indexOf("}", i);
      if (j >= 0) out.push(flat.slice(i + sel.length + 1, j));
    }
    i = flat.indexOf(sel + "{", i + 1);
  }
  return out.length ? out.join(";") : null;
}
// ★★★2026-09-23（★段3a A群）── ★見本が 色を **変数**で 書くように なりました。
//   ★★`.tag{background:#F3ECDD}` → `.tag{background:var(--band2)}`。
//     ★★値は 同じ です。★書き方だけ 変わりました。
//   ★★★字を そのまま くらべると、★値が 同じ でも 落ちます。
//     ★`.warn` と `.tag` の 地が それ でした。★見本の `:root` から 解きます。
const ROOT = (() => {
  const m = flat.match(/:root\{([^}]*)\}/);
  const o = {};
  if (m) for (const kv of m[1].split(";")) {
    const i = kv.indexOf(":");
    if (i > 0 && kv.slice(0, i).startsWith("--")) o[kv.slice(0, i)] = kv.slice(i + 1);
  }
  return o;
})();
function 解く(v) {
  return v.replace(/var\((--[A-Za-z0-9_-]+)\)/g, (all, n) => (ROOT[n] || all));
}
/** ★見本の CSS に、★その 値が 書いて あるか（★変数は 解いて から くらべます）。 */
function has(sel, frag) {
  const r = ruleOf(sel);
  if (!r) return false;
  const f = frag.replace(/\s+/g, "");
  return r.includes(f) || 解く(r).toUpperCase().includes(解く(f).toUpperCase());
}

console.log("① 部品が そろって いること");
[
  "ScreenHead", "HeadRound", "H3", "Card", "Seg", "Pill", "Warn", "Note", "Li",
  "Box", "Usu", "FieldLabel", "Wl", "Two", "Input", "TextArea",
  "SheetTitle", "EmptyBox", "Switch", "Back", "Btn", "Tag"
].forEach((n) => {
  t(new RegExp("export function " + n + "\\(").test(ui), "★" + n);
});

console.log("\n② 見本の 数と 同じこと");
// ★★見本の CSS を その場で 読みます。★書き写して いません。
const CHECKS = [
  [".box", "border-radius:14px", /borderRadius: RADIUS\.card, padding: "0 12px"/, "box の 角と 内側"],
  [".box", "padding:012px", /padding: "0 12px"/, "box の 内側は 上下 0"],
  [".two", "gap:9px", /gap: SPACE\.cardGap/, "two の あいだ 9"],
  [".usu", "font-size:11px", /\.\.\.TYPE\.usual/, "usu は 11px"],
  // ★★★2026-09-19 ── ★大きさの 決めが `lib/visualTokens.js` に 移りました
  //   （★お決め D63(b)・★門の 中だけ 6段）。★部品は 数を 書きません。
  //   ★★見るのは「いまの 大きさが 見本と 同じか」── ★そこは 変えて いません。
  [".fl", "font-size:10.5px", /FieldLabel: \{ いま: 10\.5/, "fl は 10.5px", "決め"],
  [".fl", "letter-spacing:.08em", /letterSpacing: "0\.08em"/, "fl の 字間"],
  [".sht", "font-size:16px", /fontSize: rem\(16\), fontWeight: 700/, "sht は 16px・700"],
  [".empty", "border:1pxdashed", /1px dashed/, "empty の 枠は 破線"],
  [".empty", "padding:26px14px", /padding: "26px 14px"/, "empty の 内側"],
  [".sw", "width:44px;height:26px", /width: 44, height: 26/, "sw の 大きさ"],
  [".back", "font-size:13.5px", /fontSize: rem\(13\.5\)/, "back は 13.5px（★2026-09-23 に 見本へ 追いつき）"],
  [".btn", "border-radius:13px", /borderRadius: RADIUS\.btn/, "btn の 角 13"],
  [".btn", "padding:14px0", /"14px 0"/, "btn の 内側"],
  [".btn.g", "padding:12px0", /"12px 0"/, "btn.g の 内側"],
  [".btn.sm", "padding:10px0", /"10px 0"/, "btn.sm の 内側"],
  [".btn.sm", "font-size:12.5px", /small \? 12\.5/, "btn.sm は 12.5px"],
  [".tag", "font-size:10px", /Tag: \{ いま: 10,/, "tag は 10px", "決め"]
];
// ★★★見本が 動いた ものの 一覧（★2026-09-16・裁定その62 の トークン層）。
//
//   ★★坂本さんの お決め ──
//     「★色・サイズの 不一致は、★いまは 不具合として 数えない
//       （★トークンが まだ 当たって いない ため。★想定どおり）」
//   ★★けれど **黙って 通しません**。★動いた ことを 毎回 言います。
//     ★★そして、★ここに 無い 動きが 出たら **落ちます**。
//       ★★一覧を 広げずに 黙らせる ことが できない ように します。
//
//   ★★引き金 ── ★裁定その62 の トークンを 実装に 当てる とき。
//     ★★その ときに、★下の 4つを 実装の 数に 合わせ、★この 一覧を 空に します。
const MOVED_BY_TOKENS = {
  ".box padding:012px": "0 12px → 0 14px",
  ".usu font-size:11px": "11px → 12px",
  // ★★★2026-09-23（★段3a A群）── ★見本の 版を 入れ替えた ときに 測った ずれ。
  //   ★★どれも「見本が 大きく／淡く なった」向き です。★実装は まだ 追いついて いません。
  //   ★★★ここに 書くのは「黙らせる」ため では ありません。
  //     ★毎回 名前が 出ます。★見本が 戻れば「★一覧に 在るのに 動いて いない」で 落ちます。
  //   ★★引き金 …… ★見た目の 通し直し（★裁定その62 の トークンを 当てる とき）。
  //     ★★字の 大きさは 6段の 決め（lib/visualTokens.js）に 入って います。
  //       ★1つだけ 動かすと、★段の あいだが ちぐはぐに なります。★まとめて 動かします。
  ".fl font-size:10.5px": "10.5px → 12.5px",
  ".tag font-size:10px": "10px → 12.5px",
  ".btn.sm font-size:12.5px": "12.5px → 13.5px",
  ".sw background:#DFD4BE": "#DFD4BE → var(--line) ＝ #E4DAC4"
};
let moved = [];
// ★★★5つ目は「どこを 見るか」です（★2026-09-19）。
//   ★★`"決め"` …… `lib/visualTokens.js`（★大きさの 決めが 移った ぶん）
//   ★★書かなければ これまでどおり `components/UiV2.jsx` を 見ます。
const 決め = readRaw("lib", "visualTokens.js");
CHECKS.forEach(([sel, frag, re, label, どこ]) => {
  const key = sel + " " + frag;
  const inMihon = has(sel, frag);
  if (!inMihon && Object.prototype.hasOwnProperty.call(MOVED_BY_TOKENS, key)) {
    // ★★見本が 動きました。★分かって いる 動き です。★落としません。
    moved.push(key + "　（" + MOVED_BY_TOKENS[key] + "）");
  } else {
    t(inMihon, "★見本に " + key);
  }
  t(re.test(どこ === "決め" ? 決め : ui), "★実装が そろって いる ── " + label);
});
// ★★一覧に 書いた のに、★見本が もう 動いて いない ── ★紙が 古い しるし。
const stale = Object.keys(MOVED_BY_TOKENS).filter((k) => {
  const sp = k.indexOf(" ");
  return has(k.slice(0, sp), k.slice(sp + 1));
});
if (moved.length) {
  console.log("\n  ★見本が 動いた もの（★トークン層・落としません）");
  moved.forEach((x) => console.log("    ・" + x));
  console.log("    ★引き金 … 裁定その62 の トークンを 実装に 当てる とき");
}
stale.forEach((k) => {
  t(false, "★★一覧に 在るのに 見本は 動いて いません: " + k + "（★一覧から 外して ください）");
});

console.log("\n②-2 色は 台帳（lib/tokens.js）と 見本を くらべる");
// ★★★2026-09-23（★段3a A群）── ★色の 見方を 変えました。
//   ★★もとは `UiV2.jsx` の 中に `#F6EFDF` の ような 字が ある ことを 見て いました。
//     ★★実装は もう 色を 直に 書きません。★`lib/tokens.js` の 名前を 使います
//       （★`C.bandWl` ／ `C.band` ／ `C.switchOff` ／ `C.band2`）。
//     ★★★だから 字は 見つからず、★4つとも 落ちて いました。★実装は 正しい のに、です。
//   ★★★いまは こう 見ます ──
//       ㋐ 部品が その 名前を 使って いるか（★字を 直に 書いて いないか）
//       ㋑ その 名前の 値が、★見本の 値と 同じか（★見本の 変数は 解きます）
//     ★ちがう ときは、★下の 一覧に 書いて あれば「動いた」として 名前だけ 出します。
const 台帳 = readRaw("lib", "tokens.js");
function 色(名) {
  const m = 台帳.match(new RegExp("(?:^|\\n)\\s*" + 名 + ":\\s*\"(#[0-9A-Fa-f]{6})\""));
  return m ? m[1].toUpperCase() : null;
}
function 見本色(sel, prop) {
  const r = ruleOf(sel) || "";
  const m = 解く(r).match(new RegExp(prop + ":(#[0-9A-Fa-f]{6})"));
  return m ? m[1].toUpperCase() : null;
}
// ★★見本が 動いた 色（★実装は まだ 追いついて いません）。★引き金は 上と 同じ です。
const COLOR_MOVED = {
  "wl の 地": "#F6EFDF → #F3ECDD（--band2）",
  "sw の 切の 地": "#DFD4BE → #E4DAC4（--line）"
};
[[".wl", "background", "bandWl", "C.bandWl", "wl の 地"],
 [".warn", "background", "band", "C.band", "warn の 地（★wl とは 別）"],
 [".sw", "background", "switchOff", "C.switchOff", "sw の 切の 地"],
 [".tag", "background", "band2", "C.band2", "tag の 地"]
].forEach(([sel, prop, 名, 使, ラベル]) => {
  const 見 = 見本色(sel, prop), 実 = 色(名);
  t(Boolean(見), "★見本の " + sel + " の " + prop + " を 読めた（" + 見 + "）");
  t(new RegExp(使.replace(".", "\\.")).test(ui), "★実装は " + 使 + " を 使って いる（★字を 直に 書かない）");
  if (見 && 実 && 見 !== 実) {
    if (Object.prototype.hasOwnProperty.call(COLOR_MOVED, ラベル)) {
      moved.push(ラベル + "　（" + COLOR_MOVED[ラベル] + "）");
    } else {
      t(false, "★見本と 台帳の 色が ちがう ── " + ラベル + "（見本 " + 見 + " ／ 台帳 " + 実 + "）");
    }
  } else {
    t(見 === 実, "★見本と 台帳の 色が 同じ ── " + ラベル + "（" + 見 + "）");
  }
});
// ★★★動いた 色も、★その場で 名前を 出します（★2026-09-23）。
//   ★★上の 「見本が 動いた もの」の 表示は、★この 塊より **前** に 走ります。
//     ★★だから ここで 出さないと、★黙って 通って しまいます。
const 動色 = moved.filter((x) => Object.keys(COLOR_MOVED).some((k) => x.startsWith(k)));
if (動色.length) {
  console.log("\n  ★見本が 動いた 色（★落としません・引き金は 上と 同じ）");
  動色.forEach((x) => console.log("    ・" + x));
}
// ★★一覧に 在るのに もう 同じ に なって いたら、★紙が 古い しるし。
Object.keys(COLOR_MOVED).forEach((k) => {
  const 組 = { "wl の 地": [".wl", "background", "bandWl"], "sw の 切の 地": [".sw", "background", "switchOff"] }[k];
  if (組 && 見本色(組[0], 組[1]) === 色(組[2])) {
    t(false, "★★一覧に 在るのに 見本と 同じ です: " + k + "（★一覧から 外して ください）");
  }
});

console.log("\n③ わざと ちがえて いる 2つ");
// ★① ink3 を 小さい字に 使いません。
t(!/ink3|inkFaint/.test(ui), "★ink3 を 使って いない");
t(has(".usu", "color:var(--ink3)"), "★見本の usu は ink3（★わざと 変えて います）");
// ★② 入力欄の 字は 16px。
// ★★★見本の 数を 書き写しません（★2026-09-23）。★その場で 読みます。
const inpPx = ((ruleOf(".inp") || "").match(/font-size:([\d.]+)px/) || [])[1];
t(Boolean(inpPx), "★見本の inp の 大きさを 読めた（" + inpPx + "px）");
t(Number(inpPx) < 16, "★見本は 16px 未満（★だから わざと 16 に します）");
t(/export function Input\([\s\S]*?fontSize: rem\(16\)/.test(ui), "★実装の 入力欄は 16px");
t(/export function TextArea\([\s\S]*?fontSize: rem\(16\)/.test(ui), "★実装の 書く枠は 16px");

console.log("\n④ 押しどころは 44 以上");
["Input", "Switch", "Back", "Btn"].forEach((n) => {
  const body = (ui.split("export function " + n + "(")[1] || "").slice(0, 1400);
  t(/SPACE\.tapMin/.test(body), "★" + n + " が 44 を 守って いる");
});

console.log("\n⑤ 写しが 残って いないこと");
// ★★同じ 形を 画面ごとに 書き写すと、★1つ 直しても ほかが 残ります。
//   ★★2026-09-11 の 一斉の 確かめで、★これが いちばん 多い 形でした。
//   ★★門の外（!layoutV2）の 画面は 数えません。★38人の 画面は 変えません。
const V2 = [
  "CompareV2.jsx", "LookBackV2.jsx", "NotesV2.jsx", "CountV2.jsx",
  "DailyAskPicker.jsx", "RecordSheets.jsx", "HomeV2.jsx", "RecordV2Head.jsx"
];
const fs2 = require("fs");
const dir = path.join(__dirname, "..");
function codeOf(f) {
  const p2 = path.join(dir, f);
  return fs2.existsSync(p2) ? readCode("components", f) : "";
}
[
  [/width: 44, height: 26/, "切替（.sw）の 写し"],
  [/‹\s*(?:　|\s)*(?:もどる|くらべる)/, "戻る（.back）の 写し"],
  [/const ghostBtn = \{/, "枠だけの ボタン（.btn.g）の 写し"]
].forEach(([re, label]) => {
  const hit = V2.filter((f) => re.test(codeOf(f)));
  t(hit.length === 0, "★" + label + "（" + (hit.join("／") || "なし") + "）");
});
// ★★部品を 使って いる ことの 確かめ。★片道の 見張りに しないため。
t(/<Back onClick/.test(codeOf("CompareV2.jsx")), "★くらべる が Back を 使って いる");
t(/<Switch on=/.test(codeOf("CompareV2.jsx")), "★くらべる が Switch を 使って いる");
t(/<Back onClick/.test(codeOf("NotesV2.jsx")), "★ノート が Back を 使って いる");
t(/<Input /.test(codeOf("NotesV2.jsx")), "★ノート が Input を 使って いる");
t(/<TextArea /.test(codeOf("NotesV2.jsx")), "★ノート が TextArea を 使って いる");
t(/<Btn ghost/.test(codeOf("LookBackV2.jsx")), "★ふりかえる が Btn を 使って いる");
t(/<EmptyBox/.test(codeOf("LookBackV2.jsx")), "★ふりかえる が EmptyBox を 使って いる");
t(/<EmptyBox/.test(codeOf("CompareV2.jsx")), "★くらべる が EmptyBox を 使って いる");
t(/<Card>/.test(codeOf("RecordV2Head.jsx")), "★記録の 頭が Card を 使って いる");
t(/<Warn>/.test(codeOf("RecordV2Head.jsx")), "★記録の 頭が Warn を 使って いる");
t(/<Btn ghost onClick=\{onSkip\}/.test(codeOf("RecordV2Head.jsx")), "★記録の 頭が Btn を 使って いる");
// ★★2026-09-11、★2枚の カードを 消しました（★お決め ㋑）。
//   ★いま きょうで Card を 使って いるのは、★本番の 朝の ことば です。
t(/<Card style=\{\{ borderColor: "#CFC0A4"/.test(codeOf("HomeV2.jsx")),
  "★きょう が Card を 使って いる（★本番の 朝の ことば）");

console.log("\n⑥ 空・読み込み中・しくじった ときの 1枚");
// ★★見本の stateBlock（546〜556行）を、★1か所で 持ちます。
t(/export function StateBlock\(/.test(ui), "★StateBlock が ある");
t(/export function Skeleton\(/.test(ui), "★Skeleton（灰色の 形）が ある");
[
  "ぐるぐるを 使いません。灰色の 形を 置きます。0.3秒 未満なら 何も 出しません。",
  "白紙に しません。「まだ ありません」だけで 終わりません。何を すると 埋まるかを 1行 書きます。",
  "書いたものを、失敗で 消しません。これが 一番重い決まりです。",
  "いま つながりません。",
  "書いたものは、この端末に 残っています。"
].forEach((w) => {
  t(M.includes(w), "★見本に「" + w.slice(0, 22) + "」");
  t(ui.includes(w), "★実装に 同じ 字");
});
// ★★空の 枠は 破線です（★.empty）。★実線の カードでは ありません。
t(/1px dashed/.test(ui), "★空の 枠は 破線");
t(has(".sk", "background:#F0E9DA"), "★見本の 灰色の 形の 色");
t(/C\.line2/.test(ui), "★実装も 同じ 色（★C.line2 を 使って いる）");

console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
process.exit(ng === 0 ? 0 : 1);
