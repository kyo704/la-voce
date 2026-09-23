#!/usr/bin/env node
// STRIP: B（見える 字）
// ============================================================================
// ★★★半年の まとめ ／ はじめの 1週間 ── ★見本 2画面
//   ★出どころ 裁定183 P3・P4
//     ／ woolsong-2026-09-21_1.zip ／ 00-動く見本-PC・iPad（運営）.html（md5 0132714e）
//
//   ★★守る こと
//     ① 決めを 画面で 作って いない
//     ② ★伏せた 月は「―」。★`0` と 書かない
//     ③ ★順位・比べ・点数を 出さない。★並べ替える 仕掛けも 作らない
//     ④ ★体の ことを 1つも 読んで いない
//     ⑤ ★4つ 終わると 消える。★「おめでとう」も「あと n 個」も 出さない
//     ⑥ ★はじめの 1週間から 印を つけられない（★見る だけ）
//     ⑦ 但し書きが 見本の まま ／ ⑧ tx() ／ ⑨ 44 以上
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
  const 和 = readCode("components", "OrgSummary.jsx");
  const 和生 = readRaw("components", "OrgSummary.jsx");
  const 週 = readCode("components", "OrgFirstWeek.jsx");
  const 週生 = readRaw("components", "OrgFirstWeek.jsx");
  const src = fs.readFileSync(path.join(ROOT, "lib", "orgSummary.js"), "utf8");
  const L = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));

  console.log("① 決めを 画面で 作って いない");
  ["cellText", "periodLabel", "sortedRows", "STAT_COLUMNS"].forEach((n) =>
    t(new RegExp("\\b" + n + "\\b").test(和), "★まとめ ── " + n + " を 借りて いる"));
  ["onboardItems", "doneCount", "isFinished"].forEach((n) =>
    t(new RegExp("\\b" + n + "\\b").test(週), "★1週間 ── " + n + " を 借りて いる"));
  t(!/\.select\(\s*["'`]\*/.test(和) && !/\.select\(\s*["'`]\*/.test(週),
    "★`select('*')` を 書いて いない");

  console.log("\n② 伏せた 月は「―」");
  t(L.HIDDEN_MARK === "―", "★印は「―」");
  t(L.cellText({ suppressed: true, teachers: 9 }, "teachers") === "―", "★伏せた 月は 数を 出さない");
  t(L.cellText({ teachers: null }, "teachers") === "―", "★入って いない 数も「―」");
  t(L.cellText({ teachers: 0 }, "teachers") === "0", "★本当の 0 は 0 と 書く");
  t(L.cellText(null, "teachers") === "―", "★行が 無くても「―」");
  t(!/\|\|\s*0\b/.test(和), "★画面で 0 に 落として いない");

  console.log("\n③ 順位・比べ・点数を 出さない");
  ["順位", "平均", "偏差", "ランキング", "点数", "比べ"].forEach((w) =>
    t(!new RegExp(w).test(和.replace(/SUM_WARN|順位・先生ごとの/g, "")),
      "★「" + w + "」を 組み立てて いない"));
  t(!/\.sort\(/.test(和), "★画面で 並べ替えて いない（★並べ替えは 順位の もと）");
  t(/学生の 順位・先生ごとの 比べ・点数は 出しません。/.test(L.SUM_WARN[1]), "★★約束の 字が ある");

  console.log("\n④ 体の ことを 読んで いない");
  ["entries", "体調", "throat", "voice_quality", "condition"].forEach((w) => {
    t(!new RegExp(w, "i").test(和.replace(/体調の ことは 1つも 入りません/g, "")),
      "★まとめ ── 「" + w + "」が ない");
    t(!new RegExp(w, "i").test(週), "★1週間 ── 「" + w + "」が ない");
  });
  t(/体調の ことは 1つも 入りません。/.test(L.SUM_WARN[0]), "★★約束の 字が ある");

  console.log("\n⑤ 4つ 終わると 消える");
  const it = L.onboardItems([{ item: "roster", done: true }]);
  t(it.length === 4, "★4つ（" + it.length + "）");
  t(L.isFinished(it) === false, "★まだ なら 出す");
  t(L.isFinished(it.map((x) => ({ ...x, done: true }))) === true, "★ぜんぶ 終われば 消す");
  t(/if \(isFinished\(項\)\) return null;/.test(週), "★消す ところが ある");
  ["おめでとう", "あと ", "残り", "急いで"].forEach((w) =>
    t(!new RegExp(w).test(週.replace(/急かしません/g, "")), "★「" + w + "」を 出して いない"));

  console.log("\n⑥ 見る だけ");
  t(!/<button/.test(週), "★はじめの 1週間に 押す ところが ない");
  t(!/update\(|insert\(|upsert\(/.test(週), "★この 画面から 台帳に 書かない");

  console.log("\n⑦ 但し書きが 見本の まま");
  const 見 = fs.readFileSync(path.join(ROOT, "docs", "design", "pack-final",
    "00-動く見本-PC・iPad（運営）.html"), "utf8");
  const 素 = (s) => s.replace(/<[^>]*>/g, "").replace(/[\s　'"+★]/g, "");
  [...L.SUM_WARN, ...L.SUM_NOTE, ...L.ONBOARD_NOTE, L.SUM_SMALL_WHY].forEach((l) =>
    t(素(見).includes(素(l)), "★見本に ある …… " + l.slice(0, 20)));

  console.log("\n⑧⑨ 字と 押しどころ");
  [["まとめ", 和生], ["1週間", 週生]].forEach(([n, g]) => {
    const 裸 = (g.match(/>[^<>{}\n]*[ぁ-んァ-ヶ一-龠][^<>{}\n]*</g) || [])
      .filter((s) => !/^>\s*<$/.test(s));
    t(裸.length === 0, "★" + n + " ── 裸の 日本語が ない"
      + (裸.length ? "（" + 裸[0].slice(0, 26) + "）" : ""));
    const 高 = g.match(/minHeight:\s*(\d+)/g) || [];
    t(高.every((h) => Number(h.replace(/\D/g, "")) >= 44), "★" + n + " ── 44 未満が ない");
  });

  console.log(落ち === 0 ? "\n★すべて 通りました" : "\n★" + 落ち + "件 落ちました");
  process.exit(落ち === 0 ? 0 : 1);
})();
