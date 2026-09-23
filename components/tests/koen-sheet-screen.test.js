#!/usr/bin/env node
// STRIP: B（見える 字）
// ============================================================================
// ★★★香盤表 ── ★見本 `P_kouban`
//   ★出どころ 裁定141 ／ design-v36 の 直し ②
//     ／ woolsong-2026-09-21_8.zip ／ 00-動く見本-PC・iPad（運営）.html（md5 b5c54333）
//
//   ★★守る こと
//     ① 決めを 画面で 作って いない（`lib/koenSheet.js` から 借りる）
//     ② ★役が まだでも **場面を 先に 作れる**（design-v36 ②）
//     ③ ★言葉（場面／役／香盤表）を 画面に 写して いない（★台帳から 引く）
//     ④ ★「色ではなく 列の 中で」の 約束が ある
//     ⑤ ★体の ことを 1つも 受け取って いない
//     ⑥ ★出して いない 札の 名前を lib に 書いて いない（★あると 実装済みに 見える）
//     ⑦ 字は tx() ／ ⑧ 押す ところは 44 以上
// ============================================================================
const fs = require("fs");
const path = require("path");
const { readCode, readRaw } = require("./_source");

const ROOT = path.join(__dirname, "..", "..");
let 落ち = 0;
function t(cond, label) {
  if (cond) console.log("  ok   " + label);
  else { console.log("  NG   " + label); 落ち++; }
}

(async () => {
  const 画 = readCode("components", "KoenSheet.jsx");
  const 生 = readRaw("components", "KoenSheet.jsx");
  const src = fs.readFileSync(path.join(ROOT, "lib", "koenSheet.js"), "utf8");
  const L = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));

  console.log("① 決めを 画面で 作って いない");
  ["sheetGrid", "rowLabel", "totalMinutes", "canAddRow", "newRow", "readMinutes", "wordsOf", "sheetNotes"]
    .forEach((n) => t(new RegExp("\\b" + n + "\\b").test(画), "★" + n + " を 借りて いる"));
  t(!/\.select\(\s*["'`]\*/.test(画), "★`select('*')` を 書いて いない");

  console.log("\n② 役が まだでも 場面を 先に 作れる");
  t(/slots\.length === 0/.test(画), "★役が 無い ときの 分かれ道が ある");
  const 空 = 画.slice(画.indexOf("slots.length === 0"), 画.indexOf("slots.length === 0") + 1400);
  t(/場面だけ先に/.test(空), "★その ときも 場面を 足す ところを 出す");
  t(/koen_rows[\s\S]{0,200}insert/.test(画), "★場面だけ 入れられる（★役を 待たない）");

  console.log("\n③ 言葉を 画面に 写して いない");
  t(/koen_kind_words/.test(画), "★台帳の `koen_kind_words` から 引く");
  ["香盤表", "乗り番表", "出番表", "セットリスト"].forEach((w) =>
    t(!new RegExp(w).test(画), "★「" + w + "」を 画面に 書いて いない"));
  t(L.wordsOf([], "zzz").tbl_word === "表", "★引けない ときは `other` の 言葉");

  console.log("\n④ 色ではなく 列の 中で");
  const n = L.sheetNotes({ cast_word: "配役" });
  t(n.some((x) => /色ではなく 列の 中で/.test(x)), "★約束の 1行が ある");
  const 見 = fs.readFileSync(path.join(ROOT, "docs", "design", "pack-final",
    "00-動く見本-PC・iPad（運営）.html"), "utf8");
  const 素 = (s) => s.replace(/<[^>]*>/g, "").replace(/[\s　]+/g, "");
  n.forEach((l) => t(素(見).includes(素(l)), "★見本に ある …… " + l.slice(0, 20)));

  console.log("\n⑤ 体の ことを 受け取って いない");
  ["体調", "condition", "throat", "voice_quality", "entries"].forEach((w) =>
    t(!new RegExp(w, "i").test(画), "★「" + w + "」が ない"));

  console.log("\n⑥ 出して いない 札の 名前を lib に 書いて いない");
  const libCode = readCode("lib", "koenSheet.js");
  ["CSV から 読み込む", "PDF に する", "自分の 雛形に 残す"].forEach((w) =>
    t(!libCode.includes(w), "★「" + w + "」を lib に 書いて いない"));
  const ex = JSON.parse(fs.readFileSync(path.join(ROOT, "tools", "excluded_by_design.json"), "utf8"));
  t(ex["香盤表"] && Object.keys(ex["香盤表"]).length === 3, "★わけと 再び 見る ときが 書いて ある");
  Object.values(ex["香盤表"] || {}).forEach((r) =>
    t(/再び 見る とき/.test(r), "★外す 条件が 書いて ある"));

  console.log("\n⑦ 字は tx() を 通す");
  const 裸 = (生.match(/>[^<>{}\n]*[ぁ-んァ-ヶ一-龠][^<>{}\n]*</g) || [])
    .filter((s) => !/^>\s*<$/.test(s));
  t(裸.length === 0, "★JSX に 裸の 日本語が ない" + (裸.length ? "（" + 裸[0].slice(0, 30) + "）" : ""));

  console.log("\n⑧ 押す ところは 44 以上");
  const 高 = 生.match(/minHeight:\s*(\d+)/g) || [];
  t(高.length > 0, "★高さを 決めて いる（" + 高.length + "か所）");
  t(高.every((h) => Number(h.replace(/\D/g, "")) >= 44), "★どれも 44 以上");

  console.log(落ち === 0 ? "\n★すべて 通りました" : "\n★" + 落ち + "件 落ちました");
  process.exit(落ち === 0 ? 0 : 1);
})();
