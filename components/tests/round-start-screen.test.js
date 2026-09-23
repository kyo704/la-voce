#!/usr/bin/env node
// STRIP: B（見える 字）
// ============================================================================
// ★★★回を 始める ── ★見本 `SC['回を始める']`
//   ★出どころ 裁定185 ／ sql/69
//     ／ woolsong-2026-09-21_1.zip ／ 00-動く見本-PC・iPad（運営）.html（md5 0132714e）
//
//   ★★守る こと
//     ① 決めを 画面で 作って いない
//     ② ★日づけを ここで 決めない（★曜日・時こくは 目安）
//     ③ ★形の 見方が 台帳と 同じ（★3つ）。★字は 読める 言葉
//     ④ ★まとめて 始めても、★止まるのは その 先生 だけ
//     ⑤ ★お知らせを 送る 形が ない
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
  const 画 = readCode("components", "RoundStart.jsx");
  const 生 = readRaw("components", "RoundStart.jsx");
  const src = fs.readFileSync(path.join(ROOT, "lib", "roundStart.js"), "utf8");
  const L = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));

  console.log("① 決めを 画面で 作って いない");
  ["checkForm", "canStart", "skipReason", "startResult", "defaultDue", "MODES", "COUNT_PRESETS"]
    .forEach((n) => t(new RegExp("\\b" + n + "\\b").test(画), "★" + n + " を 借りて いる"));

  console.log("\n② 日づけを ここで 決めない");
  t(/日付は ここでは 決めません。/.test(L.RS_MODE_NOTE[0]), "★★約束の 字が ある");
  t(/集める前に 決めたら、集める意味が ありません。/.test(L.RS_MODE_NOTE[1]), "★★わけが 書いて ある");
  t(/目安です。実際の日は 希望を 見てから 決めます/.test(L.RS_WHEN_NOTE), "★目安 と 書いて ある");
  // ★★曜日・時こくを 台帳に 渡して いない こと
  const 呼 = 画.slice(画.indexOf("start_lesson_rounds"), 画.indexOf("start_lesson_rounds") + 400);
  t(!/wd|hhmm|mode/.test(呼), "★曜日・時こく・置き方を 台帳に 渡して いない");
  t(/p_from[\s\S]{0,60}p_to[\s\S]{0,60}p_due[\s\S]{0,60}p_need/.test(呼),
    "★渡すのは 期間・締切・回数 だけ");

  console.log("\n③ 形の 見方が 台帳と 同じ");
  t(L.checkForm({ from: "2026-10-01", to: "2026-10-31", due: "2026-10-05", count: 12 })
    === "締切は、期間の はじまりより 前に してください", "★締切");
  t(L.checkForm({ from: "2026-10-31", to: "2026-10-01", due: "2026-09-28", count: 12 })
    === "期間の 終わりが、はじまりより 前です", "★期間");
  t(L.checkForm({ from: "2026-10-01", to: "2026-10-31", due: "2026-09-28", count: 0 })
    === "回数は 1〜60 の あいだで", "★回数 0");
  t(L.checkForm({ from: "2026-10-01", to: "2026-10-31", due: "2026-09-28", count: 61 })
    === "回数は 1〜60 の あいだで", "★回数 61");
  t(L.checkForm({ from: "2026-10-01", to: "2026-10-31", due: "2026-09-28", count: 12 }) === "",
    "★正しければ 空");
  t(L.MIN_COUNT === 1 && L.MAX_COUNT === 60, "★1〜60（★台帳と 同じ）");
  // ★★台帳の 生の 字を 画面に 出さない こと
  ["DUE_AFTER_START", "BAD_PERIOD", "BAD_COUNT", "ALREADY_OPEN"].forEach((w) =>
    t(!new RegExp(w).test(画), "★「" + w + "」を 画面に 出して いない"));
  // ★★★字を 書かない だけ では 足りません。
  //   ★`{r.skipped}` と 出せば、★台帳の 生の 字が そのまま 画面に 出ます。
  //   ★★（★2026-09-24、★わざと そう して 赤に なりませんでした）
  //   ★★★`skipped` を **必ず** `skipReason()` に 通して いる ことを 見ます。
  const 出し = 画.match(/\{[^{}]*\.skipped[^{}]*\}/g) || [];
  t(出し.length > 0, "★止まった わけを 出して いる（" + 出し.length + "か所）");
  t(出し.every((x) => /skipReason\(/.test(x)),
    "★どれも `skipReason()` を 通して いる" + (出し.length ? "（" + 出し[0].slice(0, 30) + "）" : ""));

  console.log("\n④ 止まるのは その 先生 だけ");
  t(/rpc\(\s*"start_lesson_rounds"/.test(画), "★まとめて 始める 道を 呼ぶ");
  const r = L.startResult([{ round_id: "x" }, { round_id: null, skipped: "ALREADY_OPEN" }]);
  t(r.started === 1 && r.skipped === 1, "★始まった 人と 止まった 人を 分ける");
  t(L.skipReason("ALREADY_OPEN: …") === "開いている 回が あります。先に 確定して ください",
    "★読める 言葉に する");
  t(/out\.skippedRows\.map/.test(画), "★止まった 人 だけ を 出す");
  t(/out\.started/.test(画), "★始まった 数も 出す");

  console.log("\n⑤ お知らせを 送らない");
  ["notify", "sendMail", "org_messages", "resend", "line_"].forEach((w) =>
    t(!new RegExp(w, "i").test(画), "★「" + w + "」が ない"));
  // ★★番号で 指しません。★どこかに ある ことを 見ます（★行が 増減しても 崩れません）。
  t(L.RS_NOTE.some((x) => /お知らせは 送りません。催促も しません。/.test(x)),
    "★★約束の 字が ある");
  t(L.RS_NOTE.some((x) => /締切を 過ぎても 自動では 閉じません/.test(x)),
    "★★自動で 閉じない 約束が ある");

  console.log("\n⑥ 但し書きが 見本の まま");
  const 見 = fs.readFileSync(path.join(ROOT, "docs", "design", "pack-final",
    "00-動く見本-PC・iPad（運営）.html"), "utf8");
  const 素 = (s) => s.replace(/<[^>]*>/g, "").replace(/[\s　'"+★]/g, "");
  [...L.RS_MODE_NOTE, ...L.RS_NOTE].forEach((l) =>
    t(素(見).includes(素(l)), "★見本に ある …… " + l.slice(0, 20)));
  // ★★1行目は 人数が 入ります。★前と 後ろに 分けて くらべます。
  const 前後 = L.startedLine(5).split("5人");
  t(前後.length === 2 && 前後.every((x) => 素(見).includes(素(x))),
    "★見本に ある …… " + L.startedLine(5).slice(0, 20));
  t(L.startedLine(0).includes("方の"), "★数が 分からなければ「方」（★0人 と 書かない）");
  t(L.startedLine(5).includes("5人の"), "★分かれば 数を 書く");

  console.log("\n⑦⑧ 字と 押しどころ");
  const 裸 = (生.match(/>[^<>{}\n]*[ぁ-んァ-ヶ一-龠][^<>{}\n]*</g) || [])
    .filter((s) => !/^>\s*<$/.test(s));
  t(裸.length === 0, "★裸の 日本語が ない" + (裸.length ? "（" + 裸[0].slice(0, 26) + "）" : ""));
  const 高 = 生.match(/minHeight:\s*(\d+)/g) || [];
  t(高.length > 0 && 高.every((h) => Number(h.replace(/\D/g, "")) >= 44), "★どれも 44 以上");

  console.log(落ち === 0 ? "\n★すべて 通りました" : "\n★" + 落ち + "件 落ちました");
  process.exit(落ち === 0 ? 0 : 1);
})();
