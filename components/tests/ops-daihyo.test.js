#!/usr/bin/env node
// ============================================================================
// ★代表を 決める（★見本 `P_daihyo`）の 見張り
//
//   ★★★確かめる こと
//     ①2人まで（★画面は 早く 断る。★正は 台帳）
//     ②外す のは いつでも できる
//     ③押せない 札を 置かない ── ★3人目は 押せず、★わけが 出る
//     ④できる こと 8行（★できない ものを 隠さない）
//     ⑤但し書き 3つ（★役職の 外・先生だけ・中身は 見えない）
//     ⑥書く道は 台帳の 読み道（★`assignments` を 直に 書かない）
//     ⑦0行 返ったら 手もとを 書き換えない
//
//   ★★較正 ── ★当たり（0人・1人）と 外れ（2人）で 試します。
// ============================================================================

const assert = require("assert");
const { readCode, loadLib } = require("./_source");

let 数 = 0;
function 見る(名, f) { f(); 数 += 1; console.log("  ○ " + 名); }

(async () => {
  const m = await loadLib("lib", "opsDaihyo.js");
  const ui = readCode("components", "OpsDaihyo.jsx");
  const vt = readCode("components", "VocalTracker.jsx");
  const 行 = (n, 代表) => Array.from({ length: n }, (_, i) => ({
    studentId: "S" + i, assignmentId: "A" + i, name: "な" + i,
    isRepresentative: i < 代表
  }));

  見る("較正 ── ★数えられて いる", () => {
    assert.strictEqual(m.countOf(行(3, 0)), 0);
    assert.strictEqual(m.countOf(行(3, 2)), 2);
    assert.strictEqual(m.countOf(null), 0);
  });

  見る("①2人まで", () => {
    assert.strictEqual(m.MAX, 2);
    assert.strictEqual(m.mayToggle(行(3, 0), "S2"), true, "★0人の ときに 押せません");
    assert.strictEqual(m.mayToggle(行(3, 1), "S2"), true, "★1人の ときに 押せません");
    assert.strictEqual(m.mayToggle(行(3, 2), "S2"), false, "★3人目が 押せます");
  });

  見る("②外す のは いつでも できる", () => {
    assert.strictEqual(m.mayToggle(行(3, 2), "S0"), true, "★外せません");
  });

  見る("③押せない ときは わけが 出る", () => {
    assert.strictEqual(m.whyCannot(行(3, 2), "S2"), m.FULL_LINE);
    assert.strictEqual(m.whyCannot(行(3, 1), "S2"), "");
    assert.ok(/2人までです/.test(m.FULL_LINE));
    assert.ok(/whyCannot/.test(ui), "★画面が 出して いません");
    assert.ok(/mayToggle/.test(ui), "★画面が 判じて いません");
  });

  見る("④できる こと 8行", () => {
    assert.strictEqual(m.CAN_DO.length, 8);
    assert.strictEqual(m.CAN_DO.filter((x) => x.ok).length, 4);
    assert.strictEqual(m.CAN_DO.filter((x) => !x.ok).length, 4);
    const 字 = m.CAN_DO.map((x) => x.label).join("／");
    ["時間割の 中身", "空きコマ", "生徒の 記録"].forEach((v) =>
      assert.ok(字.includes(v), "★" + v + " が ありません"));
    assert.ok(/CAN_DO/.test(ui), "★画面が 出して いません");
  });

  見る("⑤但し書き 3つ", () => {
    assert.strictEqual(m.NOTES.length, 3);
    assert.ok(m.NOTES.join("").includes("役職の 仕組みの 外"));
    assert.ok(m.NOTES.join("").includes("中身は 見えません"));
  });

  見る("⑥書く道は 台帳の 読み道", () => {
    assert.ok(/rpc\("set_monka_representative"/.test(vt), "★読み道を 呼んで いません");
    // ★★★`is_representative` を 直に 書いて いない こと。
    //   ★★`ended_at` の 更新は 別 です ── ★そちらは 権限が あります
    //     （★担当を 終える 道・13708行）。★ひとまとめに 禁じません。
    assert.ok(!/\.update\(\{[^}]*is_representative/.test(vt),
      "★代表の 列を 直に 書いて います");
  });

  見る("⑦0行 返ったら 書き換えない", () => {
    assert.ok(/data\.length === 0\)\s*\{\s*\n?\s*throw/.test(vt)
      || /!Array\.isArray\(data\) \|\| data\.length === 0/.test(vt),
      "★0行を 成功に して います");
    assert.strictEqual(m.applyResult(行(2, 0), []), null, "★空でも 書き換えて います");
    // ★★当たり ── ★返り が あれば 揃います。
    const 後 = m.applyResult(行(2, 0),
      [{ student_id: "S1", is_representative: true }]);
    assert.strictEqual(後[1].isRepresentative, true);
  });

  見る("⑧入口が ある（★N-1）", () => {
    assert.ok(/<OpsDaihyo/.test(vt), "★置いて いません");
    assert.ok(/onGoDaihyo=/.test(vt), "★入口が ありません");
    assert.ok(/onGoDaihyo/.test(readCode("components", "OpsMonka.jsx")),
      "★一覧に 札が ありません");
  });

  console.log("\n★" + 数 + "つ 通りました。");
})();
