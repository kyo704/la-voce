#!/usr/bin/env node
// STRIP: B（言葉）── ★約束の 文を 見ます。★何も 落としません。
/**
 * ★9月25日の 晩に 作った 5枚の 見張り（★C群の 残り）。
 *
 *   ★★1枚ずつ 別の 紙に せず、★1つに まとめました ── ★どれも 小さい からです。
 *     ★★見る のは「約束の 文」と「台帳に 無い ものを 出して いない こと」だけ です。
 *
 *   ★★較正 ── ★各節の 最後に、★わざと 壊した ときに 落ちる 見方を 置いて います。
 */
const fs = require("fs");
const path = require("path");
const { stripComments, readRaw } = require("./_source");
const ROOT = path.join(__dirname, "..", "..");
let pass = 0, fail = 0;
function t(c, label) {
  if (c) { console.log(`  ✓ ${label}`); pass++; } else { console.log(`  ✗ ${label}`); fail++; }
}
const 読 = async (名, 置換) => {
  let s = readRaw("lib", 名);
  if (置換) for (const [k, v] of Object.entries(置換)) {
    s = s.replace(`"${k}"`, JSON.stringify("data:text/javascript;base64,"
      + Buffer.from(readRaw("lib", v), "utf-8").toString("base64")));
  }
  return import("data:text/javascript;base64," + Buffer.from(s, "utf-8").toString("base64"));
};

