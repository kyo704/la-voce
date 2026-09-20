#!/usr/bin/env node
// ============================================================================
// ★採点（★裁定 その105）の 見張り
//
//   ★★★裁定の VERIFY を、★できる ところから 確かめます。
//     Q4 `score_log` に update / delete が 通らない
//     Q5 点の 順に 並べ替える 仕掛けが どこにも ない
//     Q6 順位・平均との 差・偏差値が どこにも 出て いない
//   ★★Q1〜Q3（見える 範囲）は 決まりの 字で 確かめます。
//
//   ★★較正 ── ★在る ものと 無い ものの 両方で 試します。
// ============================================================================

const assert = require("assert");
const { readRaw, readCode, loadLib } = require("./_source");

let 数 = 0;
function 見る(名, f) { f(); 数 += 1; console.log("  ○ " + 名); }

(async () => {
  const m = await loadLib("lib", "evaluation.js");
  const sql = readRaw("supabase", "migration_evaluation.sql");
  const 本文 = sql.split("\n").filter((l) => !/^\s*--/.test(l)).join("\n");
  const ui = readCode("components", "OpsEvalItems.jsx");
  const vt = readCode("components", "VocalTracker.jsx");

  見る("較正 ── ★読めて いる", () => {
    assert.strictEqual(typeof m.pointOk, "function");
    assert.ok(本文.includes("create table if not exists public.evaluation_items"));
  });

  見る("Q4 ★直した 記録は 消せない・直せない", () => {
    // ★★`score_log` に 読む 決まり しか ありません。
    const i = 本文.indexOf("score_log_select");
    assert.ok(i > 0, "★読む 決まりが ありません");
    assert.ok(!/score_log[\s\S]{0,400}for (update|delete|all)/.test(本文),
      "★直す／消す 決まりが あります");
    assert.ok(/grant select on table public\.score_log to authenticated/.test(本文),
      "★読む 許しが ありません");
    assert.ok(!/grant[^\n]*(update|delete)[^\n]*score_log/.test(本文),
      "★直す／消す 許しが あります");
  });

  見る("Q5 ★点の 順に 並べ替えない", () => {
    // ★★決めごとに「名前順」しか ありません。
    assert.strictEqual(typeof m.defaultOrder, "function");
    const 並 = m.defaultOrder([{ name: "い" }, { name: "あ" }]);
    assert.strictEqual(並[0].name, "あ", "★名前順に なって いません");
    // ★★点で 並べる 仕掛けを 作って いない こと。
    assert.ok(!/sort[\s\S]{0,60}points/.test(readCode("lib", "evaluation.js")),
      "★点で 並べて います");
    assert.ok(!/order\("points"|order\('points'/.test(vt), "★台帳に 点順を 頼んで います");
  });

  見る("Q6 ★順位・偏差値・平均との 差を 出さない", () => {
    // ★★★「出しません」と 書いて いる 行は 除きます（★2026-09-20）。
    //   ★★この 蔵の 持病 です ── ★自分の 断り書きで 落ちます。
    //   ★★★覚え書きは `readCode` が 外して います。★残るのは **画面に 出る 字** です。
    //     ★★その 中に「順位も 出しません。」が あります。★これは 正しい 字 です。
    const 禁 = ["順位", "偏差値", "平均との 差", "平均との差", "1位"];
    const みな = (readCode("lib", "evaluation.js") + ui).split("\n")
      .filter((l) => !/出しません|出さない|並べ替えません/.test(l)).join("\n");
    禁.forEach((w) => assert.ok(!みな.includes(w), "★「" + w + "」が あります"));
    // ★★合計・平均は 出して よい（★くらべる 表に しない）。
    assert.strictEqual(typeof m.totalOf, "function");
  });

  見る("★見える 範囲（★§Q1・§Q2）", () => {
    const i = 本文.indexOf("evaluation_scores_select");
    const なか = 本文.slice(i, i + 900);
    assert.ok(/has_can\(org_id, 'saiten'\)/.test(なか), "★事務・学長の 道が ありません");
    assert.ok(/judge_id = auth\.uid\(\)/.test(なか), "★審査員 ご本人の 道が ありません");
    assert.ok(/evaluation_judge_done/.test(なか),
      "★つけ終わるまで ほかの 審査員が 見えない 形に なって いません");
    assert.ok(/student_id = auth\.uid\(\) and confirmed_at is not null/.test(なか),
      "★学生は 確定後 だけ、に なって いません");
  });

  見る("★型を 決めるのは 学校（★§Q3）", () => {
    assert.strictEqual(m.mayEditItems(["saiten"]), true);
    assert.strictEqual(m.mayEditItems(["meibo"]), false);
    const i = 本文.indexOf("evaluation_items_write");
    assert.ok(/has_can\(org_id, 'saiten'\)/.test(本文.slice(i, i + 300)),
      "★台帳の 門が ちがいます");
  });

  見る("★点が 入った あとは 型を 変えられない（★§Q3 caution）", () => {
    assert.strictEqual(m.mayChangeItem({}, 0), true);
    assert.strictEqual(m.mayChangeItem({}, 3), false);
    assert.ok(/すでに 3件 点が 入って います/.test(m.whyCannotChangeItem(3)));
    assert.ok(/mayChangeItem/.test(ui), "★画面が 判じて いません");
  });

  見る("★「使わない」と「消す」を 分ける", () => {
    assert.ok(m.OFF_NOTE.includes("点は 残ります"), "★残る ことを 書いて いません");
    assert.ok(m.deleteNote(3).includes("消えます"), "★消える ことを 書いて いません");
    assert.ok(m.deleteNote(0).includes("そのまま 消せます"), "★0件の ときの 字が ちがいます");
    assert.ok(/<Ask/.test(ui), "★消す 前に お尋ねして いません");
  });

  見る("★点の 入れ方（★満点・きざみ）", () => {
    const it = { max_points: 10, step: 0.5 };
    assert.strictEqual(m.pointOk(8, it), true);
    assert.strictEqual(m.pointOk(8.5, it), true);
    assert.strictEqual(m.pointOk(8.3, it), false, "★きざみを 見て いません");
    assert.strictEqual(m.pointOk(11, it), false, "★満点を 見て いません");
    assert.strictEqual(m.pointOk("", it), true, "★空を 弾いて います");
    assert.ok(m.whyPointBad(11, it).includes("満点"), "★わけが ちがいます");
  });

  見る("★まとめは 使う 項目だけ", () => {
    const items = [{ id: "a", in_use: true }, { id: "b", in_use: false }];
    const scores = [{ item_id: "a", points: 8 }, { item_id: "b", points: 5 }];
    assert.strictEqual(m.totalOf(scores, items), 8, "★使わない 項目を 入れて います");
    assert.strictEqual(m.totalOf([], items), null, "★0件で 0 を 返して います");
  });

  const 一覧 = readCode("components", "OpsSaiten.jsx");
  const 入れ = readCode("components", "OpsTenIreru.jsx");

  見る("★進み具合を 色で 出さない（★言葉で 出す）", () => {
    assert.deepStrictEqual(Object.values(m.PROGRESS), ["未入力", "入力中", "済"]);
    assert.strictEqual(m.progressOf([], [{ id: "a", in_use: true }]), "未入力");
    assert.strictEqual(m.progressOf(
      [{ item_id: "a", points: 8 }], [{ id: "a", in_use: true }, { id: "b", in_use: true }]),
      "入力中");
    assert.strictEqual(m.progressOf(
      [{ item_id: "a", points: 8 }], [{ id: "a", in_use: true }]), "済");
    // ★★色で 分けて いない こと（★赤・緑を 使わない）。
    assert.ok(!/C\.(red|err|danger)/.test(一覧), "★色で 出して います");
  });

  見る("★まとめは「27 / 35」の 形（★順位を 付けない）", () => {
    const items = [{ id: "a", in_use: true, max_points: 10 },
                   { id: "b", in_use: true, max_points: 5 }];
    assert.strictEqual(m.totalWord([{ item_id: "a", points: 8 }], items), "8 / 15");
    assert.strictEqual(m.totalWord([], items), "—", "★0件で 0 を 出して います");
    assert.ok(/順位は 付けて いません/.test(一覧), "★その 断りが ありません");
  });

  見る("★点を 入れる 画面（★押す 前に 止める）", () => {
    assert.ok(/pointOk/.test(入れ), "★確かめて いません");
    assert.ok(/whyPointBad/.test(入れ), "★わけを 出して いません");
    assert.ok(/disabled=\{!出せる\}/.test(入れ), "★押せない ように して いません");
    // ★★ほかの 審査員の 点を、★この 画面に 出して いない こと。
    assert.ok(!/judge_id !== |ほかの 審査員の 点/.test(入れ.replace(/ENTRY_NOTES/g, "")),
      "★ほかの 審査員の 点を 出して います");
  });

  見る("★書くのは ご自分の ぶん だけ（★台帳）", () => {
    const i = 本文.indexOf("evaluation_scores_write");
    const なか = 本文.slice(i, i + 260);
    assert.ok(/judge_id = auth\.uid\(\)/.test(なか), "★ご自分だけ に なって いません");
    // ★★画面も 同じ です。
    assert.ok(/judge_id: userId/.test(vt), "★ご自分の 番号で 入れて いません");
  });

  見る("★つけ終わると ほかの 審査員が 見える", () => {
    assert.ok(/evaluation_judge_done/.test(vt), "★しるしを 作って いません");
    assert.ok(m.DONE_NOTE.includes("見える"), "★何が 変わるかを 書いて いません");
    assert.ok(m.DONE_NOTE.includes("あとからも 直せます"), "★直せる ことを 書いて いません");
  });

  見る("★入口は 審査員と saiten だけ", () => {
    assert.ok(/onGoSaiten=\{\(canOps\(gate, "saiten"\)/.test(vt),
      "★門が ありません／ちがいます");
    assert.ok(/onGoSaiten/.test(readCode("components", "OpsEvents.jsx")),
      "★行事に 札が ありません");
  });

  const 確 = readRaw("supabase", "migration_score_confirm.sql");
  const 確本 = 確.split("\n").filter((l) => !/^\s*--/.test(l)).join("\n");

  見る("§Q2 ★確定するまで 学生に 見えない", () => {
    assert.ok(/has_can\(p_org_id, 'saiten'\)/.test(確本), "★押せる 門が ちがいます");
    assert.ok(/confirmed_at = now\(\)/.test(確本), "★確定して いません");
    assert.ok(/confirmed_at is null/.test(確本), "★2度 押すと 日づけが 動きます");
    assert.strictEqual(m.mayConfirm(["saiten"]), true);
    assert.strictEqual(m.mayConfirm(["meibo"]), false);
    assert.ok(m.CONFIRM_ASK_NOTE.includes("見えます"), "★何が 変わるかを 書いて いません");
    assert.ok(/<Ask/.test(一覧), "★押す 前に お尋ねして いません");
  });

  見る("§Q4 ★確定の あとの 直しは 記録に 残る", () => {
    // ★★★`lastIndexOf` は 許しの 行に 当たりました（★2026-09-20）。
    //   ★★紙の 終わりに `grant execute on function … edit_confirmed_score` が あります。
    //   ★★★中身を 見たい ときは、★`create` の ところから 見ます。
    const i = 確本.lastIndexOf("create or replace function public.edit_confirmed_score");
    const j = 確本.indexOf("revoke all on function", i);
    const なか = 確本.slice(i, j > i ? j : 確本.length);
    assert.ok(/insert into public\.score_log/.test(なか), "★記録して いません");
    assert.ok(/before_value/.test(なか) && /after_value/.test(なか),
      "★前の 値・あとの 値を 残して いません");
    assert.ok(/confirmed_at is null[\s\S]{0,120}raise exception/.test(なか),
      "★確定の 前でも 通ります");
    assert.ok(/insert into public\.org_messages/.test(なか), "★学生に お知らせして いません");
  });

  見る("★記録の 残らない 直しを 作らない（★引き金）", () => {
    assert.ok(/create trigger evaluation_scores_guard_trg/.test(確本), "★引き金が ありません");
    assert.ok(/old\.confirmed_at is not null and new\.points is distinct from old\.points/
      .test(確本), "★確定後の 点の 直しを 止めて いません");
    assert.ok(/app\.score_edit/.test(確本), "★読み道からの 直しを 通す 道が ありません");
  });

  見る("★わけを 書くまで 押せない", () => {
    assert.strictEqual(m.mayEditConfirmed(""), false);
    assert.strictEqual(m.mayEditConfirmed("  "), false);
    assert.strictEqual(m.mayEditConfirmed("見直しました"), true);
    assert.ok(/mayEditConfirmed\(わけ\)/.test(入れ), "★画面が 判じて いません");
    assert.ok(/EDIT_WHY_EMPTY/.test(入れ), "★わけを 促して いません");
  });

  見る("★お知らせに 点の 数を 書かない", () => {
    const i = 確本.lastIndexOf("org_messages");
    const なか = 確本.slice(i, i + 400);
    assert.ok(!/p_points|after_value|v_before/.test(なか), "★点を 書いて います");
    assert.ok(/直されました/.test(なか), "★何が あったかを 書いて いません");
  });

  console.log("\n★" + 数 + "つ 通りました。");
})();
