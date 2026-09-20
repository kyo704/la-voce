#!/usr/bin/env node
// ============================================================================
// ★読み込む（★見本 `stImport`・裁定 その97 C群）の 見張り
//
//   ★★★確かめる こと
//     ①健康・声・体調の 行き先が、★一覧に 1つも ない
//     ②メールアドレスは 既定で 入れない
//     ③消さない ── ★ファイルに 無い 方を「退会」に しない
//     ④あやしい 行だけ を 外す（★ほかは 入る）
//     ⑤同じ 行き先に 2つ つなげない・お名前は 要る
//     ⑥CSV の ほどき（★引用符・読点・タブ）
//     ⑦文字コードの 見分け（★UTF-8 と Shift_JIS）
//     ⑧まだ の ものを、★字で お伝えする
//
//   ★★較正 ── ★当たる はずの ものと、★当たらない はずの もので 試します。
// ============================================================================

const assert = require("assert");
const { loadLib } = require("./_source");

let 数 = 0;
function 見る(名, f) { f(); 数 += 1; console.log("  ○ " + 名); }

(async () => {
  const m = await loadLib("lib", "opsImport.js");

  見る("①健康の 行き先が 1つも ない", () => {
    const 先 = m.IMPORT_TARGETS.map((x) => x.label).join("／");
    ["声", "体", "健康", "周期", "薬", "ノート"].forEach((語) =>
      assert.ok(!先.includes(語), "★行き先に あります: " + 語));
    const 列 = m.IMPORT_TARGETS.map((x) => x.col).filter(Boolean).join(",");
    ["throat", "voice", "health", "cycle", "medication"].forEach((語) =>
      assert.ok(!列.includes(語), "★列に あります: " + 語));
    // ★★較正 ── ★在る はずの 行き先は 在る こと。
    assert.ok(先.includes("学年"), "★入れる はずの ものが ありません");
  });

  見る("②メールアドレスは 既定で 入れない", () => {
    const 当 = m.guessMapping(["学籍番号", "氏名", "メールアドレス"], "そのまま");
    assert.strictEqual(当["メールアドレス"], "（取り込みません）", "★既定で 入れて います");
    assert.strictEqual(当["学籍番号"], "番号");
    assert.strictEqual(当["氏名"], "お名前");
    // ★★見分けに 使えない こと。
    const k = m.MATCH_KEYS.find((x) => x.key === "email");
    assert.strictEqual(k.ok, false, "★メールで 見分けて います");
  });

  const 頭 = ["学籍番号", "氏名", "学年"];
  const つなぎ = m.guessMapping(頭, "そのまま");
  const いま = [
    { id: "e1", student_number: "S1", name: "たかぎ", grade_label: "2年" },
    { id: "e2", student_number: "S2", name: "いのうえ", grade_label: "1年" },
    { id: "e3", student_number: "S9", name: "にしむら", grade_label: "4年" }
  ];

  見る("③消さない（★ファイルに 無い 方は そのまま）", () => {
    const p = m.planImport({
      headers: 頭, rows: [["S1", "たかぎ", "3年"]], mapping: つなぎ,
      current: いま, matchKey: "number"
    });
    assert.strictEqual(p.missing.length, 2, "★居ない 方を 数えて いません");
    assert.ok(p.missing.every((x) => !x.status), "★退会に して います");
    // ★★較正 ── ★居る 方は 出て いない こと。
    assert.ok(!p.missing.some((x) => x.name === "たかぎ"), "★居る 方を 出して います");
  });

  見る("④あやしい 行だけ を 外す", () => {
    const p = m.planImport({
      headers: 頭,
      rows: [["S1", "たかぎ", "3年"], ["S2", "", "1年"], ["S2", "いのうえ", "1年"],
        ["S2", "いのうえ", "1年"]],
      mapping: つなぎ, current: いま, matchKey: "number"
    });
    // ★★お名前が 空 ＋ 同じ 番号が 2つ（★2行 とも 外します）。
    assert.strictEqual(p.odd.length, 3, "★外し方が ちがいます: " + JSON.stringify(p.odd));
    // ★★ほかは 入ります。
    assert.strictEqual(p.change.length, 1, "★ほかまで 止めて います");
    assert.strictEqual(p.change[0].diff[0].col, "grade_label");
    assert.strictEqual(p.change[0].diff[0].from, "2年");
    assert.strictEqual(p.change[0].diff[0].to, "3年");
  });

  見る("⑤つなぎの 見張り", () => {
    const 悪 = m.mappingProblems({ a: "お名前", b: "お名前", c: "学年" });
    assert.deepStrictEqual(悪.duplicated, ["お名前"]);
    assert.strictEqual(悪.noName, false);
    const 名なし = m.mappingProblems({ a: "番号", b: "学年" });
    assert.strictEqual(名なし.noName, true, "★お名前が 無くても 通して います");
    // ★★較正 ──「取り込みません」は いくつ あっても よい。
    const 良 = m.mappingProblems({
      a: "お名前", b: "（取り込みません）", c: "（取り込みません）" });
    assert.deepStrictEqual(良.duplicated, []);
  });

  見る("⑥CSV の ほどき", () => {
    const t = m.parseTable('a,b\r\n"た,か","い""の"\r\n');
    assert.deepStrictEqual(t, [["a", "b"], ["た,か", 'い"の']]);
    // ★★タブ区切りも 読みます。
    assert.deepStrictEqual(m.parseTable("a\tb\n1\t2"), [["a", "b"], ["1", "2"]]);
    // ★★空の 行は 落とします。
    assert.strictEqual(m.parseTable("a,b\n\n1,2\n").length, 2);
    // ★★較正 ── ★引用符の 中の 改行。
    assert.deepStrictEqual(m.parseTable('a\n"1\n2"'), [["a"], ["1\n2"]]);
  });

  見る("⑦文字コードの 見分け", () => {
    const utf = [0xE3, 0x81, 0x82];              // ★「あ」UTF-8
    const sjis = [0x82, 0xA0];                   // ★「あ」Shift_JIS
    assert.strictEqual(m.sniffEncoding(utf), "UTF-8");
    assert.strictEqual(m.sniffEncoding(sjis), "Shift_JIS");
    assert.strictEqual(m.sniffEncoding([0xEF, 0xBB, 0xBF, 0x41]), "UTF-8", "★BOM");
    // ★★較正 ── ★半角だけ の ときは UTF-8（★どちらでも 同じ）。
    assert.strictEqual(m.sniffEncoding([0x41, 0x42]), "UTF-8");
  });

  見る("⑧まだ の ものを 字で お伝えする", () => {
    const 鍵 = m.IMPORT_NOT_YET.map((x) => x.key);
    // ★★「新しい方」と「取り消し」は、★裁定 その109 で できました。
    ["xlsx", "change_undo", "remember"].forEach((k) =>
      assert.ok(鍵.includes(k), "★書き残しが ありません: " + k));
    m.IMPORT_NOT_YET.forEach((x) =>
      assert.ok(x.why && x.needs, "★わけと 要る ものが ありません: " + x.key));
    // ★★読めない 形も、★名ざしで 出して いる こと。
    assert.ok(m.READABLE.some((x) => x.name === "PDF" && x.ok === false));
    assert.ok(m.READABLE.some((x) => /xlsx/.test(x.name) && x.ok === false));
  });

  console.log("\n★" + 数 + "つ 通りました。");
})().catch((e) => { console.error("★止まりました ──", e.message); process.exit(1); });
