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
// ★★★`LessonPlaceSlots` を 消しました（★2026-09-24）。
//   ★同じ 見本（`P_okeru`）の 画面が `OpsOkeru` に すでに ありました。
//   ★★`components/tests/no-duplicate-screens.test.js` が 見つけました。
const 画面 = ["LessonPrefs", "LessonPrefMap", "LessonRoundDone", "OpsOkeru", "RoundStart"];
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

console.log("\n② 鍵の 判じは 1機能に 1か所");
// ★★★2026-09-24 ── ★機能が 増えました（レッスン割・公演）。
//   ★★「ぜんぶで 1か所」では なく、★**1つの 機能に 1か所** です。
//     ★`LessonRoundArea` が `lesson_rounds`、★`KoenArea` が `koen`。
//   ★★★見るのは 2つ ──
//     ① レッスン割の 鍵を 見て いるのは まとめ役 だけ か
//     ② `featureOn` を 呼ぶ ところは、★どれも **まとめ役** か（★画面に 散らばって いない）
const 判 = 紙.filter((f) => /\bfeatureOn\s*\(/.test(中[f]) && !/lib[\\/]featureOn\.js$/.test(f));
const レ鍵 = 紙.filter((f) => /LESSON_ROUND_KEY/.test(中[f]) && !/lib[\\/]lessonRound\.js$/.test(f));
t(レ鍵.length === 1 && path.basename(レ鍵[0]) === "LessonRoundArea.jsx",
  "★レッスン割の 鍵を 見るのは まとめ役 だけ（" + レ鍵.map((f) => path.basename(f)).join("／") + "）");
// ★★★`featureOn` を 呼んで よい ところ ──
//   ★まとめ役（`*Area.jsx`）と、★その 機能の 決めを 持つ lib（`lib/koenArea.js` の
//     `mayCreateKoen()` の ような もの）。
//   ★★★画面が それぞれ 判じる のを 止めたい のです。★1機能 1か所 が 決め です。
t(判.every((f) => /Area\.jsx$/.test(f) || /^lib[\\/]/.test(path.relative(ROOT, f))),
  "★`featureOn` を 呼ぶのは まとめ役 か その lib（"
    + 判.map((f) => path.basename(f)).join("／") + "）");
// ★★**画面**が 自分で 組み立てて いない こと。
//   ★lib は 組み立てて よい ところ です ── ★そこが 決めを 持つ 場所 だからです。
const 組 = 紙.filter((f) => !/^lib[\\/]/.test(path.relative(ROOT, f))
  && /featureOn\s*\([^)]*\)\s*&&/.test(中[f]));
t(組.length === 0, "★★`featureOn(...) && …` を 画面で 組み立てて いない"
  + (組.length ? "（" + 組.map((f) => path.basename(f)).join("／") + "）" : ""));
