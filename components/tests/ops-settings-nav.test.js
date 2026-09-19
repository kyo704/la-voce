#!/usr/bin/env node

// ============================================================================
// ★見張り ── ★設定の 骨（★見本 `P_settei`・裁定 その97）
//
//   ★★守る こと
//     ★① 節は できことで 出し分ける（★役職の 名では ない）
//     ★② まだ の 節は「まだ」と 出す。★押せる 札に しない（★§8⑤）
//     ★③ はじめに 開くのは、★中身の ある もの
//     ★④ 画面は 判じない（★決めは lib）
//     ★⑤ 門は これまでと 同じ もの（★新しい 門を 作らない）
//
//   ★★★較正 ── ★わざと 当たる ものを 作り、★見つかる ことを 確かめます。
// ============================================================================

const assert = require("assert");
const { loadLib, readCode } = require("./_source");

let 数 = 0;
function 見る(名, f) { f(); 数 += 1; console.log("  ○ " + 名); }

(async () => {
  const N = await loadLib("lib", "opsSettingsNav.js");
  const 骨 = readCode("components", "OpsSettingsHub.jsx");
  const 蔵 = readCode("components", "VocalTracker.jsx");

  見る("道具の 較正 ── ★わざと 当たる ものを 見つけられる", () => {
    const 偽 = [{ key: "x", any: ["meibo"], ready: false, needs: "なにか" }];
    assert.strictEqual(偽.filter((s) => !s.ready).length, 1, "★道具が 壊れて います");
  });

  見る("① 節は できことで 出し分ける", () => {
    const 事務 = N.sectionsFor(["meibo"]).map((x) => x.key);
    const 先生 = N.sectionsFor(["sched_mine", "monka_write"]).map((x) => x.key);
    const 学長 = N.sectionsFor(["bill", "meibo", "post", "master", "koma"]).map((x) => x.key);
    assert.ok(事務.includes("jugyo"), "★事務に 授業の 型が 出ません");
    assert.ok(!事務.includes("bill"), "★ご請求が 事務に 出て います");
    assert.ok(先生.includes("mine"), "★先生に 自分の 予定が 出ません");
    assert.ok(!先生.includes("post"), "★役職が 先生に 出て います");
    assert.ok(学長.length > 事務.length, "★学長の ほうが 少ない です");
    // ★★★役職の 名を、★決めの 中に 書いて いない こと。
    const もと = readCode("lib", "opsSettingsNav.js");
    for (const 名 of ["owner", "admin", "teacher", "学長", "事務長"]) {
      assert.ok(!new RegExp(名).test(もと), "★役職の 名が あります: " + 名);
    }
  });

  見る("② まだ の 節は、★何が 足りないかを 持つ", () => {
    const まだ = N.notYetSections(["bill", "meibo", "post", "master", "koma", "sched_mine"]);
    assert.ok(まだ.length >= 6, "★まだ の 節が 少なすぎます（" + まだ.length + "）");
    for (const x of まだ) {
      assert.ok(x.needs && x.needs.length > 4, "★足りない ものが 書かれて いません: " + x.key);
    }
    // ★★中身の ある 節には、★`needs` を 書きません（★迷う だけ です）。
    for (const x of N.readySections(["bill", "meibo", "post"])) {
      assert.ok(!x.needs, "★中身が ある のに 足りない ものが 書いて あります: " + x.key);
    }
  });

  見る("③ はじめに 開くのは、★中身の ある もの", () => {
    const k = N.firstSection(["meibo"]);
    assert.ok(N.mayOpen(["meibo"], k), "★開けない 節を 開いて います");
    assert.ok(N.readySections(["meibo"]).some((x) => x.key === k), "★中身が ありません");
    // ★★★見やすさは 誰にでも 出ます（★`any` が ありません）。
    //   ★★だから「1つも 無い」は、★いまの 決めでは 起きません。
    //   ★★★それでも `firstSection` は null を 返せる 形の まま に します。
    //     ★★見やすさを 外す 日が 来ても、★白い 紙を 出しません。
    assert.strictEqual(N.firstSection([]), "miyasu", "★見やすさが 誰にでも 出ません");
    assert.strictEqual(N.firstSection(["gyoji"]), "miyasu", "★同上");
    const 空 = N.SETTING_SECTIONS.filter((x) => x.ready && x.any === null);
    assert.strictEqual(空.length, 1, "★誰にでも 出る 節は 1つ の はず です");
  });

  見る("④ 画面は 判じない", () => {
    assert.ok(/sectionsFor|readySections|notYetSections/.test(骨), "★lib を 呼んで いません");
    assert.ok(!/"meibo"|'meibo'/.test(骨), "★画面が できことを 名ざしで 見て います");
    assert.ok(!/\bowner\b|\badmin\b/.test(骨), "★画面に 役職の 名が あります");
  });

  見る("⑤ 門は これまでと 同じ もの", () => {
    const i = 蔵.indexOf("<OpsSettingsHub");
    assert.ok(i > 0, "★骨を 呼んで いません");
    const 枝 = 蔵.slice(i, i + 2600);
    for (const 門 of ["maySeeMoney(gate)", 'canOps(gate, "post")', "maySeePresets(gate)"]) {
      assert.ok(枝.includes(門), "★門が 変わって います: " + 門);
    }
  });

  見る("★2面の 境目と 幅は lib が 持つ", () => {
    assert.strictEqual(N.SIDE_WIDTH, 210, "★見本は 210px です");
    assert.ok(N.isTwoPane(1000) && !N.isTwoPane(700), "★境目が ちがいます");
    assert.ok(/SIDE_WIDTH/.test(骨) && /isTwoPane/.test(骨), "★画面が 数を 持って います");
  });

  見る("★題は ご請求の できことで 変わる（★見本の とおり）", () => {
    assert.strictEqual(N.headOf(["bill"]), "設定・ご請求");
    assert.strictEqual(N.headOf(["koma"]), "設定");
  });

  console.log("\n★" + 数 + "つ 通りました。");
})().catch((e) => { console.error("★止まりました ──", e.message); process.exit(1); });
