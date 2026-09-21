#!/usr/bin/env node
// STRIP: A（振る舞い）── ★裁定 その136。★探して いるのは 処理 です。
//   ★★ただし「見本と 同じ 字か」を 見る ところ だけ B として 別に 扱います。
/**
 * ★応募者の 詳細 の 見張り（★裁定 その94 §4e・§4f・§7・2026-09-21）。
 *
 *   ★★★守りたいのは 4つ ──
 *     ★① 年齢・学年・門下を 出さない（★§7）
 *     ★② 出す のは ご本人が 選んだ ものだけ（★台帳が 絞る）
 *     ★③ 録画を この 中で 再生しない（★§4f）
 *     ★④ 行き先の 無い 札を 置かない（★「この方に 決める」は まだ）
 *
 *   ★★較正 ── ★A の 検査だけ 2件（★註の 中は 出ない ／ 中身は 出る）。
 */
const fs = require("fs");
const path = require("path");
const { stripComments, stripCode, stripSqlCode, stripCounts, readRaw } = require("./_source");
const ROOT = path.join(__dirname, "..", "..");
let pass = 0, fail = 0;
function t(c, label) {
  if (c) { console.log(`  ✓ ${label}`); pass++; } else { console.log(`  ✗ ${label}`); fail++; }
}

async function main() {
  const libRaw = fs.readFileSync(path.join(ROOT, "lib", "applicantDetail.js"), "utf-8");
  const jsxRaw = readRaw("components", "ApplicantDetail.jsx");
  // ★★A（振る舞い）── ★註も 字も 落とします。
  const lib = stripCode(libRaw);
  const jsx = stripCode(jsxRaw);
  // ★★B（文言）── ★字を 残します。
  const libCopy = stripComments(libRaw);
  const sqlRaw = fs.readFileSync(path.join(ROOT, "supabase", "migration_application_messages.sql"), "utf-8");
  const sql = stripSqlCode(sqlRaw);
  console.log("  " + stripCounts(libRaw).line);
  const m = await import("data:text/javascript;base64,"
    + Buffer.from(libRaw.replace(/import[^;]*;/, "const tx=(s)=>s;"), "utf-8").toString("base64"));
  const 見本 = fs.readFileSync(path.join(ROOT, "docs/design/pack-final/00-動く見本-iPhoneで開く用.html"), "utf-8");
  const 見本素 = 見本.replace(/<[^>]+>/g, "").replace(/\\n|\+'|'\+/g, "");

  console.log("=== 一 ★A ★年齢・学年・門下を 読んで いない（★§7） ===");
  ["age", "grade", "enrollment_year", "birthdate", "monka", "teacher_id"].forEach((名) =>
    t(!new RegExp(`\\b${名}\\b`).test(lib + jsx), `★${名} を 触って いない`));
  // ★★台帳の 返りにも 無い こと。
  const ad = sql.slice(sql.indexOf("get_applicant_detail"), sql.indexOf("get_messages"));
  ["age", "grade", "enrollment_year"].forEach((名) =>
    t(!new RegExp(`\\b${名}\\b`).test(ad), `★台帳の 返りにも ${名} が 無い`));

  console.log("=== 二 ★A ★選んだ ものだけ（★台帳が 絞る） ===");
  t(/show_career/.test(ad) && /show_recordings/.test(ad) && /show_repertoire/.test(ad),
    "★台帳が 3つの 選びで 絞って いる");
  t(!/show_career|show_recordings|show_repertoire/.test(jsx),
    "★画面では 絞って いない（★二重に しない）");
  // ★★1つも 無い 節は、★節ごと 出しません。
  t(/if \(!items \|\| items\.length === 0\) return null;/.test(jsx), "★空の 節を 出さない");

  console.log("=== 三 ★録画は 外へ 出る（★§4f） ===");
  // ★★★裁定 その137 で、★字は いつも 残る ように なりました。
  //   ★★だから `jsx`（A）で そのまま 見られます。
  //   ★★この 1件が、★裁定135 → 136 → 137 の きっかけ でした。
  const jsxCopy = jsx;
  t(/target="_blank"/.test(jsxCopy), "★外の 窓で 開く");
  t(/rel="noreferrer noopener"/.test(jsxCopy), "★元の 頁を 渡さない");
  t(!/<video|<iframe|ReactPlayer|youtube-nocookie/.test(jsx), "★この 中で 再生しない");
  t(/hostOf/.test(jsx), "★行き先を 先に 見せる");
  t(m.hostOf("https://www.youtube.com/watch?v=x") === "youtube.com", "★行き先の 名が 出る");
  t(m.hostOf("") === "", "★空でも 落ちない");

  console.log("=== 四 ★A ★行き先の 無い 札を 置かない ===");
  t(m.NOT_YET.some((x) => x.key === "decide"), "★「この方に 決める」は まだ");
  t(!/この方に 決める.*onClick|onDecide/.test(jsx), "★押せる 札に して いない");
  t(m.NOT_YET.every((x) => x.when && x.when.length > 0), "★どれにも 外す 条件が ある");

  console.log("=== 五 ★A ★経歴の 分け方 ===");
  const r = m.splitCareer([
    { kind: "school", title: "あ" }, { kind: "teacher", title: "い" },
    { kind: "award", title: "う" }, { kind: "school", title: "え" }
  ]);
  t(r.school.length === 2 && r.teacher.length === 1 && r.award.length === 1, "★3つに 分かれる");
  t(m.splitCareer(null).school.length === 0, "★空でも 落ちない");

  console.log("=== 六 ★B ★字が 見本と 同じ（★strip しません） ===");
  [m.REP_NOTE, m.HEADS.word, m.HEADS.days, m.HEADS.rec, m.HEADS.award, m.HEADS.teacher,
   ...Object.values(m.WORDS)].forEach((s) =>
    t(見本素.indexOf(s) >= 0, `★見本に「${s.slice(0, 18)}」が ある`));
  t(/年齢・学年・門下は 出しません。/.test(libCopy), "★そう 断って いる（★字は 残す）");

  console.log("=== 七 ★較正（★A の 検査だけ・2件） ===");
  const 語 = "kanrenNashi";
  t(!new RegExp(語).test(stripCode(`// ${語}\nconst a = 1;`)), "★① 註の 中は 出ない");
  t(new RegExp(語).test(stripCode(`const a = ${語};`)), "★② 中身は 出る");
  // ★★★裁定 その137（2026-09-21）── ★落とすのは 註 だけ です。
  //   ★★字は 残します。★属性の 値（`target="_blank"`）も 消えません。
  t(new RegExp(語).test(stripCode(`const a = "${語}";`)), "★字は 残る（★裁定 その137）");
  t(/_blank/.test(stripCode('const a = <a target="_blank" />;')), "★属性の 値も 残る");

  console.log(`\n${pass} 通り ／ ${fail} 落ち`);
  if (fail > 0) process.exit(1);
}

main();
