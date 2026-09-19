#!/usr/bin/env node
// ============================================================================
// ★先生が 退く とき（★裁定 その104 Q2）の 見張り
//
//   ★★★確かめる こと
//     ①事務（`meibo`）だけ
//     ②ご自分は 外せない（★誰も いなく なります）
//     ③変わる もの・変わらない ものを 両方 出す
//     ④`enrollments` を 閉じない（★学校には 在籍の まま）
//     ⑤引き金（trigger）を 作って いない
//     ⑥合言葉は 閉じる ── ★`status` の 列が 無い ので `expires_at`
//     ⑦入口は 先生の 行だけ（★門下の ある 方）
//     ⑧0行 返ったら 成功に しない
//
//   ★★較正 ── ★SQL の 中を 見て、★在る ものと 無い ものを 確かめます。
// ============================================================================

const assert = require("assert");
const { readCode, readRaw, loadLib } = require("./_source");

let 数 = 0;
function 見る(名, f) { f(); 数 += 1; console.log("  ○ " + 名); }

(async () => {
  const m = await loadLib("lib", "opsRetireTeacher.js");
  const ui = readCode("components", "OpsRetireTeacher.jsx");
  const vt = readCode("components", "VocalTracker.jsx");
  const roster = readCode("components", "OpsRoster.jsx");
  const sql = readRaw("supabase", "migration_retire_teacher.sql");

  見る("較正 ── ★紙が 読めて いる", () => {
    assert.ok(sql.includes("create or replace function public.retire_teacher"),
      "★関数が ありません");
    assert.ok(!sql.includes("create trigger"), "★引き金が あります");
  });

  見る("①事務だけ", () => {
    assert.strictEqual(m.mayRetire(["meibo"]), true);
    assert.strictEqual(m.mayRetire(["sched_all"]), false);
    assert.ok(/has_can\(p_org_id, 'meibo'\)/.test(sql), "★台帳の 門が ちがいます");
  });

  見る("②ご自分は 外せない", () => {
    assert.strictEqual(m.mayDo({ teacherId: "A", myId: "A" }), false);
    assert.strictEqual(m.mayDo({ teacherId: "A", myId: "B" }), true);
    assert.ok(m.whyCannotDo({ teacherId: "A", myId: "A" }).length > 0);
    assert.ok(/mayDo|whyCannotDo/.test(ui), "★画面が 判じて いません");
  });

  見る("③変わる・変わらない を 両方 出す", () => {
    assert.strictEqual(m.WILL_DO.length, 6);
    assert.strictEqual(m.WILL_DO.filter((x) => x.ok).length, 3);
    assert.strictEqual(m.WILL_DO.filter((x) => !x.ok).length, 3);
    const 字 = m.WILL_DO.map((x) => x.label).join("／");
    assert.ok(字.includes("在籍は そのまま"), "★在籍の ことを 書いて いません");
    assert.ok(字.includes("講評・連絡は 残ります"), "★残る ことを 書いて いません");
    assert.ok(/WILL_DO/.test(ui), "★画面が 出して いません");
  });

  見る("④在籍は 閉じない", () => {
    // ★★`enrollments` を 更新して いない こと（★数える ためだけに 読みます）。
    assert.ok(!/update public\.enrollments/.test(sql), "★在籍を 閉じて います");
    assert.ok(/from public\.enrollments/.test(sql), "★数えても いません");
  });

  見る("⑤引き金では なく、★手順の 中で 呼ぶ", () => {
    assert.ok(/rpc\("retire_teacher"/.test(vt), "★画面から 呼んで いません");
    assert.ok(!/create trigger|create or replace trigger/.test(sql));
  });

  見る("⑥合言葉を 閉じる（★列が 無いので 期限で）", () => {
    assert.ok(/update public\.teacher_invitations/.test(sql), "★閉じて いません");
    assert.ok(/set expires_at = now\(\)/.test(sql), "★閉じ方が ちがいます");
    assert.ok(/monka_teacher_id = p_teacher_id/.test(sql), "★門下の 先生を 見て いません");
    // ★★★無い 列を 使って いない こと ── ★覚え書きを 外して から 見ます。
    //   ★★`stripComments` は JavaScript の 形 です。★SQL の `--` は 落ちません。
    //   ★★★この 紙は、★使わない わけを 覚え書きに 書いて います。
    //     ★★外さずに 見ると、★自分の 説明で 落ちます（★この 蔵の 持病 です）。
    const 本文 = sql.split("\n").filter((l) => !/^\s*--/.test(l)).join("\n");
    assert.ok(!/status\s*=\s*'closed'/.test(本文), "★無い 列を 書いて います");
    assert.ok(/status='closed'/.test(sql), "★わけを 覚え書きに 書いて いません");
  });

  見る("⑦入口は 先生の 行だけ", () => {
    assert.ok(/onGoRetire && hasMonka && hasMonka\(m\.user_id\)/.test(roster),
      "★誰にでも 出して います");
    assert.ok(/onGoRetire=\{mayRetire\(gate\)/.test(vt), "★事務だけに して いません");
  });

  見る("⑧0行は 成功に しない", () => {
    const i = vt.indexOf("async function handleRetireTeacher");
    const なか = vt.slice(i, i + 900);
    assert.ok(/data\.length === 0/.test(なか) && /throw/.test(なか),
      "★0行で 止めて いません");
  });

  console.log("\n★" + 数 + "つ 通りました。");
})();
