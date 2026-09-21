#!/usr/bin/env node
// STRIP: A（振る舞い）── ★道具 じたいの 検査 です。
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

  console.log("=== 二 ★字は **残します**（★裁定 その137） ===");
  const 字 = `const s = "${語}の 順に しません";\nconst c = ${語};\n`;
  const r = m.stripJs(字);
  t((r.code.match(new RegExp(語, "g")) || []).length === 2,
    "★字の 中も 中身も、★どちらも 残る");
  // ★★属性の 値も 残る こと（★裁定 その137 FINDING_1）。
  t(/_blank/.test(m.stripJs('const a = <a target="_blank" />;').code),
    "★属性の 値が 残る（★消すと 在っても 見えません）");

  console.log("=== 三 ★SQL の 覚え書きだけ は 落とす（★3度目の 取り違え） ===");
  const 字S = `comment on function f() is '${語}';\nselect ${語} from t;`;
  const rs = m.stripSql(字S);
  t((rs.code.match(new RegExp(語, "g")) || []).length === 1,
    "★`comment on … is` の 中だけ 消える");
  t(/select /.test(rs.code), "★中身は 残る");
  // ★★ふつうの 字は SQL でも 残る こと。
  t(/abc/.test(m.stripSql("insert into t (a) values ('abc');").code),
    "★ふつうの 字は SQL でも 残る");

  console.log("=== 四 ★位置を 保つ（★行番号が ずれない） ===");
  const 長 = "// あ\n/* い\nう */\nconst x = 1;\n";
  t(m.stripJs(長).code.split("\n").length === 長.split("\n").length, "★行の 数が 同じ");
  t(m.stripJs(長).code.length === 長.length, "★字の 数も 同じ（★空白に 置き換えて いる）");
  t(m.stripJs(長).code.indexOf("const x = 1;") === 長.indexOf("const x = 1;"),
    "★中身の 位置が 動いて いない");

  console.log("=== 五 ★黙って 落とさない（★裁定 その124） ===");
  const k = m.stripJs(註);
  t(k.comments === 1 && k.strings === 0, "★註の 数を 返す（★字は 数えません）");
  t(/註 \d+件/.test(m.strippedLine(k)), "★1行に して 出せる");
  const ks = m.stripSql("comment on table t is 'x';");
  t(ks.strings === 1, "★覚え書きは 数える");

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

  // =========================================================================
  // ★六 ★正規表現リテラル（★2026-09-21 に 足しました）
  //
  //   ★★裁定135 で この 紙を 作った とき、★正規表現を 読み飛ばす 形が
  //     ★ありません でした。★文字の 組の 中の 引用符で 位置が ずれます。
  //   ★★`components/VocalTracker.jsx:3805` で 実際に 崩れ、★同じ 紙の
  //     ★註 **700行** が 外れません でした。
  //     ★★「註を 外した」つもりの 数えが、★註を 数えて いました。
  //   ★★★較正は 両の 側 です ── ★消える はず と、★残る はず。
  // =========================================================================
  console.log("\n=== 六 ★正規表現リテラル ===");
  {
    const 崩れ = 'const a = x.replace(/[\u300c\u300d"\u2019]/g, "");\n// ここも おちる\n';
    t(!m.stripJs(崩れ).code.includes("ここも おちる"),
      "★文字の 組の 中の 引用符で 崩れない（★2026-09-21 の 一件）");

    const 割り = m.stripJs("const a = (b) / c; // おちる\nconst d = 2;").code;
    t(!割り.includes("おちる"), "★割り算の あとの 註も 落ちる");
    t(割り.includes("(b) / c"), "★割り算を 消して いない");

    t(!m.stripJs('function f(){ return /ab"c/.test(x); }\n// おちる\n').code
      .includes("おちる"), "★`return` の あとは 正規表現");

    t(m.stripJs('const u = "https://example.com";').code.includes("https://example.com"),
      "★字の 中の // は 残す");

    // ★いちばん 大きい 紙で、★註だけの 行が 1つも 残らない こと。
    const 生 = fs.readFileSync(path.join(ROOT, "components", "VocalTracker.jsx"), "utf-8");
    const 元 = 生.split("\n");
    const 出 = m.stripJs(生).code.split("\n");
    let 残り = 0, 最初 = 0;
    for (let i = 0; i < 元.length; i += 1) {
      if (!元[i].trim().startsWith("//")) continue;
      if ((出[i] || "").trim().startsWith("//")) { 残り += 1; if (!最初) 最初 = i + 1; }
    }
    t(残り === 0, `★いちばん 大きい 紙で 註が 残らない（★いま ${残り}行${最初 ? "・最初 " + 最初 + "行目" : ""}）`);
  }

  console.log(`\n${pass} 通り ／ ${fail} 落ち`);
  if (fail > 0) process.exit(1);
}

main();
