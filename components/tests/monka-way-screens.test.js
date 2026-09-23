#!/usr/bin/env node
// STRIP: B（見える 字）
// ============================================================================
// ★★★門下の 決め方 ／ 担当の 先生を 選ぶ ── ★裁定186
//
//   ★★★「担当の 先生を 選ぶ」は 見本が **あります**
//     （`00-動く見本-iPhoneで開く用.html`・md5 67c56244）。
//     ★★2026-09-24、★はじめ「無い」と 判じて 裁定の 本文から 字を 取りました。
//       ★実行ルートの 名は「担当の 先生を 選ぶ（スマホ）」、★見本の 鍵は
//       ★`SC['担当の先生を選ぶ']`。★「（スマホ）」の ぶん だけ ちがい、
//       ★★道具が 見つけられませんでした。★いまは 見本の 字 です。
//   ★★★「門下の 決め方」（学校の 設定）は、★いまも 見本が ありません。
//
//   ★★守る こと
//     ① 決めを 画面で 作って いない
//     ② ★既定は「先生が 招く」。★「学生が 選ぶ」の 承認は 既定で 要る
//     ③ ★並べ替えない（★人気の 先生を 作らない）
//     ④ ★空き・埋まりを 出さない
//     ⑤ ★学生が 自分で 外す ところが ない
//     ⑥ ★体の ことを 1つも 読んで いない
//     ⑦ ★学校が そう して いない ときは 何も 出さない
//     ⑧ tx() ／ ⑨ 44 以上
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
  const 設 = readCode("components", "MonkaWaySetting.jsx");
  const 設生 = readRaw("components", "MonkaWaySetting.jsx");
  const 選 = readCode("components", "MonkaPickTeacher.jsx");
  const 選生 = readRaw("components", "MonkaPickTeacher.jsx");
  const src = fs.readFileSync(path.join(ROOT, "lib", "monkaWay.js"), "utf8");
  const L = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));

  console.log("① 決めを 画面で 作って いない");
  ["wayOf", "needsOk", "showsNeedsOk", "WAYS"].forEach((n) =>
    t(new RegExp("\\b" + n + "\\b").test(設), "★設定 ── " + n + " を 借りて いる"));
  ["studentCanChoose", "teacherRows", "requestReason", "requestState"].forEach((n) =>
    t(new RegExp("\\b" + n + "\\b").test(選), "★選ぶ ── " + n + " を 借りて いる"));
  t(!/\.select\(\s*["'`]\*/.test(設) && !/\.select\(\s*["'`]\*/.test(選),
    "★`select('*')` を 書いて いない");

  console.log("\n② 既定");
  t(L.DEFAULT_WAY === "invite", "★既定は「先生が 招く」");
  t(L.wayOf(null) === "invite", "★設定が 無ければ 既定");
  t(L.wayOf({ monka_way: "zzz" }) === "invite", "★知らない 字も 既定");
  t(L.DEFAULT_NEEDS_OK === true, "★承認は 既定で 要る");
  t(L.needsOk({ monka_way: "student" }) === true, "★学生が 選ぶ → 承認 要る");
  t(L.needsOk({ monka_way: "student", monka_needs_ok: false }) === false, "★要らない に できる");
  t(L.needsOk({ monka_way: "invite" }) === false, "★ほかの 形では 意味を 持たない");
  t(L.WAYS.length === 3, "★3つ（" + L.WAYS.length + "）");
  t(/rpc\(\s*"set_monka_way"/.test(設), "★台帳の 道で 書く（★記録が 残る）");
  t(!/from\("org_settings"\)[\s\S]{0,120}(update|upsert|insert)/.test(設),
    "★表を 直に 直して いない");

  console.log("\n③ 並べ替えない");
  t(!/\.sort\(/.test(選), "★画面で 並べ替えて いない");
  t(/rpc\(\s*"monka_teachers"/.test(選), "★台帳が 名前の 順で 返す");
  const r = L.teacherRows([{ teacher_id: "b", name: "い", students: 9 },
                           { teacher_id: "a", name: "あ", students: 1 }]);
  t(r[0].id === "b", "★lib でも 並べ替えない（★渡った 順の まま）");
  t(L.PICK_NOTE.some((x) => /空いている・人気などは 出しません。/.test(x)),
    "★★約束の 字が ある");

  console.log("\n④ 空き・埋まりを 出さない");
  ["空き", "埋ま", "残り", "あと ", "満員"].forEach((w) =>
    t(!new RegExp(w).test(選), "★「" + w + "」を 出して いない"));
  t(!/students\s*[<>]/.test(選) && !/students\s*===/.test(選),
    "★人数で 出し分けて いない");

  console.log("\n⑤ 自分で 外せない");
  t(!/外す/.test(選), "★外す ところが ない");
  t(!/delete\(/.test(選), "★消す 道が ない");
  t(L.PICK_DONE_NOTE.some((x) => /ここからは 外せません/.test(x)), "★★約束の 字が ある");
  // ★★待って いる あいだ だけ、★取り消せます（★見本の とおり）。
  t(/status: "withdrawn"/.test(選), "★取り消しは「取り下げ」で 書く（★消さない）");

  console.log("\n⑤b 見本の 字と 合って いる");
  const 素 = (s) => s.replace(/<[^>]*>/g, "").replace(/[\s　'"+★]/g, "");
  const 見S = fs.readFileSync(path.join(ROOT, "docs", "design", "pack-final",
    "00-動く見本-iPhoneで開く用.html"), "utf8");
  [...L.PICK_NOTE, ...L.PICK_WAITING_NOTE, ...L.PICK_DONE_NOTE].forEach((l) =>
    t(素(見S).includes(素(l)), "★見本に ある …… " + l.slice(0, 20)));
  // ★★先生の 名前が 頭に 入る 行は、★名前を 外して くらべます。
  L.askLines("斎藤", true).concat(L.askLines("斎藤", false)).forEach((l) => {
    const 字 = l.startsWith("斎藤") ? l.slice(2) : l;
    t(素(見S).includes(素(字)), "★見本に ある …… " + 字.slice(0, 20));
  });

  console.log("\n⑥ 体の ことを 読んで いない");
  ["entries", "体調", "throat", "voice_quality", "condition"].forEach((w) => {
    t(!new RegExp(w, "i").test(設), "★設定 ── 「" + w + "」が ない");
    t(!new RegExp(w, "i").test(選), "★選ぶ ── 「" + w + "」が ない");
  });
  t(!/entries|throat|voice_quality/i.test(選), "★体の 表に 触って いない");

  console.log("\n⑦ そう して いない ときは 出さない");
  t(/if \(!studentCanChoose\(setting\)\) return null;/.test(選), "★出さない ところが ある");
  t(L.studentCanChoose(null) === false, "★設定が 無ければ 出さない");
  t(L.studentCanChoose({ monka_way: "invite" }) === false, "★先生が 招く 形では 出さない");
  t(L.studentCanChoose({ monka_way: "student" }) === true, "★学生が 選ぶ 形でだけ 出す");

  console.log("\n⑧⑨ 字と 押しどころ");
  [["設定", 設生], ["選ぶ", 選生]].forEach(([n, g]) => {
    const 裸 = (g.match(/>[^<>{}\n]*[ぁ-んァ-ヶ一-龠][^<>{}\n]*</g) || [])
      .filter((s) => !/^>\s*<$/.test(s));
    t(裸.length === 0, "★" + n + " ── 裸の 日本語が ない"
      + (裸.length ? "（" + 裸[0].slice(0, 26) + "）" : ""));
    const 高 = g.match(/minHeight:\s*(\d+)/g) || [];
    t(高.length > 0 && 高.every((h) => Number(h.replace(/\D/g, "")) >= 44),
      "★" + n + " ── どれも 44 以上");
  });

  console.log("\n⑩ 見本が 来たら 気づく");
  // ★★★見本が 増えたら 赤に します。★字を 突き合わせ直す ため です。
  const 見 = fs.readFileSync(path.join(ROOT, "docs", "design", "pack-final",
    "00-動く見本-iPhoneで開く用.html"), "utf8")
    + fs.readFileSync(path.join(ROOT, "docs", "design", "pack-final",
      "00-動く見本-PC・iPad（運営）.html"), "utf8");
  t(見.includes("SC['担当の先生を選ぶ']"), "★「担当の 先生を 選ぶ」の 見本は ある");
  t(!見.includes("SC['門下の決め方']"), "★「門下の 決め方」の 見本は まだ ない（★来たら 赤に なります）");

  console.log(落ち === 0 ? "\n★すべて 通りました" : "\n★" + 落ち + "件 落ちました");
  process.exit(落ち === 0 ? 0 : 1);
})();