async function main() {
  console.log("=== 一 ★曲を 直す ===");
  const kn = await 読("kyokuNaosu.js", { "@/lib/practiceNote": "practiceNote.js" });
  const pn = await 読("practiceNote.js");
  t(kn.NOTE === "打った そばから 残ります。記録した日数・本番の 回数は、記録から 数えているので 直せません。",
    "★下の 断りが 見本の まま");
  // ★★★「直せません」と 書く 以上、★直せる 口が あっては なりません。
  const knJsx = stripComments(readRaw("components", "KyokuNaosu.jsx"));
  t(!/onChange\("created_at"|直す\("created_at"/.test(knJsx), "★はじめて 記録した日に 打てる 口が 無い");
  t(!/日数|本番の 回数/.test(knJsx.replace(/記録した日数・本番の 回数/g, "")), "★数を 直す 口が 無い");
  // ★★ようすの 4つは 1つの もと から。★台帳の CHECK と 同じ。
  t(kn.STATUS_CHOICES === pn.REPERTOIRE_STATUS, "★ようすの もとは 1つ");
  const sql = fs.readFileSync(path.join(ROOT, "supabase",
    "migrations", "20260101000003_base_03_constraints.sql"), "utf-8");
  // ★★`repertoire_status_check` の 行 だけ を 切り出します（★形を 覚えません）。
  const 行 = sql.split("\n").find((x) => x.includes("repertoire_status_check") && x.includes("ARRAY"));
  const mm = 行 ? [行, 行] : null;
  if (mm) {
    const 台 = [...mm[1].matchAll(/'([^']+)'/g)].map((x) => x[1]).sort();
    t(JSON.stringify(台) === JSON.stringify([...pn.REPERTOIRE_STATUS].sort()),
      `★台帳の CHECK と 同じ（${台.join("/")}）`);
  } else t(false, "★台帳の CHECK を 読めません");
  // ★★消えた 写し が 戻って いない こと。
  t(!/しばらく 置く/.test(stripComments(readRaw("lib", "recordSheets.js"))),
    "★`recordSheets` に 写しが 戻って いない");

  console.log("=== 二 ★日を 選ぶ ===");
  const dp = await 読("dayPick.js");
  t(dp.backLineOf("受診用") === "戻ると、受診用 に 帰ります。", "★戻る 先を 名のる");
  t(dp.backLineOf("") === "", "★名が 無ければ その 行を 出さない");
  // ★★3つの 使い方。
  t(dp.markOf("range", { from: "2026-09-01", to: "2026-09-05" }, "2026-09-03") === "mid",
    "★あいだの 日に 印");
  t(dp.markOf("one", { one: "2026-09-03" }, "2026-09-03") === "on", "★1日 の 印");
  t(dp.tap("one", { one: "2026-09-03" }, "2026-09-03").one === null, "★もう一度 押すと 外れる");
  t(dp.tap("multi", { many: ["2026-09-03"] }, "2026-09-03").many.length === 0, "★いくつでも 外せる");
  // ★★台帳に 触れて いない。
  const dpAll = stripComments(readRaw("lib", "dayPick.js"))
    + stripComments(readRaw("components", "DayPick.jsx"));
  t(!/from\(["']/.test(dpAll), "★台帳を 1つも 引いて いない");

  console.log("=== 三 ★本番の 予定 ===");
  const hy = await 読("honbanYotei.js");
  const 約 = [
    "本番の朝に「きょう」の 一番上に、書いた ことばが そのまま 出ます。",
    "アプリは 1文字も 足しません。要約も しません。",
    "知らせは 出しません。書いていない人には 何も 出ません。",
    "書くように 誘いません。書く場所が あるだけです。"
  ];
  約.forEach((l) => t(hy.NOTES.includes(l), `★「${l.slice(0, 16)}…」`));
  // ★★★②「1文字も 足しません」── ★整える 手を 通して いない こと。
  const p1 = hy.patchOf({ performed_on: "2026-10-11", morning_words: "  あ  " });
  t(p1.morning_words === "  あ  ", "★打った 字を そのまま 送る（★空白すら 落とさない）");
  t(hy.patchOf({ performed_on: "2026-10-11", morning_words: "" }).morning_words === null,
    "★空の ときは 置かない（★書いた と 数えない）");
  t(hy.patchOf({ performed_on: "" }) === null, "★日が 無ければ 送らない");
  // ★★見本の「場所」を 出して いない（★台帳に 列が ない）。
  t(!hy.FIELDS.some((f) => f.key === "place" || f.label === "場所"), "★場所の 欄を 置いて いない");
  t(!/COLS[\s\S]{0,80}place/.test(readRaw("lib", "honbanYotei.js")), "★読む 列にも 場所が ない");

  console.log("=== 四 ★本番の ふりかえり ===");
  const hf = await 読("honbanFurikaeri.js");
  t(hf.NOTES.includes("よい わるいは 言いません。並べるだけです。"), "★約束①");
  t(hf.NOTES.includes("ご自分で 登録された 本番だけを 使います。学校の 行事からは 引きません。"), "★約束④");
  // ★★③ 当日を 入れない。
  const 日 = hf.daysBefore("2026-10-11").map((x) => x.date);
  t(!日.includes("2026-10-11"), "★当日を 並べて いない");
  t(日.length === 7 && 日[0] === "2026-10-04" && 日[6] === "2026-10-10", "★7日前〜1日前");
  // ★★④ 学校の 行事から 引かない。
  t(hf.isOwn({ org_event_id: null }) === true, "★自分で 登録した 本番は 使う");
  t(hf.isOwn({ org_event_id: "x" }) === false, "★学校の 行事からは 引かない");
  // ★★書いて いない 日を 0 に しない。
  t(hf.sleepWord(null) === "書いていません" && hf.sleepWord(undefined) === "書いていません",
    "★書いて いない 日を 0 に しない");
  t(hf.sleepWord(7.34) === "眠り 7時間20分", "★時間と 分に する");
  // ★★② 2回目から。
  t(hf.mayCompare([{ org_event_id: null }]) === false, "★1回目は 重ねられない");
  t(hf.mayCompare([{ org_event_id: null }, { org_event_id: null }]) === true, "★2回目から 重ねられる");
  // ★★点も 印も 付けて いない。
  const hfJsx = stripComments(readRaw("components", "HonbanFurikaeri.jsx"));
  t(!/rust|sage|gold|良い|わるい|点/.test(hfJsx), "★色でも 字でも 良し悪しを 出して いない");

  console.log("=== 五 ★見た目を 選ぶ ===");
  const pl = await 読("portfolioLook.js", { "@/lib/plans": "plans.js" });
  t(pl.LOOKS.length === 4 && pl.ORDERS.length === 3 && pl.LANGS.length === 2, "★4・3・2");
  // ★★値段を 書き写して いない。
  const plans = await 読("plans.js");
  t(pl.lockLines()[0].includes(Number(plans.YEARLY_PRICE_155.tsutaeru).toLocaleString("ja-JP")),
    "★値段は `lib/plans.js` から");
  t(!/6,?000/.test(stripComments(readRaw("lib", "portfolioLook.js"))), "★値段を 書き写して いない");
  // ★★払って いない 方 …… ひとつめ だけ。
  t(pl.mayUseLook(0, false) === true && pl.mayUseLook(1, false) === false, "★ひとつめ だけ");
  t(pl.mayUseLook(3, true) === true, "★払えば ぜんぶ");
  t(pl.mayUseLang("en", false) === false && pl.mayUseLang("ja", false) === true, "★ことばも 同じ");
  // ★★門は 1か所 ── ★入れる ところでも 止まる こと。
  t(pl.patchOf({}, { look: "あかるい" }, false).theme.look === undefined, "★払って いない 選びは 入らない");
  t(pl.patchOf({}, { look: "あかるい" }, true).theme.look === "あかるい", "★払って いれば 入る");
  // ★★`theme` の ほかの 鍵を 消さない。
  t(pl.patchOf({ other: 1 }, { order: "曲目の 順" }, false).theme.other === 1, "★ほかの 鍵を 消さない");
  // ★★隠して いない（★出して、★押せなく する）。
  const plJsx = stripComments(readRaw("components", "PortfolioLook.jsx"));
  t(/LOCKED_WORD/.test(plJsx), "★払って いない ものも 出して いる");
  t(/LOOKS\.map/.test(plJsx), "★4つ とも 並べて いる");

  console.log(`\n${pass} 通り ／ ${fail} 落ち`);
  if (fail) process.exit(1);
}
main();
