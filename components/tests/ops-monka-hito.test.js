#!/usr/bin/env node
// ============================================================================
// ★門下の ひと 1人（★見本 `P_monkaHito`）の 見張り
//
//   ★★★確かめる こと
//     ①率（％）を 出さない（★裁定 その90 §4）
//     ②出席が 無い ときは「—」。★「0回」と 書かない
//     ③空きが 読めない ときは 表を 出さない（★空の 表を 出さない）
//     ④見られない もの 6つを、★隠さずに 書く
//     ⑤「本番が 近い」を 出さない ／ 来られない 理由を 聞かない
//     ⑥数え方は `lib/attendanceCount.js` に 任せる（★2か所で 数えない）
//     ⑦鍵の 作り方は `lib/opsKumu.js` に 任せる
//
//   ★★較正 ── ★当たり（空きが 在る）と 外れ（読めて いない）で 試します。
// ============================================================================

const assert = require("assert");
const { readCode, loadLib } = require("./_source");

let 数 = 0;
function 見る(名, f) { f(); 数 += 1; console.log("  ○ " + 名); }

(async () => {
  const m = await loadLib("lib", "opsMonkaHito.js");
  const ui = readCode("components", "OpsMonkaHito.jsx");
  const lib = readCode("lib", "opsMonkaHito.js");

  見る("較正 ── ★読み込めて いる", () => {
    assert.strictEqual(typeof m.freeGrid, "function");
    assert.strictEqual(typeof m.attendanceBlock, "function");
    assert.ok(ui.length > 500, "★画面が 読めて いません");
  });

  見る("①率（％）を 出さない", () => {
    assert.ok(!/%/.test(ui.replace(/width: "100%"|height: "100%"/g, "")),
      "★％が 出て います");
    assert.ok(/RATE_NOTE/.test(ui), "★率を 出さない 1行が ありません");
  });

  見る("②出席が 無い ときは「—」", () => {
    const r = m.attendanceBlock([], "T", "S", null, null);
    assert.strictEqual(r.came, null, "★0回と 数えて います");
    assert.strictEqual(m.NO_COUNT, "—");
    // ★★当たり ── ★1回 出て いれば 数が 出ます。
    const あり = m.attendanceBlock(
      [{ teacher_id: "T", student_id: "S", attendance: "came" }], "T", "S", null, null);
    assert.strictEqual(あり.came, 1, "★数えられて いません");
  });

  見る("③空きが 読めない ときは 表を 出さない", () => {
    assert.strictEqual(m.freeGrid(undefined, "S", ["日"], [{ ord: 1 }]), null);
    assert.strictEqual(m.freeGrid([], "S", ["日"], [{ ord: 1 }]), null);
    // ★★当たり ── ★在れば 表に なります。
    const 表 = m.freeGrid(
      [{ user_id: "S", slot_key: "0-1", is_free: true }], "S", ["日", "月"], [{ ord: 1 }]);
    assert.ok(Array.isArray(表) && 表.length === 1, "★表に なって いません");
    assert.deepStrictEqual(表[0].cells, [true, false], "★鍵が 合って いません");
    assert.strictEqual(m.freeCount(表), 1);
    assert.strictEqual(m.freeCount(null), null, "★読めない ときに 0 を 返して います");
  });

  見る("④見られない もの 6つ", () => {
    assert.strictEqual(m.CANNOT_SEE.length, 6);
    ["声の 記録", "ノート", "本番の 予定", "来られない 理由"]
      .forEach((v) => assert.ok(m.CANNOT_SEE.includes(v), "★" + v + " が ありません"));
    assert.ok(/CANNOT_SEE/.test(ui), "★画面が 出して いません");
  });

  見る("⑤但し書き 2つ", () => {
    assert.strictEqual(m.NOTES.length, 2);
    assert.ok(m.NOTES[0].includes("本番が 近い"));
    assert.ok(m.NOTES[1].includes("来られない 理由"));
    assert.ok(/NOTES/.test(ui), "★画面が 出して いません");
  });

  見る("⑥数え方は あちらに 任せる", () => {
    assert.ok(/from "@\/lib\/attendanceCount"/.test(lib), "★取り寄せて いません");
    assert.ok(!/attendance === "came"/.test(lib), "★ここで 数えて います");
    assert.ok(!/cameCount|heldCount/.test(ui), "★画面で 数えて います");
  });

  見る("⑦鍵の 作り方は あちらに 任せる", () => {
    assert.ok(/from "@\/lib\/opsKumu"/.test(lib), "★取り寄せて いません");
    assert.ok(!/`\$\{di\}-\$\{/.test(lib), "★ここで 鍵を 組んで います");
  });

  見る("⑧押せない 札を 置かない", () => {
    // ★★枠は まだ しまえません。★押すと「まだ できません」と 出ます。
    assert.ok(/SLOT_NOT_YET/.test(ui), "★断りが ありません");
    assert.ok(/まだ できません/.test(m.SLOT_NOT_YET), "★字が ちがいます");
  });

  const vt = readCode("components", "VocalTracker.jsx");

  見る("⑨一覧から 開ける（★呼び手が いる）", () => {
    assert.ok(/<OpsMonkaHito/.test(vt), "★置いて いません");
    assert.ok(/onOpenOne=\{\(id\) =>/.test(vt), "★お名前から 開けません");
    // ★★★N-1 ── ★作った 読み道は、★どこかから 呼ばれて いる こと。
    const 呼び = (vt.match(/fetchMonkaHito/g) || []).length;
    assert.ok(呼び >= 2, "★読み道が 呼ばれて いません: " + 呼び);
  });

  見る("⑩読めない ときに 空の 表を 作らない", () => {
    // ★★`null` を 入れる ── ★空の 並び（`[]`）を 入れない。
    assert.ok(/setMonkaHitoSlots\(s\.error \? null : /.test(vt),
      "★読めない ときに 空を 入れて います");
  });

  console.log("\n★" + 数 + "つ 通りました。");
})();
