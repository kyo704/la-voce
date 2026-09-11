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
const { readCode } = require("./_source");

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
function ruleOf(sel, from = 0) {
  const i = flat.indexOf(sel + "{", from);
  if (i < 0) return null;
  const before = i === 0 ? "" : flat[i - 1];
  if (before && NAME_CHAR.test(before)) return ruleOf(sel, i + 1);
  const j = flat.indexOf("}", i);
  return j < 0 ? null : flat.slice(i + sel.length + 1, j);
}
/** ★見本の CSS に、★その 値が 書いて あるか。 */
function has(sel, frag) {
  const r = ruleOf(sel);
  return !!r && r.includes(frag.replace(/\s+/g, ""));
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
  [".fl", "font-size:10.5px", /fontSize: rem\(10\.5\)/, "fl は 10.5px"],
  [".fl", "letter-spacing:.08em", /letterSpacing: "0\.08em"/, "fl の 字間"],
  [".wl", "background:#F6EFDF", /background: "#F6EFDF"/, "wl の 地"],
  [".warn", "background:#F6F1E4", /#F6F1E4/, "warn の 地（★wl とは 別）"],
  [".sht", "font-size:16px", /fontSize: rem\(16\), fontWeight: 700/, "sht は 16px・700"],
  [".empty", "border:1pxdashed", /1px dashed/, "empty の 枠は 破線"],
  [".empty", "padding:26px14px", /padding: "26px 14px"/, "empty の 内側"],
  [".sw", "width:44px;height:26px", /width: 44, height: 26/, "sw の 大きさ"],
  [".sw", "background:#DFD4BE", /"#DFD4BE"/, "sw の 切の 地"],
  [".back", "font-size:12.5px", /fontSize: rem\(12\.5\)/, "back は 12.5px"],
  [".btn", "border-radius:13px", /borderRadius: RADIUS\.btn/, "btn の 角 13"],
  [".btn", "padding:14px0", /"14px 0"/, "btn の 内側"],
  [".btn.g", "padding:12px0", /"12px 0"/, "btn.g の 内側"],
  [".btn.sm", "padding:10px0", /"10px 0"/, "btn.sm の 内側"],
  [".btn.sm", "font-size:12.5px", /small \? 12\.5/, "btn.sm は 12.5px"],
  [".tag", "background:#F3ECDD", /"#F3ECDD"/, "tag の 地"],
  [".tag", "font-size:10px", /fontSize: rem\(10\)/, "tag は 10px"]
];
CHECKS.forEach(([sel, frag, re, label]) => {
  const inMihon = has(sel, frag);
  t(inMihon, "★見本に " + sel + " " + frag);
  t(re.test(ui), "★実装が そろって いる ── " + label);
});

console.log("\n③ わざと ちがえて いる 2つ");
// ★① ink3 を 小さい字に 使いません。
t(!/ink3|inkFaint/.test(ui), "★ink3 を 使って いない");
t(has(".usu", "color:var(--ink3)"), "★見本の usu は ink3（★わざと 変えて います）");
// ★② 入力欄の 字は 16px。
t(has(".inp", "font-size:13.5px"), "★見本の inp は 13.5px");
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
t(/"#F0E9DA"/.test(ui), "★実装も 同じ 色");

console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
process.exit(ng === 0 ? 0 : 1);
