#!/usr/bin/env node
// STRIP: B（見える 字）
// ============================================================================
// ★★★実技試験を 組む ── ★見本 `SC['実技試験を組む']`
//   ★出どころ 裁定183 P5 ／ 裁定165
//     ／ woolsong-2026-09-21_1.zip ／ 00-動く見本-PC・iPad（運営）.html（md5 0132714e）
//
//   ★★守る こと
//     ① 決めを 画面で 作って いない
//     ② ★並べるのは 台帳（`jury_layout`）。★時こくを 画面で 数えない
//     ③ ★気づいた ことは **数だけ**。★動かす・外す 道が ない
//     ④ ★点を 1つも 読んで いない。★順位で 並べない
//     ⑤ ★部屋は 名で 出す（★番号を 見せない）
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
  const 画 = readCode("components", "JuryLayout.jsx");
  const 生 = readRaw("components", "JuryLayout.jsx");
  const src = fs.readFileSync(path.join(ROOT, "lib", "juryLayout.js"), "utf8");
  const L = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));

  console.log("① 決めを 画面で 作って いない");
  ["startAt", "endsAround", "noticeCounts", "isMonka", "hasClash", "placeName", "accompanistCount"]
    .forEach((n) => t(new RegExp("\\b" + n + "\\b").test(画), "★" + n + " を 借りて いる"));
  t(!/\.select\(\s*["'`]\*/.test(画), "★`select('*')` を 書いて いない");

  console.log("\n② 並べるのは 台帳");
  t(/rpc\(\s*"jury_layout"/.test(画), "★`jury_layout` を 呼ぶ");
  t(!/setSlots\(\[/.test(画), "★画面で 枠を 作って いない");
  // ★★時こくを 足し算して いない こと
  t(!/minutes \+ gap/.test(画) && !/\* 60/.test(画), "★時こくを 画面で 数えて いない");
  t(L.startAt("2026-10-14", "13:00") === "2026-10-14T13:00:00+09:00", "★渡す 形を lib が 作る");
  t(L.startAt("2026-10-14", "99:99") === null, "★読めない 時こくは null");

  console.log("\n③ 気づいた ことは 数だけ");
  t(/どれも お知らせするだけです。/.test(L.JL_NOTICE_NOTE[0]), "★★約束の 字が ある");
  t(/こちらでは 動かしません・外しません。決めるのは 運営です。/.test(L.JL_NOTICE_NOTE[1]),
    "★★動かさない 約束が ある");
  // ★★門下を 外す・重なりを 避ける 道が 無い こと
  ["外す", "避け", "組み直", "自動で"].forEach((w) =>
    t(!new RegExp(w).test(画.replace(/動かしません・外しません/g, "")),
      "★「" + w + "」の 道が ない"));
  t(L.noticeCounts([{ slot_id: "a" }], [{ slot_id: "b", is_monka: true }]).monka === 1,
    "★門下の 数を 数える");
  t(!/delete\(|\.update\(/.test(画), "★この 画面から 枠を 消したり 直したり しない");

  console.log("\n④ 点を 読んで いない");
  ["evaluation_scores", "points", "順位", "成績"].forEach((w) =>
    t(!new RegExp(w).test(画.replace(/順位・成績では 並べません/g, "")),
      "★「" + w + "」が ない"));
  t(/順位・成績では 並べません。点は ここには 出ません。/.test(L.JL_NOTE[1]), "★★約束の 字が ある");
  t(!/\.sort\(/.test(画), "★画面で 並べ替えて いない");

  console.log("\n⑤ 部屋は 名で");
  t(L.placeName([{ id: "p1", name: "小ホール" }], "p1") === "小ホール", "★名を 返す");
  t(L.placeName([], "p1") === "", "★引けなければ 空（★番号を 出さない）");
  t(!/\{s\.place_id\}/.test(画), "★番号を そのまま 出して いない");
  t(L.accompanistCount([{ accompanist_id: "a" }, { accompanist_id: "a" }, { accompanist_id: "b" }]) === 2,
    "★同じ 方を 二重に 数えない");

  console.log("\n⑥ 但し書きが 見本の まま");
  const 見 = fs.readFileSync(path.join(ROOT, "docs", "design", "pack-final",
    "00-動く見本-PC・iPad（運営）.html"), "utf8");
  const 素 = (s) => s.replace(/<[^>]*>/g, "").replace(/[\s　'"+★]/g, "");
  [...L.JL_NOTICE_NOTE, ...L.JL_NOTE].forEach((l) =>
    t(素(見).includes(素(l)), "★見本に ある …… " + l.slice(0, 20)));

  console.log("\n⑦⑧ 字と 押しどころ");
  const 裸 = (生.match(/>[^<>{}\n]*[ぁ-んァ-ヶ一-龠][^<>{}\n]*</g) || [])
    .filter((s) => !/^>\s*<$/.test(s));
  t(裸.length === 0, "★裸の 日本語が ない" + (裸.length ? "（" + 裸[0].slice(0, 26) + "）" : ""));
  const 高 = 生.match(/minHeight:\s*(\d+)/g) || [];
  t(高.length > 0 && 高.every((h) => Number(h.replace(/\D/g, "")) >= 44), "★どれも 44 以上");

  console.log(落ち === 0 ? "\n★すべて 通りました" : "\n★" + 落ち + "件 落ちました");
  process.exit(落ち === 0 ? 0 : 1);
})();
