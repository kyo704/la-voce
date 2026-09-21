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
    // ★★★2026-09-19 ── ★日程の 帯からも 入れる ように しました。
    //   ★★学長に「門下」の 帯は 出ません（★`monka_write` が 要ります）。
    //   ★★だから 枝の 形が 変わりました ── ★`monka` か `schedule` の どちらか です。
    // ★★★はじめ `opsKumuOpen` の 1つ目を 探して いました。
    //   ★★1つ目は 覚えの 宣言（useState）です。★枝では ありません。
    //   ★★★枝の 字を そのまま 探します。
    // ★★★2026-09-19（2度目）── ★日程の 枝より **後ろ** に ありました。
    //   ★★日程の 枝が 先に 返り、★押しても 画面が 変わりません でした。
    //   ★★★見張りは「門下より 前か」だけ を 見て いました。★片側 だけ でした。
    //     ★★両方 見ます ── ★門下の 枝より 前、★日程の 枝より 前。
    const a = 蔵.indexOf('&& opsKumuOpen');
    const b = 蔵.indexOf('tabKey === "monka") {');
    const c = 蔵.indexOf('if (tabKey === "schedule") {');
    assert.ok(a > 0 && a < b, "★門下の 枝より 後ろに あります");
    assert.ok(c > 0 && a < c, "★日程の 枝より 後ろに あります（★押しても 動きません）");
    assert.ok(/tabKey === "schedule"/.test(蔵.slice(a - 120, a + 40)),
      "★日程の 帯から 入れません");
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

  見る("★学長の 入口が ある（★門下の 帯が 無くても）", () => {
    // ★★★学長に「門下」の 帯は 出ません（★`monka_write` を 持ちません）。
    //   ★★門下の 中に 札を 置いても、★たどり着けません でした。
    //   ★★★日程の 帯（`sched_all` で 開きます）にも 置きました。
    const 日程 = readCode("components", "OpsSchedule.jsx");
    assert.ok(/onGoKumu/.test(日程), "★日程の 帯に 入口が ありません");
    assert.ok(/onGoKumu=\{canOps\(gate, "sched_all"\)/.test(蔵),
      "★日程の 帯の 入口の 門が ちがいます");
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

  見る("★先生の 予定の 見比べが、★ほんとうに 一致する", () => {
    // ★★★2026-09-20 に 見つけました。★画面の 約束が 一度も はたらいて いません。
    //   ★★`openSlots` は `${曜日}-${コマの番号}` で 見比べます。
    //   ★★`get_my_busy_slots` は `period_id`（`my_periods.id`）を 返します。
    //   ★★★`get_teacher_periods` が 番号を 返して いません でした。
    //     ★★片方が いつも `undefined` で、★1度も 一致しません でした。
    const fs = require("fs"), path = require("path");
    const 蔵 = (名) => fs.readFileSync(
      path.join(__dirname, "..", "..", "supabase", 名), "utf8");
    const 新 = 蔵("migration_teacher_periods_id.sql");
    assert.ok(/returns table \(id uuid,/.test(新), "★番号を 返して いません");
    assert.ok(/select p\.id, p\.ord/.test(新), "★番号を 引いて いません");
    // ★★較正 ── ★古い 紙は 番号を 返して いません（★見張りが 効いて いる 証）。
    assert.ok(!/returns table \(id uuid,/.test(蔵("migration_teacher_periods.sql")),
      "★較正が 効いて いません");
    // ★★見比べる 2つが、★同じ ものを 指して いる こと。
    const kumu = readCode("lib", "opsKumu.js");
    assert.ok(/\$\{b\.weekday\}-\$\{b\.period_id\}/.test(kumu), "★予定の 鍵が ちがいます");
    assert.ok(/\$\{di\}-\$\{p\.id\}/.test(kumu), "★コマの 鍵が ちがいます");
  });

  見る("★やり直す ── ★出した あとは できない・空では 出さない（★裁定 その142）", () => {
    assert.strictEqual(K.REDO_LABEL, "やり直す");
    // ★★★3つの 側を すべて 見ます。★1つだけ だと、★いつも 出る／
    //   ★★いつも 出ない が 通って しまいます。
    assert.strictEqual(K.mayRedo({ published: false, placedCount: 3 }), true);
    assert.strictEqual(K.mayRedo({ published: true, placedCount: 3 }), false,
      "★出した あとに やり直せて います");
    assert.strictEqual(K.mayRedo({ published: false, placedCount: 0 }), false,
      "★外す ものが 無いのに 札を 出して います");
    assert.strictEqual(K.mayRedo(), false);
    // ★★たずねてから 外します。★戻せません。
    assert.ok(/REDO_ASK/.test(画面), "★お尋ねが ありません");
    assert.ok(/<Ask/.test(画面), "★お尋ねの 箱が ありません");
    assert.ok(/mayRedo\(/.test(画面), "★門を 画面で 書き直して います");
    // ★★★1つずつ 外すのと 同じ 道 を 通ること。
    //   ★★新しい 消し方を 作ると、★門も 記録も 2つに なります。
    const 所 = 蔵.indexOf("onRedo=");
    assert.ok(所 > 0, "★配線が ありません");
    assert.ok(/handleRemoveLesson/.test(蔵.slice(所, 所 + 420)),
      "★別の 消し方を 作って います");
    // ★★「出す」は まだ ありません。★引き金を 書き残して ある こと。
    assert.ok(K.NOT_YET.some((x) => x.key === "publish" && x.needs),
      "★外す 条件が 書いて ありません");
  });

  見る("★自分の 予定だけ 全部 外す ── ★よその 人に 触らない（★裁定 その142）", () => {
    assert.strictEqual(K.CLEAR_BUSY_LABEL, "自分の予定だけ 全部外す");
    assert.ok(/CLEAR_BUSY_ASK/.test(画面), "★お尋ねが ありません");
    // ★★★「やり直す」と 混ぜない こと。★別の ものを 外します。
    assert.notStrictEqual(K.CLEAR_BUSY_LABEL, K.REDO_LABEL);
    assert.notStrictEqual(K.CLEAR_BUSY_ASK, K.REDO_ASK);
    // ★★★表を 直に 触らない こと。★道を 通ります。
    const 所 = 蔵.indexOf("handleClearMyBusy");
    assert.ok(所 > 0, "★道が ありません");
    const 本文 = 蔵.slice(所, 所 + 500);
    assert.ok(/clear_my_busy_slots/.test(本文), "★道の 名が ありません");
    assert.ok(!/from\("my_timetable"\)/.test(本文), "★表を 直に 触って います");
    // ★★『my_timetable を 読むのは MyTimetable.jsx だけ』── ★その ままで ある こと。
    assert.ok(!/from\("my_timetable"\)/.test(蔵),
      "★運営の 画面から 表に 触って います");
    // ★★★道が `auth.uid()` に 縛って ある こと。★人を 引数で 指せない こと。
    const 紙 = readCode("supabase", "migration_clear_my_busy_slots.sql");
    assert.ok(/create function public\.clear_my_busy_slots\(\)/.test(紙),
      "★引数を 取って います（★人を 指せて しまいます）");
    assert.ok(/user_id = auth\.uid\(\)/.test(紙), "★ご自分に 縛って いません");
    assert.ok(/security definer/i.test(紙) && /set search_path/i.test(紙),
      "★道の 足もとが 決まって いません");
    // ★★みなに 渡して いない こと（★既定では PUBLIC に 渡ります）。
    assert.ok(/revoke all on function public\.clear_my_busy_slots\(\) from public/i.test(紙),
      "★みなに 渡した ままです");
    assert.ok(/grant execute on function public\.clear_my_busy_slots\(\) to authenticated/i.test(紙),
      "★渡す 先が ありません");
  });

  console.log("\n★" + 数 + "つ 通りました。");
})().catch((e) => { console.error("★止まりました ──", e.message); process.exit(1); });
