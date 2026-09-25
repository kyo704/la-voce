#!/usr/bin/env node
// STRIP: B（言葉）── ★約束の 文を 見ます。★何も 落としません。
/**
 * ★コマの 中身 ／ 予定の 中身 の 見張り（★2026-09-26・C群 最後の 2枚）。
 *
 *   ★★★この 2枚は、★台帳に 列が 無い あいだ **作りませんでした**。
 *     ★★sql/93（★本番 131本目・2026-09-26）で 入って から 作りました。
 *   ★★★見る もの ──
 *     ①★約束の 文が 1文字も 変わって いない か
 *     ②★台帳の CHECK と 同じ 札か（★覚えず、★SQL から 読み直す）
 *     ③★「無期限に しません」── ★画面でも 止まる か
 *     ④★「日は カレンダーからだけ」── ★打ち込む 欄が 無い か
 *     ⑤★「名前が 見えるのは あなただけ」── ★事務へ 渡す 道が 無い か
 *
 *   ★★較正 ── ★各節の 下に、★わざと 壊した ときに 落ちる 見方を 置いて います。
 */
const fs = require("fs");
const path = require("path");
const { stripComments, readRaw } = require("./_source");
const ROOT = path.join(__dirname, "..", "..");
let pass = 0, fail = 0;
function t(c, label) {
  if (c) { console.log(`  ✓ ${label}`); pass++; } else { console.log(`  ✗ ${label}`); fail++; }
}
const 読 = (名) => import("data:text/javascript;base64,"
  + Buffer.from(readRaw("lib", 名), "utf-8").toString("base64"));

