#!/usr/bin/env node

// ============================================================================
// ★見張り ── ★日程を 組む（★見本 `P_kumu`・裁定 その98 ①）
//
//   ★★守る こと
//     ★① 見えるのは 2値 だけ（★中身を 触らない）
//     ★② 入口が ある（★門下 → 日程を 組む → 戻る）
//     ★③ 書いて いない 方を「来られない」に しない
//     ★④ 率を 出さない・並べ替えない
//     ★⑤ 0行を 成功に しない
//
//   ★★★較正 ── ★わざと 当たる ものを 作り、★見つかる ことを 確かめます。
// ============================================================================

const assert = require("assert");
const { loadLib, readCode } = require("./_source");

let 数 = 0;
function 見る(名, f) { f(); 数 += 1; console.log("  ○ " + 名); }

(async () => {
  const K = await loadLib("lib", "opsKumu.js");
  const 画面 = readCode("components", "OpsKumu.jsx");
  const 蔵 = readCode("components", "VocalTracker.jsx");
  const 門下 = readCode("components", "OpsMonka.jsx");

  const 空き = [
    { user_id: "a", slot_key: "1-1", is_free: true },
    { user_id: "b", slot_key: "1-1", is_free: false },
    { user_id: "c", slot_key: "2-1", is_free: true }
  ];

  見る("道具の 較正", () => {
    assert.strictEqual(K.freeAt(空き, 1, 1).length, 1, "★道具が 壊れて います");
    assert.strictEqual(K.freeAt(空き, 9, 9).length, 0, "★道具が 壊れて います");
  });

  見る("① 見えるのは 2値 だけ", () => {
    const もと = readCode("lib", "opsKumu.js");
    for (const 語 of ["title", "room", "memo", "unavailable", "授業の 名", "教室"]) {
      // ★★註では 触れます。★決めの 中で 使って いない こと を 見ます。
      assert.ok(!new RegExp("\\\\." + 語 + "\\\\b").test(もと), "★中身を 見て います: " + 語);
    }
    assert.ok(!/\.title|\.room|\.memo/.test(画面), "★画面が 中身を 見て います");
  });

  見る("② 入口と 戻り道が ある", () => {
    assert.ok(/GO_KUMU_LABEL/.test(門下), "★門下に 札が ありません");
    assert.ok(/onGoKumu/.test(門下), "★門下が 呼び先を 持って いません");
    assert.ok(/onGoKumu=\{/.test(蔵), "★蔵が 渡して いません");
    assert.ok(/opsKumuOpen/.test(蔵), "★開いて いるかを 持って いません");
    assert.ok(/onClose/.test(画面), "★戻り道が ありません");
    // ★★開いて いる ときの 枝が、★門下の 一覧より **先** に ある こと。
    const a = 蔵.indexOf('tabKey === "monka" && opsKumuOpen');
    const b = 蔵.indexOf('tabKey === "monka") {');
    assert.ok(a > 0 && a < b, "★順が 逆です（★開いても 一覧が 出ます）");
  });

  見る("③ 書いて いない 方を「来られない」に しない", () => {
    // ★★答えに 出て こない 方は、★`freeAt` にも 出ません。
    assert.ok(!K.freeAt(空き, 1, 1).includes("z"), "★居ない 方が 出ました");
    // ★★けれど「書いた 方」には 数えません。
    assert.deepStrictEqual(K.whoWrote(空き).sort(), ["a", "b", "c"]);
    assert.ok(/NOT_WRITTEN_LINE/.test(画面), "★断りを 出して いません");
    assert.ok(/お願いは しません/.test(K.NOT_WRITTEN_LINE), "★催促 しない と 書いて いません");
  });

  見る("④ 率を 出さない・並べ替えない", () => {
    const もと = readCode("lib", "opsKumu.js");
    assert.ok(!/％|パーセント|達成/.test(もと), "★率の 字が あります");
    assert.ok(!/\.sort\(/.test(もと), "★並べ替えて います");
    assert.ok(!/\.sort\(/.test(画面), "★画面が 並べ替えて います");
  });

  見る("⑤ 0行を 成功に しない", () => {
    const i = 蔵.indexOf("async function handlePlaceLesson");
    const 手 = 蔵.slice(i, i + 1600);
    assert.ok(/data\.length === 0/.test(手), "★0行を 成功に して います");
    assert.ok(/created_by: userId/.test(手), "★誰が 作ったかを 書いて いません");
    const j = 蔵.indexOf("async function handleRemoveLesson");
    assert.ok(/data\.length === 0/.test(蔵.slice(j, j + 1200)), "★外す ほうも");
  });

  見る("★週の 数え方（★日曜 はじまり・7日）", () => {
    const w = K.weekDates("2026-09-19", 0);
    assert.strictEqual(w.length, 7, "★7日 で ありません");
    assert.strictEqual(w[0], "2026-09-13", "★日曜 はじまり で ありません");
    assert.strictEqual(K.weekDates("2026-09-19", 1)[0], "2026-09-20", "★次の週が ちがいます");
    assert.deepStrictEqual(K.weekDates("こわれた字", 0), [], "★おかしな 字で 落ちます");
    assert.strictEqual(K.weekWord(0), "今週");
    assert.strictEqual(K.weekWord(-2), "2週 まえ");
  });

  見る("★コマの 字は lib が 作る", () => {
    assert.strictEqual(K.periodWord({ name: "1限", start_min: 540, end_min: 630 }),
      "1限　9:00〜10:30");
    assert.strictEqual(K.periodWord(null), "");
    assert.ok(/periodWord/.test(画面), "★画面が 自分で 作って います");
  });

  見る("★まだ できない ものが、★名ざしで 書いて ある", () => {
    const k = K.NOT_YET.map((x) => x.key);
    for (const x of ["auto", "publish", "mine", "temp"]) {
      assert.ok(k.includes(x), "★書かれて いません: " + x);
    }
    assert.ok(K.NOT_YET.every((x) => x.needs), "★何が 要るかが ありません");
  });

  見る("★誰の 分を 組むか（★裁定 その99 F1・2026-09-19）", () => {
    // ★★★学長（`sched_all`）は 先生を 選んで から。
    assert.ok(K.needsTeacherPick(["sched_all"]), "★学長に 選ぶ 画面が 出ません");
    assert.ok(!K.needsTeacherPick(["sched_mine"]), "★先生に 選ぶ 画面が 出ます");
    assert.ok(!K.needsTeacherPick([]), "★何も 持たない 方に 出ます");
    // ★★受け持ちの ある 先生（★並べ替えません）。
    const 受 = [
      { teacher_id: "t2", student_id: "a", ended_at: null },
      { teacher_id: "t1", student_id: "b", ended_at: null },
      { teacher_id: "t1", student_id: "c", ended_at: null },
      { teacher_id: "t3", student_id: "d", ended_at: "2026-01-01" }
    ];
    assert.deepStrictEqual(K.teachersWithMonka(受), ["t2", "t1"], "★先生の 並びが ちがいます");
    assert.deepStrictEqual(K.monkaOf(受, "t1"), ["b", "c"], "★門下が ちがいます");
    assert.deepStrictEqual(K.monkaOf(受, "t3"), [], "★終わった 受け持ちが 出ました");
    assert.ok(/先生の 分/.test(K.whoseWord("斎藤")), "★誰の 分かが 出ません");
    assert.ok(/ご自分の 分/.test(K.whoseWord(null)), "★ご自分の ときの 字が ちがいます");
  });

  見る("★学長の 入口が ある（★門下が 無くても）", () => {
    assert.ok(/canOps\(gate, "sched_all"\)\s*\n?\s*\|\|/.test(蔵)
      || /canOps\(gate, "sched_all"\)/.test(
        蔵.slice(蔵.indexOf("onGoKumu"), 蔵.indexOf("onGoKumu") + 700)),
      "★入口が 門下の 有無 だけ です");
    assert.ok(/needsTeacherPick/.test(画面), "★画面が 判じて いません");
    assert.ok(/onPickTeacher/.test(蔵), "★選ぶ 道を 渡して いません");
  });

  見る("★先生の コマは 読み道から（★決まりを 緩めない）", () => {
    const i = 蔵.indexOf("async function fetchKumu");
    const 手 = 蔵.slice(i, i + 1400);
    assert.ok(/rpc\("get_teacher_periods"/.test(手), "★読み道を 通して いません");
    assert.ok(!/from\("my_periods"\)/.test(手), "★表を 直に 読んで います");
    const 紙 = require("fs").readFileSync(
      require("path").join(__dirname, "..", "..", "supabase",
        "migration_teacher_periods.sql"), "utf8");
    assert.ok(/security definer/.test(紙), "★読み道に なって いません");
    assert.ok(/has_can\(p_org_id, 'sched_all'\)/.test(紙), "★門が ちがいます");
    for (const 語 of ["title", "room", "memo"]) {
      assert.ok(!new RegExp("\\b" + 語 + "\\b").test(紙.split("$$")[1] || ""),
        "★中身を 返して います: " + 語);
    }
  });

  console.log("\n★" + 数 + "つ 通りました。");
})().catch((e) => { console.error("★止まりました ──", e.message); process.exit(1); });
