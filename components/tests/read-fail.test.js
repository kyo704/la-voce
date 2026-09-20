#!/usr/bin/env node
// ============================================================================
// ★「読めなかった」を、★空の 一覧に 変えて いない ことの 見張り
//
//   ★★★2026-09-20 の 一件 ── ★日程の 表が 丸1日 空の ままでした。
//     ★★台帳は 断って いました。★画面は「ありません」と 言い切って いました。
//   ★★★検査4 が 同じ 形を 13か所 数えました（`setX(res.error ? [] : res.data)`）。
//
//   ★★確かめる こと
//     ①`res.error ? [] :` の 形が 1つも 無い
//     ②字は 1か所（`lib/readFail.js`）── ★画面ごとに 書いて いない
//     ③読めなかった ことが、★画面の 出せる ところ に 入って いる
//     ④無い（空）と 読めなかった を、★返りで 分けて いる
//
//   ★★較正 ── ★わざと 元の 形に 戻したら 落ちる こと。
// ============================================================================

const assert = require("assert");
const { readCode, loadLib } = require("./_source");

let 数 = 0;
function 見る(名, f) { f(); 数 += 1; console.log("  ○ " + 名); }

(async () => {
  const m = await loadLib("lib", "readFail.js");
  const vt = readCode("components", "VocalTracker.jsx");

  見る("①`error ? [] :` の 形が 1つも ない", () => {
    const 当 = [...vt.matchAll(/(\w+)\.error\s*\?\s*\[\]\s*:/g)].map((x) => x[0]);
    assert.deepStrictEqual(当, [], "★残って います: " + 当.join(", "));
    // ★★較正 ── ★見つけられる 形か。
    const ため = 'setX(s.error ? [] : (s.data || []));';
    assert.ok(/(\w+)\.error\s*\?\s*\[\]\s*:/.test(ため), "★較正が 効いて いません");
  });

  見る("②字は 1か所", () => {
    assert.strictEqual(typeof m.readFailedLine, "function");
    assert.ok(m.readFailedLine("空きコマ", { code: "42501" })
      .includes("読めませんでした"), "★字が ちがいます");
    assert.ok(m.readFailedLine("空きコマ", { code: "42501" }).includes("42501"),
      "★符号を 添えて いません");
    assert.ok(m.readFailedLine("空きコマ", null).includes("空きコマ"),
      "★何を 読もうと したかを 書いて いません");
    // ★★画面で 同じ 字を 書いて いない こと。
    const 数 = (vt.match(/読めませんでした。/g) || []).length;
    const 出 = (vt.match(/console\.(error|warn)/g) || []).length;
    assert.ok(数 <= 出, "★画面に 字を 書き写して います: " + 数 + "／" + 出);
  });

  見る("③読めなかった ことが、★出せる ところ に 入る", () => {
    ["setKumuError", "setEvalError", "setMasterError"].forEach((名) => {
      const i = vt.indexOf(名 + "(");
      assert.ok(i > 0, "★入れ物が ありません: " + 名);
    });
    // ★★`rowsOf` の 返りを 使って いる こと。
    const n = (vt.match(/rowsOf\(/g) || []).length;
    assert.ok(n >= 10, "★使い足りません: " + n);
    assert.ok(/\.failed \? [^\n]*\.line/.test(vt), "★字を 渡して いません");
  });

  見る("④無い と 読めなかった を 分けて 返す", () => {
    const よい = m.rowsOf({ data: [] }, "何か");
    assert.deepStrictEqual(よい, { rows: [], failed: false, line: "" });
    const だめ = m.rowsOf({ error: { code: "PGRST301" } }, "何か");
    assert.strictEqual(だめ.failed, true);
    assert.deepStrictEqual(だめ.rows, []);
    assert.ok(だめ.line.includes("PGRST301"));
    // ★★返りが 無い ときも、★読めなかった に 倒します（★安全な 側）。
    assert.strictEqual(m.rowsOf(null, "何か").failed, true);
    // ★★較正 ── ★空の 一覧を「読めなかった」に して いない こと。
    assert.strictEqual(m.rowsOf({ data: [] }, "何か").failed, false);
  });

  console.log("\n★" + 数 + "つ 通りました。");
})().catch((e) => { console.error("★止まりました ──", e.message); process.exit(1); });
