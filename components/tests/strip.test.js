#!/usr/bin/env node
/**
 * ★lib/strip.js の 見張り（★裁定 その135・2026-09-21）。
 *
 *   ★★★較正は **2件** です（★裁定 その135 CALIBRATION）。
 *     ★① 註（コメント）の 中に 語を 置く → ★出ない こと
 *     ★② 中身（コード）に 同じ 語を 置く → ★出る こと
 *   ★★①だけ 確かめると、★**ぜんぶ 消す** 実装でも 通って しまいます。
 *     ★★だから ② が 要ります。
 *
 *   ★★位置を 保つ こと（★行番号が ずれない こと）も 見ます。
 */
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..", "..");
let pass = 0, fail = 0;
function t(c, label) {
  if (c) { console.log(`  ✓ ${label}`); pass++; } else { console.log(`  ✗ ${label}`); fail++; }
}

async function main() {
  const src = fs.readFileSync(path.join(ROOT, "lib", "strip.js"), "utf-8");
  const m = await import("data:text/javascript;base64," + Buffer.from(src, "utf-8").toString("base64"));

  console.log("=== 一 ★較正 ①註の 中は 出ない ／ ②中身は 出る ===");
  const 語 = "jisseki";
  const 註 = `// ${語} を 返します\nconst a = 1;\n`;
  const 中 = `const b = ${語};\n`;
  t(!new RegExp(語).test(m.stripJs(註).code), "★① 註の 中の 語は 出ない");
  t(new RegExp(語).test(m.stripJs(中).code), "★② 中身の 語は 出る（★消しすぎて いない）");
  // ★★SQL も 同じ 2件。
  const 註S = `-- ${語}\nselect 1;\n`;
  const 中S = `select ${語} from t;\n`;
  t(!new RegExp(語).test(m.stripSql(註S).code), "★① SQL の 註の 中は 出ない");
  t(new RegExp(語).test(m.stripSql(中S).code), "★② SQL の 中身は 出る");

  console.log("=== 二 ★字（文字列）も 除く（★3度の 取り違えの もと） ===");
  const 字 = `const s = "${語}の 順に しません";\nconst c = ${語};\n`;
  const r = m.stripJs(字);
  t((r.code.match(new RegExp(語, "g")) || []).length === 1,
    "★字の 中の 1件だけ 消え、★中身の 1件は 残る");
  const 字S = `comment on function f() is '${語}';\nselect ${語} from t;`;
  const rs = m.stripSql(字S);
  t((rs.code.match(new RegExp(語, "g")) || []).length === 1,
    "★SQL も 同じ（★comment on ... is の 中だけ 消える）");

  console.log("=== 三 ★字を 残す 使い方（★画面の 字を 確かめる とき） ===");
  t(new RegExp(語).test(m.stripJs(字, { strings: false }).code),
    "★`{ strings:false }` なら 字は 残る");
  t(!new RegExp(語).test(m.stripJs(註, { strings: false }).code),
    "★それでも 註は 落ちる");

  console.log("=== 四 ★位置を 保つ（★行番号が ずれない） ===");
  const 長 = "// あ\n/* い\nう */\nconst x = 1;\n";
  t(m.stripJs(長).code.split("\n").length === 長.split("\n").length, "★行の 数が 同じ");
  t(m.stripJs(長).code.length === 長.length, "★字の 数も 同じ（★空白に 置き換えて いる）");
  t(m.stripJs(長).code.indexOf("const x = 1;") === 長.indexOf("const x = 1;"),
    "★中身の 位置が 動いて いない");

  console.log("=== 五 ★黙って 落とさない（★裁定 その124） ===");
  const k = m.stripJs(字);
  t(k.comments === 0 && k.strings === 1, "★消した 数を 返す");
  t(/註 \d+件・字 \d+件/.test(m.strippedLine(k)), "★1行に して 出せる");

  console.log("=== 六 ★焼けた 形（★2026-09-11）を 繰り返さない ===");
  // ★★行コメントの 中の `/*` で、★本文が 消えない こと。
  const 罠 = "// docs/design/pack/screens/*.html\nconst y = 2;\nconst z = 3;\n";
  t(m.stripJs(罠).code.indexOf("const y = 2;") >= 0, "★行コメントの 中の 開き記号で 焼けない");
  t(m.stripJs(罠).code.indexOf("const z = 3;") >= 0, "★その 先も 残る");
  // ★★字の 中の `//`（URL）で、★そこから 先が 消えない こと。
  const 罠2 = 'const u = "https://example.com";\nconst w = 4;\n';
  t(m.stripJs(罠2).code.indexOf("const w = 4;") >= 0, "★字の 中の // で 焼けない");

  console.log("=== 七 ★2つ ある わけ（★2026-09-21 の 失敗） ===");
  // ★★★`_source.js` の `stripComments` を これに 差し替えて、★38件 落としました。
  //   ★★あちらは **詰めます**。★こちらは **位置を 保ちます**。
  //   ★★近さで 見る 見張り（`/A[\s\S]{0,80}B/`）が、★遠く なって 落ちました。
  //   ★★★どちらも 要る もの です。★消した ほうが 良い、では ありません。
  const src2 = require("fs").readFileSync(
    require("path").join(ROOT, "components", "tests", "_source.js"), "utf-8");
  t(/function stripComments/.test(src2), "★詰める ほうが 残って いる");
  t(/function stripCode/.test(src2), "★位置を 保つ ほうも ある");
  t(/38件が 一斉に 落ちました/.test(src2), "★なぜ 2つ 要るかが 書いて ある");

  console.log(`\n${pass} 通り ／ ${fail} 落ち`);
  if (fail > 0) process.exit(1);
}

main();