t(判.length > 0, "★鍵を 見て いる ところが ある（" + 判.length + "か所）");

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
// ★★★2026-09-24 に 変えました。
//   ★前は「回が 無ければ 何も 出さない」でした。★見た目は きれい ですが、
//     ★★先生は **始める ところに たどり着けません** でした（★裁定185）。
//   ★★いまは ── ★学生には 出さない ／ ★先生には「回を 始める」を 出す。
t(/if \(!round\) \{/.test(area), "★回が 無い ときの 分かれ道が ある");
const 無 = area.slice(area.indexOf("if (!round) {"), area.indexOf("if (!round) {") + 500);
t(/if \(!教 \|\| myOrgs\.length === 0\) return null;/.test(無), "★★学生には 出さない（★始めるのは 先生か 事務）");
// ★★★2026-09-24 ── ★学校を `limit 1` で 選びません（★裁定140・sql/71）。
t(/rpc\(\s*"my_orgs"\)/.test(area), "★どの 学校に いるかは 台帳が 返す");
t(!/from\("memberships"\)[\s\S]{0,120}limit\(1\)/.test(area), "★★`limit 1` で 学校を 選んで いない");
t(/is_student !== true/.test(area), "★学生と して いる 学校は 外す（★学生の 回は ない）");
t(/<RoundStart/.test(無), "★先生には 始める ところを 出す");
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
  // -------------------------------------------------------------------------
  // ★入口の 一枚（★見本 `P_wari`・★2026-09-24・段3a A群）
  //
  //   ★★これが ありません でした。★開くと いきなり 地図 でした。
  // -------------------------------------------------------------------------
  {
    const 画 = area;
    const 束 = require("./_lessonRoundLib");
    t(/view === 入口/.test(画), "★入口の 一枚が ある");
    t(/useState\(入口\)/.test(画), "★はじめに 出るのが 入口");
    ["HUB_WARN", "HUB_NOW_HEAD", "HUB_STEPS", "HUB_NOTES", "hubCounts"].forEach((w) =>
      t(new RegExp(w).test(画), "★" + w + " を 出して いる"));
    // ★★数えるのは 束 です。★画面で 数えません。
    t(!/monka\.length - /.test(画) && !/Object\.keys\(counts\)\.length/.test(画),
      "★画面で 数えて いない");
    const c = 束.hubCounts({ monkaCount: 18, prefs: { "a:1": 2, "a:2": 2, "b:1": 2 }, placed: { a: 1 } });
    t(c.total === 18 && c.answered === 2 && c.notYet === 16 && c.placed === 1,
      "★数え方（出した2・まだ16・置いた1）");
    // ★★註は 4行 とも、★確かめた もの だけ。
    const 註 = 束.HUB_NOTES.join("");
    ["担当の 先生と、日程を 組む 方だけ", "授業名は 出ません",
      "催促は しません", "レッスンの 日程を 組む"].forEach((w) =>
        t(註.includes(w), "★" + w + " が ある"));
    // ★★★書いた 以上、★台帳が そう なって いる こと。
    const rls = readRaw("supabase", "migrations", "20260101000009_base_09_rls.sql");
    const i = rls.indexOf('create policy "lesson_prefs_read_staff"');
    t(i > 0, "★較正 ── ★決まりが 読めて いる");
    // ★★★次の `drop policy` の 手前 までで 切ります（★2026-09-24）。
    //   ★★はじめ 700字で 切って いました。★隣の 決まりまで 入り、
    //     ★そちらの `'meibo'` を 掴んで 落ちて いました。★窓の 誤り です。
    const 本 = rls.slice(i, rls.indexOf("drop policy", i + 10));
    t(/has_can\(r\.org_id, 'sched_all'/.test(本), "★日程を 組む 方");
    t(/a\.teacher_id = auth\.uid\(\)/.test(本), "★担当の 先生");
    t(!/monka_representative|'meibo'/.test(本), "★この 決まりに ほかの 道が ない");
    // ★★★`lesson_prefs` の 決まりは 3つ だけ で ある こと。
    //   ★★1つずつ 見ても、★4つ目が 足されたら 気づけません。
    //   ★★★2026-09-24 ── ★1つの 紙 だけ を 見て いて、★2つ しか
    //     ★数えられません でした。★3つ目（`lesson_prefs_read_own`）は
    //     ★別の 紙（`20260923440003_opus_47_…`）に あります。
    //     ★★台帳を 数えたら 3つ でした。★紙は 台帳では ありません。
    //   ★★だから `supabase/migrations/` を **ぜんぶ** 見ます。
    const 紙 = fs.readdirSync(path.join(ROOT, "supabase", "migrations"))
      .filter((n) => n.endsWith(".sql"))
      .map((n) => fs.readFileSync(path.join(ROOT, "supabase", "migrations", n), "utf8"))
      .join("\n");
    const 決 = new Set((紙.match(/create policy "?lesson_prefs_[a-z_]+"?/g) || [])
      .map((x) => x.replace(/"/g, "").replace("create policy ", "")));
    t(決.size === 3, "★決まりは 3つ だけ（" + 決.size + "：" + [...決].join("／") + "）");
    // ★★催促の 道を、★この 画面に 作って いない こと。
    t(!/nudge/.test(画), "★催促の 道が ない");
  }


console.log(落ち === 0 ? "\n★すべて 通りました" : "\n★" + 落ち + "件 落ちました");
process.exit(落ち === 0 ? 0 : 1);
