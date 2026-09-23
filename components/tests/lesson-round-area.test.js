#!/usr/bin/env node
// STRIP: A（振る舞い）
// ============================================================================
// ★★★レッスン割は、★鍵が 開いて いる ときだけ 出る ── ★そして **届く**
//
//   ★出どころ 裁定139（レッスン割）／ 裁定176（作り終えて 隠して 置く）
//
//   ★★★2026-09-23 に 分かった こと ──
//     ★`LessonPrefs` ／ `LessonPrefMap` ／ `LessonRoundDone` の どれも、
//       ★**どこからも 呼ばれて いません** でした。
//     ★★`loadFeatures` を 呼ぶ ところも **0か所** でした。
//     ★★★見張りは ぜんぶ 緑 でした ── ★画面 1枚 ずつ しか 見て いなかった からです。
//       ★「作った」と「届く」は 別 です。★この 見張りは **届く** 方を 見ます。
//
//   ★★見る こと
//     ① 4画面 とも、★どこかから 呼ばれて いる（★宙に 浮いて いない）
//     ② 鍵の 判じは `featureOn` **1か所** だけ（★画面ごとに 書かない）
//     ③ 鍵の 字を 2か所に 書いて いない（★`LESSON_ROUND_KEY` を 借りる）
//     ④ 閉じて いる ときは **null**（★入口も 出さない・★裁定176 §3）
//     ⑤ 「近日公開」の たぐいを 書いて いない
//     ⑥ `loadFeatures` を 呼ぶ ところが ある
//     ⑦ 列を 名指しで 選んで いる（★`select('*')` を 書かない）
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

