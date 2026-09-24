#!/usr/bin/env node
// STRIP: B（見える 字）
// ============================================================================
// ★★★公演を 作る ── ★見本 `P_koenNew`
//   ★出どころ 裁定143 ／ 裁定148 ／ 裁定141
//     ／ woolsong-2026-09-21_4.zip ／ 00-動く見本-PC・iPad（運営）.html
//
//   ★★守る こと
//     ① 決めを 画面で 作って いない
//     ② ★種類の 一覧も 言葉も 台帳から（★画面に 写して いない）
//     ③ ★台帳に 列の 無い 欄を 出して いない
//     ④ ★`owner_user_id` は 必ず 自分（★`koen_insert` の 決め）
//     ⑤ ★入口の 判じは lib が 1か所 で する
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
  const 画 = readCode("components", "KoenNew.jsx");
  const 生 = readRaw("components", "KoenNew.jsx");
  const src = fs.readFileSync(path.join(ROOT, "lib", "koenArea.js"), "utf8")
    .replace(/from "@\/lib\/([a-zA-Z0-9]+)"/g, (mm, n) =>
      `from "${"file://" + path.join(ROOT, "lib", n + ".js")}"`);
  const L = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));

  console.log("① 決めを 画面で 作って いない");
  ["canCreate", "toKoenRow", "shownFields"].forEach((n) =>
    t(new RegExp("\\b" + n + "\\b").test(画), "★" + n + " を 借りて いる"));
  t(!/\.select\(\s*["'`]\*/.test(画), "★`select('*')` を 書いて いない");

  console.log("\n② 種類は 台帳から");
  t(/koen_kind_words/.test(画), "★台帳から 引く");
  ["オペラ・ミュージカル", "香盤表", "乗り番表", "場面 × 役"].forEach((w) =>
    t(!画.includes(w), "★「" + w + "」を 画面に 書いて いない"));
  t(/KIND_LABELS/.test(画), "★種類の 名は lib から 借りる");

  console.log("\n③ 台帳に 無い 欄を 出さない");
  t(L.NEW_FIELDS.length === 5, "★見本は 5つ（" + L.NEW_FIELDS.length + "）");
  t(L.shownFields().length === 3, "★出すのは 3つ（" + L.shownFields().length + "）");
  t(L.shownFields().map((f) => f.key).join(",") === "title,opens_on,venue", "★題名・本番の日・会場");
  ["work", "from"].forEach((k) =>
    t(!L.SHOWN_FIELDS.includes(k), "★「" + k + "」を 出して いない（★列が ない）"));
  // ★★出して いない ものを、★こっそり 入れて いない こと
  const 入 = 画.slice(画.indexOf("toKoenRow"), 画.indexOf("toKoenRow") + 200);
  t(!/work|rehearsal/.test(入), "★入れる ところにも 無い");
  const r = L.toKoenRow({ title: " あ ", kind: "opera" }, { orgId: "o", userId: "u" });
  t(!("work" in r) && !("from" in r), "★台帳に 渡す 形にも 無い");

  console.log("\n④ owner_user_id は 自分");
  t(r.owner_user_id === "u", "★自分を 入れる");
  t(r.status === "draft", "★はじめは 下書き");
  t(r.tier_people === L.FIRST_TIER && L.FIRST_TIER === 15, "★はじめの 段は 15（★無料）");
  t(r.title === "あ", "★前後の あきを 落とす");
  t(L.canCreate({ title: "  " }) === false, "★題名が 空なら 作れない");

  console.log("\n⑤ 入口の 判じは lib で 1か所");
  t(typeof L.mayCreateKoen === "function", "★`mayCreateKoen` が ある");
  t(L.mayCreateKoen({ koen: true }, true) === true, "★鍵が 開いて いて できこと あり");
  t(L.mayCreateKoen({ koen: false }, true) === false, "★鍵が 閉じて いれば false");
  t(L.mayCreateKoen({ koen: true }, false) === false, "★できことが 無ければ false");
  t(L.mayCreateKoen(null, true) === false, "★★読み込み中も false");
  // ★★呼ぶ 側が 自分で 組み立てて いない こと
  const vt = readCode("components", "VocalTracker.jsx");
  t(/mayCreateKoen\(features, canOps\(gate, "gyoji"\)\)/.test(vt), "★画面は lib に 尋ねる");

  console.log("\n⑥ 但し書きが 見本の まま");
  const 見 = fs.readFileSync(path.join(ROOT, "docs", "design", "pack-final",
    "00-動く見本-PC・iPad（運営）.html"), "utf8");
  const 素 = (s) => s.replace(/<[^>]*>/g, "").replace(/[\s　'"+★]/g, "");
  [...L.NEW_KIND_NOTE, ...L.NEW_NOTE, L.NEW_KIND_SUB].forEach((l) =>
    t(素(見).includes(素(l)), "★見本に ある …… " + l.slice(0, 20)));
  t(/出演者の 体調は 誰にも 見えません/.test(L.NEW_KIND_NOTE[0]), "★★約束の 字が ある");

  console.log("\n⑦⑧ 字と 押しどころ");
  const 裸 = (生.match(/>[^<>{}\n]*[ぁ-んァ-ヶ一-龠][^<>{}\n]*</g) || [])
    .filter((s) => !/^>\s*<$/.test(s));
  t(裸.length === 0, "★裸の 日本語が ない" + (裸.length ? "（" + 裸[0].slice(0, 26) + "）" : ""));
  const 高 = 生.match(/minHeight:\s*(\d+)/g) || [];
  t(高.length > 0 && 高.every((h) => Number(h.replace(/\D/g, "")) >= 44), "★どれも 44 以上");

  console.log(落ち === 0 ? "\n★すべて 通りました" : "\n★" + 落ち + "件 落ちました");
  process.exit(落ち === 0 ? 0 : 1);
})();
