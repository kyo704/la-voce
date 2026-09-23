#!/usr/bin/env node
// STRIP: B（見える 字）
// ============================================================================
// ★★★書き出す（香盤表）／ 前の 公演から 写す ── ★見本 2画面
//   ★出どころ 裁定178
//     ／ woolsong-2026-09-21_1.zip ／ 00-動く見本-PC・iPad（運営）.html（md5 0132714e）
//
//   ★★守る こと
//     ① 決めを 画面で 作って いない
//     ② ★体の ことを 出さない ── ★出す 前に **数える**
//     ③ ★写すのは 形だけ。★中身を 選ばせない
//     ④ ★言葉を 画面に 写して いない（★台帳から）
//     ⑤ 但し書きが 見本の まま ／ ⑥ tx() ／ ⑦ 44 以上
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
  const 出 = readCode("components", "KoenExport.jsx");
  const 出生 = readRaw("components", "KoenExport.jsx");
  const 写 = readCode("components", "KoenCopyFrame.jsx");
  const 写生 = readRaw("components", "KoenCopyFrame.jsx");
  const src = fs.readFileSync(path.join(ROOT, "lib", "koenExport.js"), "utf8");
  const L = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));

  console.log("① 決めを 画面で 作って いない");
  ["exportKinds", "hasBodyWords"].forEach((n) =>
    t(new RegExp("\\b" + n + "\\b").test(出), "★書き出す ── " + n + " を 借りて いる"));
  t(/copyCandidates/.test(写), "★写す ── copyCandidates を 借りて いる");
  t(!/\.select\(\s*["'`]\*/.test(出) && !/\.select\(\s*["'`]\*/.test(写),
    "★`select('*')` を 書いて いない");

  console.log("\n② 体の ことを 出さない");
  t(/hasBodyWords\(行\)/.test(出), "★出す 前に 数えて いる");
  const 数 = 出.indexOf("hasBodyWords(行)");
  const 作 = 出.indexOf("createObjectURL");
  t(数 > 0 && 作 > 数, "★数えるのが **先**、★作るのが あと");
  t(/return;/.test(出.slice(数, 数 + 200)), "★見つかったら 出さずに 戻る");
  t(L.hasBodyWords([{ throat: 3 }]) === true, "★のどの 列を 見つける");
  t(L.hasBodyWords([{ 体調: "よい" }]) === true, "★日本語でも 見つける");
  t(L.hasBodyWords([{ row_label: "1場", person: "山田" }]) === false, "★ふつうの 行は 通す");
  t(L.BODY_WORDS.length >= 10, "★見る 言葉が 10 以上（" + L.BODY_WORDS.length + "）");
  t(/体調の ことは、1文字も 入りません/.test(L.EXPORT_WHY), "★★約束の 字が ある");

  console.log("\n③ 写すのは 形だけ");
  t(/rpc\(\s*"koen_copy_frame"/.test(写), "★台帳の `koen_copy_frame` を 呼ぶ");
  const 呼 = 写.slice(写.indexOf("koen_copy_frame"), 写.indexOf("koen_copy_frame") + 200);
  t(/p_from[\s\S]{0,40}p_to/.test(呼), "★渡すのは 2つ だけ（★どこから・どこへ）");
  t(!/p_with|p_include|p_people|p_cast/.test(写), "★何を 写すかを 選ばせて いない");
  ["koen_members", "koen_cells", "evaluation", "lessons"].forEach((w) =>
    t(!new RegExp(w).test(写), "★" + w + " に 触って いない"));
  t(/人・配役・稽古・出欠・呼び出し・期限は 写りません。/.test(L.COPY_WARN_3), "★★約束の 字が ある");

  console.log("\n④ 言葉を 画面に 写して いない");
  ["香盤表（", "場面 × 役"].forEach((w) =>
    t(!出.includes(w) && !写.includes(w), "★「" + w + "」を 画面に 書いて いない"));
  t(/wordsOf/.test(出) && /wordsOf/.test(写), "★台帳の 言葉を 引いて いる");

  console.log("\n⑤ 但し書きが 見本の まま");
  const 見 = fs.readFileSync(path.join(ROOT, "docs", "design", "pack-final",
    "00-動く見本-PC・iPad（運営）.html"), "utf8");
  // ★★見本は 1つの 文を JavaScript の 字で 切って つないで います ──
  //   `'紙で 配る ときの ためです。' + '<b>体調の ことは…</b>。'`
  //   ★★つなぎ目の `'` と `+` と `★` を 落とさないと、★1文として 見つかりません
  //     （★2026-09-23、★ここで 赤に なりました）。
  const 素 = (s) => s.replace(/<[^>]*>/g, "").replace(/[\s　'"+★]/g, "");
  [L.EXPORT_WHY, L.EXPORT_NOTE, L.COPY_WARN_3, ...L.COPY_NOTE].forEach((l) =>
    t(素(見).includes(素(l)), "★見本に ある …… " + l.slice(0, 20)));

  console.log("\n⑥⑦ 字と 押しどころ");
  [["書き出す", 出生], ["写す", 写生]].forEach(([n, g]) => {
    const 裸 = (g.match(/>[^<>{}\n]*[ぁ-んァ-ヶ一-龠][^<>{}\n]*</g) || [])
      .filter((s) => !/^>\s*<$/.test(s));
    t(裸.length === 0, "★" + n + " ── 裸の 日本語が ない"
      + (裸.length ? "（" + 裸[0].slice(0, 26) + "）" : ""));
    const 高 = g.match(/minHeight:\s*(\d+)/g) || [];
    t(高.length > 0 && 高.every((h) => Number(h.replace(/\D/g, "")) >= 44),
      "★" + n + " ── どれも 44 以上");
  });

  console.log(落ち === 0 ? "\n★すべて 通りました" : "\n★" + 落ち + "件 落ちました");
  process.exit(落ち === 0 ? 0 : 1);
})();
