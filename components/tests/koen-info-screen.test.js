#!/usr/bin/env node
// STRIP: B（見える 字）
// ============================================================================
// ★★★公演の 情報 ── ★見本 `P_koenInfo`
//   ★出どころ 裁定141 ／ 裁定144 ／ design-v36 の 直し ⑤
//     ／ woolsong-2026-09-21_8.zip ／ 00-動く見本-PC・iPad（運営）.html（md5 b5c54333）
//
//   ★★守る こと
//     ① 決めを 画面で 作って いない
//     ② ★題名・本番の 日・会場が **実際に 入る**（design-v36 ⑤）
//     ③ ★0行を 見て いる（★RLS で 弾かれた 直しは 誤りに ならない）
//     ④ ★期限を 画面で 計算して いない（★台帳が 決める）
//     ⑤ ★延ばせるのは 1回だけ・90日まで
//     ⑥ 但し書きが 見本の まま（★裁定144 の 約束）／ ⑦ tx() ／ ⑧ 44 以上
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
  const 画 = readCode("components", "KoenInfo.jsx");
  const 生 = readRaw("components", "KoenInfo.jsx");
  const libCode = readCode("lib", "koenInfo.js");
  const src = fs.readFileSync(path.join(ROOT, "lib", "koenInfo.js"), "utf8");
  const L = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));

  console.log("① 決めを 画面で 作って いない");
  ["isExpired", "canEditInfo", "canExtend", "extendLimit", "extendReason", "EDITABLE"]
    .forEach((n) => t(new RegExp("\\b" + n + "\\b").test(画), "★" + n + " を 借りて いる"));
  t(!/\.select\(\s*["'`]\*/.test(画), "★`select('*')` を 書いて いない");

  console.log("\n② 実際に 入る");
  t(/from\("koen"\)[\s\S]{0,120}\.update\(/.test(画), "★台帳に 書いて いる");
  t(/onBlur=\{\(e\) => 書く\(f\.key, e\.target\.value\)\}/.test(画), "★欄から 書く 道が ある");
  t(L.EDITABLE.length === 3, "★直せる 欄は 3つ");
  t(L.EDITABLE.map((f) => f.key).join(",") === "title,opens_on,venue", "★題名・本番の 日・会場");

  console.log("\n③ 0行を 見て いる");
  t(/\.select\("id"\)/.test(画), "★直した あと 何行 返ったかを 見る");
  t(/data\.length === 0/.test(画), "★0行なら 直せて いない と する");

  console.log("\n④ 期限を 画面で 計算して いない");
  t(!/\+\s*30\b/.test(画) && !/\+\s*30\b/.test(libCode), "★「＋30日」を 数えて いない");
  t(/valid_until/.test(画), "★台帳の 日を そのまま 出す");
  t(/rpc\(\s*"extend_koen"/.test(画), "★延ばすのは 台帳の `extend_koen`");
  t(!/setKoen\([\s\S]{0,80}valid_until:/.test(画), "★画面で 期限を 書き換えて いない");

  console.log("\n⑤ 1回だけ・90日まで");
  t(L.EXTEND_MAX_DAYS === 90, "★90日");
  t(L.extendLimit({ valid_until: "2026-03-24" }) === "2026-06-22", "★90日 先を 出す");
  t(L.canExtend({ valid_until: "2099-01-01" }) === true, "★まだなら 出す");
  t(L.canExtend({ valid_until: "2099-01-01", extended_at: "x" }) === false, "★1回 延ばしたら 出さない");
  t(L.canExtend({ valid_until: "2020-01-01" }) === false, "★期限切れなら 出さない");
  t(L.canExtend({}) === false, "★お支払いが まだなら 出さない");
  t(/ALREADY_EXTENDED/.test(libCode), "★台帳の わけを 言葉に して いる");

  console.log("\n⑥ 但し書きが 見本の まま");
  const 見 = fs.readFileSync(path.join(ROOT, "docs", "design", "pack-final",
    "00-動く見本-PC・iPad（運営）.html"), "utf8");
  const 素 = (s) => s.replace(/<[^>]*>/g, "").replace(/[\s　]+/g, "");
  L.INFO_NOTE.forEach((l) => t(素(見).includes(素(l)), "★見本に ある …… " + l.slice(0, 20)));
  t(/使い回すことは できません/.test(L.INFO_NOTE[0]), "★★裁定144 の 約束が ある");
  t(/出演者の 記録は ご本人に 残ります/.test(L.INFO_NOTE[1]), "★★記録の 約束が ある");

  console.log("\n⑦⑧ 字と 押しどころ");
  const 裸 = (生.match(/>[^<>{}\n]*[ぁ-んァ-ヶ一-龠][^<>{}\n]*</g) || [])
    .filter((s) => !/^>\s*<$/.test(s));
  t(裸.length === 0, "★JSX に 裸の 日本語が ない" + (裸.length ? "（" + 裸[0].slice(0, 30) + "）" : ""));
  const 高 = 生.match(/minHeight:\s*(\d+)/g) || [];
  t(高.length > 0 && 高.every((h) => Number(h.replace(/\D/g, "")) >= 44), "★どれも 44 以上");

  console.log(落ち === 0 ? "\n★すべて 通りました" : "\n★" + 落ち + "件 落ちました");
  process.exit(落ち === 0 ? 0 : 1);
})();