// ★★app/ と components/ と lib/ を 歩いて、★呼び出しを 数え直します。
function 歩く(d, 出) {
  if (!fs.existsSync(d)) return 出;
  fs.readdirSync(d).forEach((n) => {
    const f = path.join(d, n);
    if (fs.statSync(f).isDirectory()) {
      if (n === "tests" || n === "node_modules") return;
      return 歩く(f, 出);
    }
    if (/\.jsx?$/.test(n)) 出.push(f);
  });
  return 出;
}
const 紙 = 歩く(path.join(ROOT, "app"), 歩く(path.join(ROOT, "components"), 歩く(path.join(ROOT, "lib"), [])));
const 中 = {};
紙.forEach((f) => {
  中[f] = fs.readFileSync(f, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");
});

console.log("① 4画面 とも 呼ばれて いる");
const 画面 = ["LessonPrefs", "LessonPrefMap", "LessonRoundDone", "LessonPlaceSlots"];
t(紙.length > 0, "★紙を 読めた（" + 紙.length + "枚）");
画面.forEach((n) => {
  const 呼 = 紙.filter((f) =>
    path.basename(f) !== n + ".jsx" && new RegExp("<" + n + "\\b").test(中[f]));
  t(呼.length > 0, "★" + n + " ── 呼ばれて いる（"
    + (呼.map((f) => path.basename(f)).join("／") || "★どこからも") + "）");
});
// ★★まとめ役 そのものも、★誰かに 呼ばれて いなければ 意味が ありません。
const 親 = 紙.filter((f) =>
  path.basename(f) !== "LessonRoundArea.jsx" && /<LessonRoundArea\b/.test(中[f]));
t(親.length > 0, "★LessonRoundArea ── 呼ばれて いる（"
  + (親.map((f) => path.basename(f)).join("／") || "★どこからも") + "）");

console.log("\n② 鍵の 判じは 1か所");
const 判 = 紙.filter((f) => /\bfeatureOn\s*\(/.test(中[f]) && !/lib[\\/]featureOn\.js$/.test(f));
t(判.length === 1, "★`featureOn` を 呼ぶのは 1か所（"
  + 判.map((f) => path.basename(f)).join("／") + "）");
t(判.length === 1 && path.basename(判[0]) === "LessonRoundArea.jsx",
  "★呼ぶのは まとめ役");

console.log("\n③ 鍵の 字を 2か所に 書いて いない");
// ★★★見るのは「**鍵として** 直に 書かれた 字」だけ です。
//   ★★`from("lesson_rounds")` は 表の 名前、★`table: "lesson_rounds"` は 控えの 一覧 ──
//     ★どちらも 鍵 では ありません。★同じ 字 だからと 数えると、★台帳を 読む だけで 赤に なります。
//   ★★★だから「`featureOn(…, "lesson_rounds")` と 書いて いないか」で 見ます。
//     ★（★2026-09-23、★この 見張り 自身が 2度 自分に 当たりました。
//        ★同じ 形の 自分当たりを、★今日 だけで 10件 直して います）
const 字 = 紙.filter((f) => /featureOn\s*\([^)]*["']lesson_rounds["']/.test(中[f]));
t(字.length === 0, "★鍵の 字を 直に 書いて いない"
  + (字.length ? "（" + 字.map((f) => path.basename(f)).join("／") + "）" : ""));
const area = readCode("components", "LessonRoundArea.jsx");
t(/LESSON_ROUND_KEY/.test(area), "★`LESSON_ROUND_KEY` を 借りて いる");

console.log("\n④ 閉じて いる ときは null");
const 判行 = area.indexOf("featureOn(features, LESSON_ROUND_KEY)");
const 戻 = area.indexOf("if (!開) return null;");
t(判行 >= 0, "★鍵を 見て いる");
t(戻 > 判行, "★閉じて いれば null を 返す");
t(/if \(!round\) return null;/.test(area), "★回が 無い ときも 出さない");
// ★★中身を 描く ところ より、★返す 方が 先に 並んで いる こと
t(戻 < area.indexOf("<LessonPrefs"), "★null は 画面を 組み立てる 前");

console.log("\n⑤ 期待を 作らない");
// ★★★註を 落として から 見ます。
//   ★★この 見張りの 註 には「近日公開」と 書いて あります ── ★禁じる ために。
//     ★落とさないと、★自分の 説明で 赤に なります（★物差し ／ STRIP の 決め）。
//   ★★字そのもの（画面に 出る 言葉）は 残ります。
const 出字 = readCode("components", "LessonRoundArea.jsx");
["近日公開", "coming soon", "準備中", "もうすぐ", "お楽しみに"].forEach((w) => {
  t(!new RegExp(w, "i").test(出字), "★「" + w + "」を 書いて いない");
});

console.log("\n⑥ 台帳に 尋ねて いる");
const 尋 = 紙.filter((f) => /loadFeatures\s*\(/.test(中[f]) && !/lib[\\/]featureOn\.js$/.test(f));
t(尋.length > 0, "★`loadFeatures` を 呼ぶ ところが ある（"
  + (尋.map((f) => path.basename(f)).join("／") || "★0か所") + "）");

console.log("\n⑦ 列を 名指しで 選ぶ");
t(!/\.select\(\s*["'`]\*/.test(area), "★`select('*')` を 書いて いない");
["COLS_ROUND", "COLS_PREF", "COLS_NG", "COLS_TIMETABLE"].forEach((k) => {
  t(new RegExp(k).test(area), "★" + k + " を 借りて いる");
});

console.log("\n⑧ 名前は 台帳の 道 から 引く");
// ★★★`profiles` の 読みの 決めは `auth.uid() = id` **1つ だけ** です。
//   ★先生が 学生の 行を 直に 引くと 0行 ── ★誤りに ならず、★名前が 空に なるだけ。
//   ★★見た目で 気づけない ので、★見張りで 止めます。
t(!/from\(\s*["']profiles["']\s*\)/.test(area), "★`profiles` を 直に 引いて いない");
t(/rpc\(\s*["']get_connected_names["']/.test(area), "★`get_connected_names` を 通して いる");
t(/rpc\(\s*["']pref_map["']/.test(area), "★濃さは `pref_map` が 数える（★画面で 数えない）");

console.log(落ち === 0 ? "\n★すべて 通りました" : "\n★" + 落ち + "件 落ちました");
process.exit(落ち === 0 ? 0 : 1);
