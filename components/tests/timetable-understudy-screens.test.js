#!/usr/bin/env node
// STRIP: B（見える 字）
// ============================================================================
// ★★★授業の 時間を 出す ／ 代役を 立てる ── ★見本 2画面
//   ★出どころ 裁定183 P2 ／ 裁定178
//     ／ woolsong-2026-09-21_1.zip
//        00-動く見本-iPhoneで開く用.html（md5 67c56244）
//        00-動く見本-PC・iPad（運営）.html（md5 0132714e）
//
//   ★★守る こと
//     ① 決めを 画面で 作って いない
//     ② ★既定は 出さない。★何を 出すかを 選ばせない
//     ③ ★学校に 見えるのは「授業」の 2文字 だけ
//     ④ ★代役を 自動で 呼ばない。★おすすめも 並べ替えも しない
//     ⑤ ★体の 記録を 1つも 読んで いない
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
  const 時 = readCode("components", "ClassTimeShare.jsx");
  const 時生 = readRaw("components", "ClassTimeShare.jsx");
  const 代 = readCode("components", "Understudy.jsx");
  const 代生 = readRaw("components", "Understudy.jsx");
  const ts = fs.readFileSync(path.join(ROOT, "lib", "timetableShare.js"), "utf8");
  const us = fs.readFileSync(path.join(ROOT, "lib", "understudy.js"), "utf8");
  const T = await import("data:text/javascript;base64," + Buffer.from(ts).toString("base64"));
  const U = await import("data:text/javascript;base64," + Buffer.from(us).toString("base64"));

  console.log("① 決めを 画面で 作って いない");
  ["isSharing", "nextShares", "shareWord"].forEach((n) =>
    t(new RegExp("\\b" + n + "\\b").test(時), "★時間割 ── " + n + " を 借りて いる"));
  ["understudyRows", "hasUnderstudy"].forEach((n) =>
    t(new RegExp("\\b" + n + "\\b").test(代), "★代役 ── " + n + " を 借りて いる"));

  console.log("\n② 既定は 出さない／選ばせない");
  t(T.DEFAULT_SHARES === false, "★既定は false");
  t(T.isSharing(null) === false, "★行が 無ければ 出して いない");
  t(T.isSharing({ shares: true }) === true && T.isSharing({ shares: false }) === false, "★真偽の 見方");
  t(T.shareWord(null) === "出さない" && T.shareWord({ shares: true }) === "出す", "★札の 字");
  // ★★何を 出すかを 選ぶ 欄が 無い こと
  t(!/科目|教室|先生の 名前/.test(時.replace(/TT_NOTE|TT_WARN/g, "")),
    "★何を 出すかを 選ばせて いない");
  t((時.match(/<input|<select/g) || []).length === 0, "★打ち込む 欄も 選ぶ 欄も ない");
  t(/upsert\(/.test(時) && /shares: nextShares\(row\)/.test(時), "★真偽 1つ だけ 書く");

  console.log("\n③ 見えるのは「授業」だけ");
  t(T.VISIBLE_WORD === "授業", "★2文字");
  t(T.whatSchoolSees(true) === "授業" && T.whatSchoolSees(false) === null, "★出す／出さない");
  t(/科目の 名前・教室・先生の 名前は 出ません。体調の ことも 出ません。/.test(T.TT_NOTE[1]),
    "★★約束の 字が ある");

  console.log("\n④ 代役を 自動で 呼ばない");
  t(!/\.sort\(/.test(代), "★並べ替えて いない（★上に 出ると 選ばれ やすく なります）");
  ["おすすめ", "自動", "候補の 順", "いちばん"].forEach((w) =>
    t(!new RegExp(w).test(代.replace(/自動では 呼びません/g, "")),
      "★「" + w + "」を 出して いない"));
  t(/onClick=\{\(\) => 呼ぶ\(r\)\}/.test(代), "★押した ときだけ 呼ぶ");
  t(/自動では 呼びません。押した ときだけ/.test(U.US_WHY), "★★約束の 字が ある");
  t(/だから こちらでは 決めません。/.test(U.US_NOTE[1]), "★★決めない ことを 書いて いる");
  t(U.hasUnderstudy({ understudyId: null }) === false, "★代役が いなければ 押せない 形");

  console.log("\n⑤ 体の 記録を 読んで いない");
  ["entries", "throat", "voice_quality", "resonance", "condition"].forEach((w) => {
    t(!new RegExp(w, "i").test(時), "★時間割 ── 「" + w + "」が ない");
    t(!new RegExp(w, "i").test(代), "★代役 ── 「" + w + "」が ない");
  });
  // ★★「声の 調子」は 見本の 但し書きの 中 だけ。★引く 形が あっては いけません
  t(!/声の 調子/.test(代.replace(/US_NOTE/g, "")), "★代役 ── 声の 調子を 引いて いない");

  console.log("\n⑥ 但し書きが 見本の まま");
  const 素 = (s) => s.replace(/<[^>]*>/g, "").replace(/[\s　'"+★]/g, "");
  const 見P = fs.readFileSync(path.join(ROOT, "docs", "design", "pack-final",
    "00-動く見本-PC・iPad（運営）.html"), "utf8");
  const 見S = fs.readFileSync(path.join(ROOT, "docs", "design", "pack-final",
    "00-動く見本-iPhoneで開く用.html"), "utf8");
  [...T.TT_WARN, ...T.TT_NOTE].forEach((l) =>
    t(素(見S).includes(素(l)), "★スマホの 見本に ある …… " + l.slice(0, 18)));
  [U.US_WHY, ...U.US_NOTE].forEach((l) =>
    t(素(見P).includes(素(l)), "★運営の 見本に ある …… " + l.slice(0, 18)));

  console.log("\n⑦⑧ 字と 押しどころ");
  [["時間割", 時生], ["代役", 代生]].forEach(([n, g]) => {
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
