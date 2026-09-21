#!/usr/bin/env node
// STRIP: A（振る舞い）── ★自由文の 欄・読んで いる 列を 見ます。
//   ★★ただし「字が 見本と 同じか」の 節だけ B（字を 残します）。
/**
 * ★応募する の 見張り（★裁定 その94 §4・§4e・§4g・2026-09-21）。
 *
 *   ★★★守りたいのは 4つ ──
 *     ★① 自由に 書ける 欄を 1つも 置かない（★§4「L2_TEMPLATE」）
 *     ★② 送れる ことばは 2つ（★相談つきの 募集だけ 3つ）
 *     ★③ 年齢・学年・門下を 出さない（★§7）── ★見本と ちがう ところ
 *     ★④ お見せする ものは ご本人が 選ぶ。★写真だけ 既定 切（★§4e）
 *
 *   ★★較正 ── ★故意に 1件 該当を 作り、★見つける ことを 確かめます。
 */
const fs = require("fs");
const path = require("path");
const { stripComments, stripCode, stripCounts, readRaw } = require("./_source");
const ROOT = path.join(__dirname, "..", "..");
let pass = 0, fail = 0;
function t(c, label) {
  if (c) { console.log(`  ✓ ${label}`); pass++; } else { console.log(`  ✗ ${label}`); fail++; }
}
/** ★自由に 書ける 欄が あるか。 */
function 自由文の欄(src) {
  return /<textarea|type="text"|contentEditable/i.test(src);
}

async function main() {
  const libRaw = fs.readFileSync(path.join(ROOT, "lib", "applyForm.js"), "utf-8");
  const lib = stripComments(libRaw);
  const jsx = stripComments(readRaw("components", "ApplyForm.jsx"));
  // ★★字も 落とした もの（★処理を 見る とき・裁定 その135）。
  const libCode = stripCode(libRaw);
  const jsxCode = stripCode(readRaw("components", "ApplyForm.jsx"));
  console.log("  " + stripCounts(libRaw).line);
  const sql = stripComments(fs.readFileSync(path.join(ROOT, "supabase", "migration_applications.sql"), "utf-8"));
  const m = await import("data:text/javascript;base64,"
    + Buffer.from(libRaw.replace(/import[^;]*;/, "const tx=(s)=>s;"), "utf-8").toString("base64"));
  const 見本 = fs.readFileSync(path.join(ROOT, "docs/design/pack-final/00-動く見本-iPhoneで開く用.html"), "utf-8");
  const 見本素 = 見本.replace(/<[^>]+>/g, "").replace(/\\n|\+'|'\+/g, "");

  console.log("=== 一 ★自由に 書ける 欄が 無い（★§4） ===");
  t(!自由文の欄(jsx), "★画面に 打つ 欄が 1つも 無い");
  t(!/body|free_text|comment/.test(lib), "★lib にも 自由文の 名が 無い");

  console.log("=== 二 ★送れる ことば（★見本 TPL_B ＋ TPL_B_SODAN） ===");
  t(m.WORDS.length === 2, `★ふだんは 2つ（いま ${m.WORDS.length}）`);
  t(m.wordsFor({ sodan: false }).length === 2, "★相談の 無い 募集では 2つ");
  t(m.wordsFor({ sodan: true }).length === 3, "★相談の ある 募集でだけ 3つ");
  t(m.wordsFor({ sodan: true }).some((w) => w.key === "orei_sodan"), "★3つ目は お礼の 相談");
  // ★★台帳の 縛りと 同じ 名 で ある こと。
  m.wordsFor({ sodan: true }).forEach((w) =>
    t(new RegExp(`'${w.key}'`).test(sql), `★台帳の 縛りに ${w.key} が ある`));
  // ★★字が 見本と 同じ こと。
  m.wordsFor({ sodan: true }).forEach((w) =>
    t(見本素.indexOf(w.label) >= 0, `★見本に「${w.label}」が ある`));

  console.log("=== 三 ★年齢・学年・門下を 出さない（★§7） ===");
  // ★★★2026-09-21、★仕組みに 直しました（★裁定 その135）。
  //   ★★字ごと 落とした もので 見ます。★約束の 文 じたいには 当たりません。
  //   ★★それでも「読んで いるか」を 見る 形は 残します。★二重に 守ります。
  const 読む = (名) => new RegExp(
    `\\.${名}\\b|\\b${名}:|\\["${名}"\\]|select\\([^)]*${名}`).test(jsxCode + libCode);
  ["age", "grade", "enrollment_year", "birthdate", "monka"].forEach((名) =>
    t(!読む(名), `★${名} を 読んで いない`));
  t(/年齢・学年・門下は、どちらにしても 出ません。/.test(lib),
    "★出さない と 約束して いる（★字は 在ってよい）");
  // ★★見本は「○○音楽大学 2年 声楽」を 出して います。★こちらは 出しません。
  t(見本素.indexOf("2年 声楽") >= 0, "★見本には 学年が 出て いる（★ちがいの 証）");
  t(!/音楽大学/.test(jsx), "★こちらは 出して いない");

  console.log("=== 四 ★お見せするもの（★§4e） ===");
  t(m.SHOW_ITEMS.length === 4, "★4つ");
  const 既 = m.emptyForm({ days: [] }).show;
  t(既.career && 既.recordings && 既.repertoire, "★経歴・録画・曲は 既定で 入");
  t(既.photo === false, "★写真だけ 既定で 切（★見た目で 選ばれない ため）");
  m.SHOW_ITEMS.forEach((x) =>
    t(new RegExp(`${x.column}`).test(sql), `★台帳に ${x.column} が ある`));

  console.log("=== 五 ★日どり（★§4b） ===");
  const p全 = { days: ["2026-10-18", "2026-10-19"], need_all_days: true };
  t(m.canSubmit({ days: ["2026-10-18"], word: "ukeraremasu" }, p全) === false,
    "★すべての 日の 募集に、★1日だけでは 出せない");
  t(m.canSubmit({ days: p全.days, word: "ukeraremasu" }, p全) === true, "★すべて 選べば 出せる");
  const p任 = { days: ["2026-10-18", "2026-10-19"], need_all_days: false };
  t(m.canSubmit({ days: ["2026-10-18"], word: "ukeraremasu" }, p任) === true, "★1日でも よい 募集");
  t(m.canSubmit({ days: [], word: "ukeraremasu" }, p任) === false, "★0日では 出せない");
  t(m.whyNot({ days: [], word: "ukeraremasu" }, p任).length > 0, "★わけが 出る");
  // ★★相談の 無い 募集に、★お礼の 相談を 送れない こと。
  t(m.canSubmit({ days: ["2026-10-18"], word: "orei_sodan" }, p任) === false,
    "★相談の 無い 募集に、★お礼の 相談は 送れない（★値切りの 道具に しない）");

  console.log("=== 六 ★まだ できない ことに when が ある ===");
  t(m.NOT_YET.length >= 1 && m.NOT_YET.every((x) => x.when && x.when.length > 0),
    "★どれにも 外す 条件が 添えて ある");

  console.log("=== 七 ★較正（★故意に 1件 作る） ===");
  t(自由文の欄("<textarea />"), "★打つ 欄を 見つける");
  t(自由文の欄('<input type="text" />'), "★字の 入れ口を 見つける");
  t(!自由文の欄('<input type="date" />'), "★日にちでは 当たらない");
  t(!自由文の欄("<Li>{w.label}</Li>"), "★選ぶ 行では 当たらない");

  console.log(`\n${pass} 通り ／ ${fail} 落ち`);
  if (fail > 0) process.exit(1);
}

main();
