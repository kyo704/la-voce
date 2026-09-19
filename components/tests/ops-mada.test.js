#!/usr/bin/env node
// ============================================================================
// ★時間割が まだの方（★見本 `P_mada`・お決め D78）の 見張り
//
//   ★★★確かめる こと
//     ①読むのは 真偽 1つ だけ（★中身を 返す 道を 呼んで いない）
//     ②読めない ときは 一覧を 出さない（★空と 分ける）
//     ③知らせは 1回だけ ── ★もう 知らせた 方は 送り先に しない
//     ④2度目は 台帳が 弾く（★画面だけで 守って いない）
//     ⑤知らせられる のは 事務（`meibo`）だけ
//     ⑥但し書き 3つ（★催促を 重ねない／勝手に 動かさない／中身は 見えない）
//     ⑦0行 返ったら 成功に しない
//
//   ★★較正 ── ★当たり（1人 まだ）と 外れ（読めて いない）で 試します。
// ============================================================================

const assert = require("assert");
const { readCode, readRaw, loadLib } = require("./_source");

let 数 = 0;
function 見る(名, f) { f(); 数 += 1; console.log("  ○ " + 名); }

(async () => {
  const m = await loadLib("lib", "opsMada.js");
  const ui = readCode("components", "OpsMada.jsx");
  const vt = readCode("components", "VocalTracker.jsx");
  const sql = readRaw("supabase", "migration_timetable_nudge.sql");
  const 本文 = sql.split("\n").filter((l) => !/^\s*--/.test(l)).join("\n");

  見る("較正 ── ★読めて いる", () => {
    assert.strictEqual(typeof m.notSubmitted, "function");
    assert.ok(本文.includes("create or replace function public.get_timetable_submitted"));
  });

  見る("①真偽 1つ だけ", () => {
    // ★★台帳の 道が 返す 列 …… `student_id` と `submitted` だけ。
    const i = 本文.indexOf("get_timetable_submitted");
    const なか = 本文.slice(i, i + 320);
    assert.ok(/returns table \(student_id uuid, submitted boolean\)/.test(なか),
      "★返す ものが ちがいます");
    // ★★中身の 列を 返して いない こと。
    ["title", "room", "memo", "teacher", "weekday"].forEach((w) =>
      assert.ok(!new RegExp("t\\." + w).test(本文), "★" + w + " を 返して います"));
  });

  見る("②読めない ときは 一覧を 出さない", () => {
    assert.strictEqual(m.notSubmitted(undefined), null);
    assert.strictEqual(m.notSubmitted(null), null);
    // ★★当たり ── ★在れば 並びに なります。
    const 行 = m.notSubmitted([
      { student_id: "A", submitted: false },
      { student_id: "B", submitted: true }
    ], () => "な");
    assert.strictEqual(行.length, 1, "★まだの方 だけ に して いません");
    assert.strictEqual(行[0].studentId, "A");
    assert.ok(/NOT_READ/.test(ui), "★読めない ときの 1行が ありません");
  });

  見る("③もう 知らせた 方は 送り先に しない", () => {
    const 行 = [{ studentId: "A" }, { studentId: "B" }];
    assert.deepStrictEqual(m.nudgeTargets(行, [{ student_id: "A" }]), ["B"]);
    assert.deepStrictEqual(m.nudgeTargets(行, []), ["A", "B"]);
    assert.strictEqual(m.alreadyNudged([{ student_id: "A" }], "A"), true);
    assert.strictEqual(m.alreadyNudged([], "A"), false);
    assert.ok(m.whyCannotNudge(行, [{ student_id: "A" }, { student_id: "B" }]).length > 0);
  });

  見る("④2度目は 台帳が 弾く", () => {
    assert.ok(/on conflict \(org_id, student_id\) do nothing/.test(本文),
      "★重ねて 入る ように なって います");
    assert.ok(/primary key \(org_id, student_id\)/.test(本文), "★鍵が ありません");
    // ★★画面から 直に 入れられない こと。
    assert.ok(/revoke all on table public\.timetable_nudges from authenticated/.test(本文),
      "★取り上げて いません");
    assert.ok(/grant select on table public\.timetable_nudges to authenticated/.test(本文),
      "★読む ことも できません");
    assert.ok(!/insert.*timetable_nudges/.test(vt), "★画面から 入れて います");
  });

  見る("⑤知らせられる のは 事務だけ", () => {
    assert.strictEqual(m.mayNudge(["meibo"]), true);
    assert.strictEqual(m.mayNudge(["sched_all"]), false);
    assert.ok(/has_can\(p_org_id, 'meibo'\)/.test(本文), "★台帳の 門が ありません");
    assert.ok(/canNudge=\{mayNudge\(gate\)\}/.test(vt), "★画面の 門が ありません");
  });

  見る("⑥但し書き 3つ", () => {
    assert.strictEqual(m.NOTES.length, 3);
    const 字 = m.NOTES.join("");
    assert.ok(字.includes("催促を 重ねません"));
    assert.ok(字.includes("勝手に 動かしません"));
    assert.ok(字.includes("中身は 見えません"));
  });

  見る("⑦0行は 成功に しない", () => {
    const i = vt.indexOf("async function handleNudgeMada");
    const なか = vt.slice(i, i + 800);
    assert.ok(/data\.length === 0/.test(なか) && /throw/.test(なか),
      "★0行で 止めて いません");
  });

  見る("⑧入口が ある（★N-1）", () => {
    assert.ok(/<OpsMada/.test(vt), "★置いて いません");
    assert.ok(/onGoMada/.test(readCode("components", "OpsMonka.jsx")), "★札が ありません");
    assert.ok((vt.match(/fetchMada/g) || []).length >= 2, "★読み道が 呼ばれて いません");
  });

  console.log("\n★" + 数 + "つ 通りました。");
})();
