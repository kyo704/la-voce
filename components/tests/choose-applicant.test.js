#!/usr/bin/env node
/**
 * ★応募を 選ぶ の 見張り（★裁定 その94 §4e・その95・2026-09-21）。
 *
 *   ★★★守りたいのは 3つ ──
 *     ★① 並べ替えない（★実績の 順に しない・裁定 その95）
 *     ★② 学んだ ところは、★ご本人が 見せると 選んだ ときだけ
 *     ★③ 0回を 出さない（★新しい 方を 不利に しない）
 *
 *   ★★較正 ── ★故意に 1件 該当を 作り、★見つける ことを 確かめます。
 */
const fs = require("fs");
const path = require("path");
const { stripComments, stripSqlCode, stripCounts, readRaw } = require("./_source");
const ROOT = path.join(__dirname, "..", "..");
let pass = 0, fail = 0;
function t(c, label) {
  if (c) { console.log(`  ✓ ${label}`); pass++; } else { console.log(`  ✗ ${label}`); fail++; }
}
/** ★並べ替えて いないか。 */
function 並べ替え(src) {
  return /\.sort\(|order by a\.(?!created_at)/.test(src);
}

async function main() {
  const libRaw = fs.readFileSync(path.join(ROOT, "lib", "chooseApplicant.js"), "utf-8");
  const lib = stripComments(libRaw);
  const jsx = stripComments(readRaw("components", "ChooseApplicant.jsx"));
  const sqlRaw = fs.readFileSync(path.join(ROOT, "supabase", "migration_get_applications_v2.sql"), "utf-8");
  const sql = stripComments(sqlRaw);
  // ★★字も 落とした もの（★処理を 見る とき・裁定 その135）。
  const sqlCode = stripSqlCode(sqlRaw);
  console.log("  " + stripCounts(sqlRaw, true).line);
  const m = await import("data:text/javascript;base64,"
    + Buffer.from(libRaw.replace(/import[^;]*;/, "const tx=(s)=>s;"), "utf-8").toString("base64"));
  const 見本 = fs.readFileSync(path.join(ROOT, "docs/design/pack-final/00-動く見本-iPhoneで開く用.html"), "utf-8");
  const 見本素 = 見本.replace(/<[^>]+>/g, "").replace(/\\n|\+'|'\+/g, "");

  console.log("=== 一 ★並べ替えない（★裁定 その95） ===");
  t(!並べ替え(lib), "★lib が 並べ替えて いない");
  t(!並べ替え(jsx), "★画面も 並べ替えて いない");
  t(/order by a\.created_at/.test(sql), "★台帳は 応募の 順で 返す");
  // ★★★2026-09-21、★仕組みに 直しました（★裁定 その135）。
  //   ★★その場しのぎの 切り出しを やめ、★字ごと 落とした もので 見ます。
  t(!/done|count\(\*\)|実績/.test(sqlCode), "★台帳が 実績の 数を 返して いない");
  t(/実績の 順には しません。/.test(lib), "★そう 断って いる");
  t(m.inGivenOrder([{ id: 2 }, { id: 1 }]).map((x) => x.id).join() === "2,1",
    "★もらった 順の まま 返す");

  console.log("=== 二 ★学んだ ところ（★§4e） ===");
  t(/case when a\.show_career then/.test(sql), "★見せると 選んだ ときだけ 返す");
  t(/kind = 'school'/.test(sql), "★学んだ ところ の 行 だけ");
  t(/else null end/.test(sql), "★選ばなかった 方は 空");
  // ★★年齢・学年は 読んで いない こと。
  const 読む = (名) => new RegExp(`\\\\.${名}\\\\b|\\\\b${名}:|select[^;]*\\\\b${名}\\\\b`).test(jsx + lib + sql);
  ["age", "grade", "enrollment_year", "birthdate"].forEach((名) =>
    t(!読む(名), `★${名} を 読んで いない`));

  console.log("=== 三 ★0回を 出さない（★§4e done_count） ===");
  t(見本素.indexOf("この学校で") >= 0, "★見本には 在る（★ちがいの 証）");
  t(!/この学校で \{?n\}?回|done/.test(jsx), "★画面に 出して いない");
  t(m.NOT_YET.some((x) => x.key === "done" && x.when), "★外す 条件つきで 控えて ある");

  console.log("=== 四 ★たずねられて いる ことが 分かる（★§4c） ===");
  t(m.isAsking({ template_key: "kyokumoku_kikitai" }) === true, "★たずねて いる");
  t(m.isAsking({ template_key: "ukeraremasu" }) === false, "★たずねて いない");
  t(/isAsking\(r\) \? C\.curtain/.test(jsx), "★色で 分けて いる");
  t(!/filter\(isAsking|sort.*isAsking/.test(jsx), "★上に 寄せて いない");

  console.log("=== 五 ★終わりに する（★消さない） ===");
  t(/status: "closed"/.test(stripComments(readRaw("components", "VocalTracker.jsx"))),
    "★閉じる だけ（★delete を 呼んで いない）");
  t(!/\.delete\(\)/.test(stripComments(readRaw("components", "VocalTracker.jsx")).slice(
    stripComments(readRaw("components", "VocalTracker.jsx")).indexOf("handleClosePosting"),
    stripComments(readRaw("components", "VocalTracker.jsx")).indexOf("handleClosePosting") + 900)),
    "★消す 呼びが 無い");
  t(/控えには 残ります/.test(lib), "★控えに 残る と 伝えて いる");
  t(/CLOSE_ASK/.test(jsx) && /Ask/.test(jsx), "★1度 お尋ねして いる");

  console.log("=== 六 ★字が 見本と 同じ ===");
  [m.CLOSE_POSTING, m.GO_DETAIL, ...Object.values(m.WORDS)].forEach((s) =>
    t(見本素.indexOf(s) >= 0, `★見本に「${s.slice(0, 18)}」が ある`));
  t(m.headOf([]) === m.HEAD_NONE, "★0件では 数を 出さない");
  t(m.headOf([1, 2]).indexOf("2件") >= 0, "★数を 入れて 出す");

  console.log("=== 七 ★較正（★故意に 1件 作る） ===");
  t(並べ替え("rows.sort((a,b) => b.done - a.done)"), "★並べ替えを 見つける");
  t(並べ替え("order by a.done desc"), "★台帳の 並べ替えも 見つける");
  t(!並べ替え("order by a.created_at"), "★応募の 順では 当たらない");
  t(!並べ替え("rows.map((r) => r.id)"), "★map では 当たらない");

  console.log(`\n${pass} 通り ／ ${fail} 落ち`);
  if (fail > 0) process.exit(1);
}

main();
