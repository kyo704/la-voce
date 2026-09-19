#!/usr/bin/env node
// ============================================================================
// ★門下を 変える（★裁定 その104 Q1）の 見張り
//
//   ★★★確かめる こと
//     ①事務（`meibo`）だけ。★役職の 名では 見ない
//     ②いまの 先生は 選べない
//     ③選ぶまで 押せない。★押せない わけが 出る
//     ④変える 前の 断り 3行（★何が 残り、★何が 見えなく なるか）
//     ⑤書くのは 台帳の 読み道 1本。★`assignments` を 直に 書かない
//     ⑥0行 返ったら 成功に しない
//     ⑦入口が ある（★名簿 → その人）
//
//   ★★較正 ── ★当たり（`meibo` あり）と 外れ（無し）で 試します。
// ============================================================================

const assert = require("assert");
const { readCode, loadLib } = require("./_source");

let 数 = 0;
function 見る(名, f) { f(); 数 += 1; console.log("  ○ " + 名); }

(async () => {
  const m = await loadLib("lib", "opsMonkaChange.js");
  const ui = readCode("components", "OpsMonkaChange.jsx");
  const vt = readCode("components", "VocalTracker.jsx");
  const roster = readCode("components", "OpsRoster.jsx");

  見る("①事務だけ", () => {
    assert.strictEqual(m.mayChange(["meibo"]), true);
    assert.strictEqual(m.mayChange(["gyoji", "sched_all"]), false);
    assert.strictEqual(m.mayChange(null), false);
    // ★★役職の 名で 見て いない こと。
    const lib = readCode("lib", "opsMonkaChange.js");
    assert.ok(!/owner|admin|"学長"/.test(lib), "★役職の 名で 見て います");
  });

  見る("②いまの 先生は 選べない", () => {
    const 人 = [{ user_id: "A" }, { user_id: "B" }];
    assert.deepStrictEqual(m.pickable(人, "A").map((x) => x.user_id), ["B"]);
    assert.strictEqual(m.pickable(人, null).length, 2);
    assert.strictEqual(m.pickable(null, "A").length, 0);
  });

  見る("③選ぶまで 押せない", () => {
    assert.strictEqual(m.mayDo({ nowTeacherId: "A", newTeacherId: null }), false);
    assert.strictEqual(m.mayDo({ nowTeacherId: "A", newTeacherId: "A" }), false);
    assert.strictEqual(m.mayDo({ nowTeacherId: "A", newTeacherId: "B" }), true);
    assert.ok(m.whyCannotDo({ nowTeacherId: "A", newTeacherId: null }).length > 0);
    assert.strictEqual(m.whyCannotDo({ nowTeacherId: "A", newTeacherId: "B" }), "");
    assert.ok(/mayDo|whyCannotDo/.test(ui), "★画面が 判じて いません");
    assert.ok(/disabled=\{!できる\}/.test(ui), "★押せない ときに 止めて いません");
  });

  見る("④変える 前の 断り 3行", () => {
    assert.strictEqual(m.BEFORE_NOTES.length, 3);
    const 字 = m.BEFORE_NOTES.join("");
    assert.ok(字.includes("残ります"), "★残る ことを 書いて いません");
    assert.ok(字.includes("見えなく なります"), "★見えなく なる ことを 書いて いません");
    assert.ok(字.includes("お知らせ"), "★お知らせの ことを 書いて いません");
    assert.ok(/BEFORE_NOTES/.test(ui), "★画面が 出して いません");
  });

  見る("⑤書くのは 読み道 1本", () => {
    assert.ok(/rpc\("change_monka_teacher"/.test(vt), "★読み道を 呼んで いません");
    // ★★★この 道の 中 だけ を 見ます（★2026-09-19）。
    //   ★★担当を **はじめて** 決める 道は 別に あります（★13731行）。
    //     ★★あちらは `insert` の 権限が あります。★ひとまとめに 禁じません。
    //   ★★★見るのは「変える」道 です ── ★閉じる と 作るを、★1つの 取引で。
    const i = vt.indexOf("async function handleChangeMonka");
    const j = vt.indexOf("async function", i + 10);
    const なか = vt.slice(i, j > i ? j : i + 1500);
    assert.ok(!/from\("assignments"\)/.test(なか), "★担当の 表を 直に 触って います");
    assert.ok(/rpc\("change_monka_teacher"/.test(なか), "★読み道を 呼んで いません");
  });

  見る("⑥0行は 成功に しない", () => {
    const i = vt.indexOf("change_monka_teacher");
    const なか = vt.slice(i, i + 700);
    assert.ok(/data\.length === 0/.test(なか), "★0行を 見て いません");
    assert.ok(/throw/.test(なか), "★0行で 止めて いません");
  });

  見る("⑦入口が ある（★N-1）", () => {
    assert.ok(/<OpsMonkaChange/.test(vt), "★置いて いません");
    assert.ok(/onGoChangeMonka=\{mayChange\(gate\)/.test(vt),
      "★事務だけに 出して いません");
    assert.ok(/onGoChangeMonka/.test(roster), "★名簿に 札が ありません");
    assert.ok(/CHANGE_MONKA_LABEL/.test(roster), "★字を lib から 取って いません");
  });

  console.log("\n★" + 数 + "つ 通りました。");
})();
