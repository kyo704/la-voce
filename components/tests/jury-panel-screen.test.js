#!/usr/bin/env node
// STRIP: B（見える 字）
// ============================================================================
// ★★★審査員を 足す ── ★見本 `P_addJudge`
//   ★出どころ 裁定165 ／ design-v36 の 直し（★題名が undefined）
//     ／ woolsong-2026-09-21_1.zip ／ 00-動く見本-PC・iPad（運営）.html（md5 0132714e）
//
//   ★★守る こと
//     ① 決めを 画面で 作って いない
//     ② ★題名が 無い ときに `undefined` と 出さない（design-v36 の 直し）
//     ③ ★採点の 札を 台帳に 尋ねる（★役職の 名前から 当てない）
//     ④ ★札を 持たない 方を 並べない
//     ⑤ ★外す とき、★点に 触らない
//     ⑥ 但し書きが 見本の まま ／ ⑦ tx() ／ ⑧ 44 以上
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
  const 画 = readCode("components", "JuryPanel.jsx");
  const 生 = readRaw("components", "JuryPanel.jsx");
  const src = fs.readFileSync(path.join(ROOT, "lib", "juryPanel.js"), "utf8");
  const L = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));

  console.log("① 決めを 画面で 作って いない");
  ["eventTitle", "eventLine", "judgesOf", "candidates", "isEmpty"]
    .forEach((n) => t(new RegExp("\\b" + n + "\\b").test(画), "★" + n + " を 借りて いる"));
  t(!/\.select\(\s*["'`]\*/.test(画), "★`select('*')` を 書いて いない");

  console.log("\n② undefined と 出さない");
  t(L.eventTitle(null) === "行事", "★行事が 無ければ「行事」");
  t(L.eventTitle({ name: "" }) === "行事", "★空の 名前でも「行事」");
  t(L.eventTitle({ name: "  " }) === "行事", "★あきだけでも「行事」");
  t(L.eventTitle({ name: "後期 実技試験" }) === "後期 実技試験", "★名前が あれば その まま");
  // ★★註を 外して から 見ます。★この 画面の 註 には、★禁じる ために
  //   `undefined` と 書いて あります（★自分の 説明で 赤に なります）。
  t(!/undefined/.test(画), "★画面に `undefined` の 字が ない");
  t(!/\{event\.name\}/.test(画), "★名前を 生の まま 出して いない");

  console.log("\n③ 採点の 札を 台帳に 尋ねる");
  t(/rpc\(\s*"has_can_user"[\s\S]{0,120}"saiten"/.test(画), "★`has_can_user(…,'saiten')` を 呼ぶ");
  ["学部長", "教授", "先生"].forEach((w) =>
    t(!new RegExp("=== *[\"']" + w).test(画), "★役職の 名前から 当てて いない …… " + w));

  console.log("\n④ 札を 持たない 方を 並べない");
  const mem = [{ user_id: "a", display_name: "高木", can_saiten: true },
               { user_id: "b", display_name: "岡本", can_saiten: false }];
  const c = L.candidates(mem, []);
  t(c.length === 1 && c[0].id === "a", "★札を 持つ 方 だけ（" + c.length + "人）");
  t(L.candidates(mem, [{ judge_id: "a" }])[0].already === true, "★もう 組んだ 方は 印が つく");

  console.log("\n⑤ 外す とき 点に 触らない");
  const 外 = 画.slice(画.indexOf("const 外す"), 画.indexOf("const 外す") + 700);
  t(/from\("evaluation_judges"\)[\s\S]{0,60}\.delete\(\)/.test(外), "★外すのは 審査員の 表 だけ");
  t(!/evaluation_scores/.test(外), "★点の 表に 触って いない");
  t(!/evaluation_scores/.test(画), "★この 画面は 点の 表を 1度も 触らない");
  t(!/evaluation_reviews/.test(画), "★講評の 表にも 触らない");

  console.log("\n⑥ 但し書きが 見本の まま");
  const 見 = fs.readFileSync(path.join(ROOT, "docs", "design", "pack-final",
    "00-動く見本-PC・iPad（運営）.html"), "utf8");
  const 素 = (s) => s.replace(/<[^>]*>/g, "").replace(/[\s　]+/g, "");
  L.JURY_NOTE.forEach((l) => t(素(見).includes(素(l)), "★見本に ある …… " + l.slice(0, 20)));
  t(/外しても、その方が すでに 入れた 点は 消えません。/.test(L.JURY_NOTE[2]),
    "★★点が 消えない 約束が ある");

  console.log("\n⑦⑧ 字と 押しどころ");
  const 裸 = (生.match(/>[^<>{}\n]*[ぁ-んァ-ヶ一-龠][^<>{}\n]*</g) || [])
    .filter((s) => !/^>\s*<$/.test(s));
  t(裸.length === 0, "★JSX に 裸の 日本語が ない" + (裸.length ? "（" + 裸[0].slice(0, 30) + "）" : ""));
  const 高 = 生.match(/minHeight:\s*(\d+)/g) || [];
  t(高.length > 0 && 高.every((h) => Number(h.replace(/\D/g, "")) >= 44), "★どれも 44 以上");

  console.log(落ち === 0 ? "\n★すべて 通りました" : "\n★" + 落ち + "件 落ちました");
  process.exit(落ち === 0 ? 0 : 1);
})();
