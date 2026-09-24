#!/usr/bin/env node
// STRIP: B
// ============================================================================
// ★対応表（`tools/a_group_conf.json`）が、★別の 画面を 指して いない か
//
//   ★★★2026-09-24、★手で 4つ 写して、★3つ まちがえました ──
//     `公演`     … スマホの 見本は **出演者の 側**。★運営の `KoenArea` に 当てて いました
//     `当日の進行` … 運営の 見本。★出演者の `KoenDayFlow` に 当てて いました
//     `自分の予定` … 先生の「来られない」の 表。★`KoenMySchedule` に 当てて いました
//   ★★同じ 名が、★スマホの 見本と 運営の 見本で **別の もの** を 指します。
//     ★★名だけ で 写すと、★当たりません。
//   ★★★まちがえた 対応表は、★出まかせの「欠け」を 作ります。
//     ★★在る ものを「無い」と 言い、★無い ものを 直そうと します。
//
//   ★★だから、★束と 画面が **自分で 名乗って いる** 見本の 名を 読み、
//     ★対応表の 名と ちがって いたら 止めます。
//     ★★名乗って いない ものは 見ません（★名乗りは まだ 全部には ありません）。
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readRaw } = require("./_source");

const ROOT = path.join(__dirname, "..", "..");
let 落ち = 0;
function t(cond, label) {
  if (cond) console.log("  ok   " + label);
  else { console.log("  NG   " + label); 落ち++; }
}

const 表 = JSON.parse(fs.readFileSync(path.join(ROOT, "tools/a_group_conf.json"), "utf8"));
const 覚え = JSON.parse(fs.readFileSync(
  path.join(ROOT, "tools/a_group_conf_notes.json"), "utf8"));

/**
 * ★その 紙が「私は この 見本です」と 名乗って いる 名。
 *
 *   ★★★頭だけ では 足りません（★2026-09-24）。
 *     ★1つの 束が、★何枚もの 見本を 持つ ことが あります ──
 *       `lib/koenArea.js` …… 公演の運営 ＋ 公演を作る
 *       `lib/myTimetable.js` … 時間割 ＋ 授業を入れる ＋ 自分のコマ
 *     ★★節の 覚え書きに 名乗って います。★紙 ぜんたいを 読みます。
 */
function 名乗り(路) {
  const 生 = readRaw(...路.split("/"));
  const 出 = new Set();
  const re = /見本[^\n]{0,24}?(?:SC|SH|P)\['([^']{1,24})'\]/g;
  let m;
  while ((m = re.exec(生))) 出.add(m[1]);
  return 出;
}

console.log("① 較正 ── ★名乗りを 読めて いる");
{
  const 読 = 名乗り("components/MyTimetable.jsx");
  t(読.size > 0, "★MyTimetable.jsx が 名乗って いる（" + [...読].join("／") + "）");
}

console.log("\n② 対応表が、★別の 画面を 指して いない");
{
  // ★★★見るのは **画面ごと** です。★紙ごと では ありません。
  //   ★★1つの 束が いくつもの 見本を 持つ ことが あります。
  //     ★★だから「どれか 1つの 紙が 名乗って いれば よい」に します。
  //   ★★★どの 紙も 名乗らず、★けれど **別の 名**を 名乗って いる ときだけ 止めます。
  //     ★★それが「別の 画面を 指して いる」の 形 です。
  let 見た = 0;
  Object.keys(表).forEach((画面) => {
    const 無 = 表[画面].filter((路) => !fs.existsSync(path.join(ROOT, 路)));
    if (無.length) { t(false, "★" + 画面 + " …… " + 無.join("／") + " が ありません"); return; }
    // ★★1万行の 紙（`VocalTracker.jsx`）は、★何十もの 画面を 抱えて います。
    //   ★★名乗りを 1つに 決められません。★その 画面は 見ません。
    const 紙 = 表[画面].filter((路) => !路.endsWith("VocalTracker.jsx"));
    if (紙.length === 0) return;
    const 名 = new Set();
    紙.forEach((路) => 名乗り(路).forEach((x) => 名.add(x)));
    if (名.size === 0) return;          // ★1枚も 名乗って いない ものは 見ません
    見た += 1;
    if (名.has(画面)) { t(true, "★" + 画面 + " …… 名乗りと 合って います"); return; }
    // ★★★合わない ときは、★**1行 書いて から** 通します。
    //   ★★この 蔵では 1つの 束が 兄弟の 画面を まとめて 持ちます。
    //     ★★だから 合わない こと 自体は 誤り では ありません。
    //   ★★けれど 黙って 通すと、★別の 家の 画面に 当てた まちがいが 隠れます。
    t(!!覚え[画面],
      "★" + 画面 + " …… " + 紙.join("／") + " は「" + [...名].join("／")
      + "」と 名乗って います。★`tools/a_group_conf_notes.json` に わけを 書いて ください");
    if (覚え[画面]) t(String(覚え[画面]).trim().length > 0, "★" + 画面 + " の わけが 空 です");
  });
  t(見た >= 10, "★較正 ── ★名乗って いる 画面を 数えられて いる（" + 見た + "）");

  // ★★★覚え書きが 古びない ように、★要らなく なった 行を 見つけます。
  //   ★★名乗りが 合う ように なったら、★その 行は もう 要りません。
  Object.keys(覚え).forEach((画面) => {
    if (画面 === "_") return;
    if (!表[画面]) {
      t(false, "★" + 画面 + " は 対応表に ありません。★覚え書きから 消して ください");
      return;
    }
    const 紙 = 表[画面].filter((路) => !路.endsWith("VocalTracker.jsx"));
    const 名 = new Set();
    紙.forEach((路) => { if (fs.existsSync(path.join(ROOT, 路))) 名乗り(路).forEach((x) => 名.add(x)); });
    t(!名.has(画面),
      "★" + 画面 + " は 名乗りと 合う ように なりました。★覚え書きから 消して ください");
  });
}

console.log(落ち === 0 ? "\n★すべて 通りました" : "\n★" + 落ち + "件 落ちました");
process.exit(落ち === 0 ? 0 : 1);