async function main() {
  const sql = fs.readFileSync(
    path.join(ROOT, "supabase", "opus", "20260925_93_lesson_repeat.sql"), "utf-8");
  const km = await 読("komaNoNakami.js");
  const yn = await 読("yoteiNoNakami.js");
  const kmJsx = readRaw("components", "KomaNoNakami.jsx");
  const ynJsx = readRaw("components", "YoteiNoNakami.jsx");

  console.log("=== 一 ★コマの 中身 …… 下の 3行（★約束） ===");
  const 約1 = [
    "長さも 場所も 繰り返しも、あとから いつでも 決められます。",
    "繰り返すなら「いつまで」を 決めてください（無期限に しません）。",
    "場所は 覚えておくだけです。部屋の 予約は しません。"
  ];
  t(km.NOTES.length === 3, `★3行（いま ${km.NOTES.length}）`);
  約1.forEach((l) => t(km.NOTES.includes(l), `★「${l.slice(0, 18)}…」`));
  t(km.LEN_HINT === "上下に スワイプして 合わせます（1分きざみ）", "★長さの 1行");
  t(km.LEN_STEP === 1, "★1分きざみ（★丸めない）");

  console.log("=== 二 ★繰り返しの 4つは 台帳の CHECK と 同じ ===");
  const 行 = sql.split("\n").find((x) => x.includes("repeat_kind in ("));
  t(!!行, "★SQL に CHECK が ある");
  if (行) {
    const 台 = [...行.matchAll(/'([a-z]+)'/g)].map((x) => x[1]).sort();
    const 画 = km.REPEATS.map((x) => x.key).sort();
    t(JSON.stringify(台) === JSON.stringify(画), `★同じ 4つ（${台.join("/")}）`);
  }
  const 行2 = sql.split("\n").find((x) => x.includes("kind in ('school'"));
  if (行2) {
    const 台 = [...行2.matchAll(/'([a-z]+)'/g)].map((x) => x[1]).sort();
    const 画 = yn.KINDS.map((x) => x.key).sort();
    t(JSON.stringify(台) === JSON.stringify(画), `★予定の 2つも 同じ（${台.join("/")}）`);
  } else t(false, "★`my_timetable.kind` の CHECK を 読めません");
  t(km.repeatOf({}) === "once" && yn.kindOf({}) === "school", "★既定は 台帳と 同じ");

  console.log("=== 三 ★無期限に しない（★画面でも 止まる） ===");
  t(km.canSave({ repeat_kind: "once" }) === true, "★この日だけ なら 送れる");
  t(km.canSave({ repeat_kind: "weekly" }) === false, "★毎週で 期限が 空なら 送れない");
  t(km.canSave({ repeat_kind: "weekly", repeat_until: "2027-03-01" }) === true,
    "★期限が あれば 送れる");
  t(km.whyCannotSave({ repeat_kind: "weekly" }) === "「いつまで」を 決めてください。",
    "★押せない わけを 出す");
  // ★★`once` に 戻したら 期限を 空に する（★繰り返さない のに 期限が ある 行を 作らない）。
  t(km.patchOf({ repeat_kind: "once", repeat_until: "2027-03-01" }).repeat_until === null,
    "★この日だけ に 戻すと 期限を 空に する");
  // ★★台帳の 側でも 止まる こと（★2つ とも）。
  t(/lessons_repeat_needs_until/.test(sql), "★台帳の 側にも 縛りが ある");
  t(/repeat_until <= /.test(sql), "★遠すぎる 期限も 台帳が 止める");

  console.log("=== 四 ★日は カレンダーからだけ ===");
  t(km.UNTIL_HINT === "日は カレンダーからだけ 選べます（押し間違いを 防ぐため）", "★その 1行");
  // ★★★打ち込む 口を 置いて いない こと。
  const kmCode = stripComments(kmJsx);
  t(!/type="date"/.test(kmCode), "★`type=\"date\"` を 置いて いない");
  t(!/<input[^>]*repeat_until/.test(kmCode), "★期限に 打ち込む 欄が 無い");
  t(/onPickUntil/.test(kmCode), "★押すと 呼ぶ 側が 暦を 開く");

  console.log("=== 五 ★予定の 中身 …… 下の 2行（★約束） ===");
  const 約2 = [
    "ここには レッスンを 入れられません。空きに 戻すと、入れられるように なります。",
    "この 名前が 見えるのは あなただけです。事務にも 生徒にも 出ません。"
  ];
  t(yn.NOTES.length === 2, `★2行（いま ${yn.NOTES.length}）`);
  約2.forEach((l) => t(yn.NOTES.includes(l), `★「${l.slice(0, 18)}…」`));
  t(yn.KIND_NOTE_SELF === "事務から「動かしてください」と 言われません。理由も 聞かれません。",
    "★自分の 予定の 約束");
  t(yn.kindNoteOf({ kind: "self" }) === yn.KIND_NOTE_SELF, "★自分 なら その 1行");
  t(yn.kindNoteOf({}) === yn.KIND_NOTE_SCHOOL, "★学校 なら もう 1つ");

  console.log("=== 六 ★事務へ 渡す 道が 無い ===");
  const ynCode = stripComments(ynJsx);
  // ★★事務の 画面（Ops*）が `my_timetable.kind` を 読んで いない こと。
  const ops = fs.readdirSync(path.join(ROOT, "components"))
    .filter((f) => /^Ops.*\.jsx$/.test(f));
  ops.forEach((f) => {
    const s = stripComments(readRaw("components", f));
    t(!/my_timetable[\s\S]{0,120}kind|\bkind\b[\s\S]{0,40}my_timetable/.test(s),
      `★${f} が `.concat("`kind` を 読んで いない"));
  });
  // ★★台帳では 止めません（★sql/93 の 註）。★画面の 決まり です。
  t(/事務の 画面には/.test(sql), "★SQL に その わけが 書いて ある");
  // ★★名前の 札は `kind` で 変わる（★自分の ときに「入試」を 出さない）。
  t(yn.namesOf({ kind: "self" }).indexOf("入試") < 0, "★自分の ときに「入試」を 出さない");
  t(yn.namesOf({}).indexOf("入試") >= 0, "★学校の ときは 出す");

  console.log("=== 七 ★字を 画面に 書き写して いない ===");
  約1.concat(約2).forEach((l) => t(!(kmJsx + ynJsx).includes(l),
    `★直書きして いない …… ${l.slice(0, 12)}…`));
  t(/from "@\/lib\/komaNoNakami"/.test(kmJsx) && /from "@\/lib\/yoteiNoNakami"/.test(ynJsx),
    "★字は lib から 受け取って いる");

  console.log(`\n${pass} 通り ／ ${fail} 落ち`);
  if (fail) process.exit(1);
}
main();
