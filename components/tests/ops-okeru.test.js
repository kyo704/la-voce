#!/usr/bin/env node
// ============================================================================
// ★入れられる 枠（★見本 `P_okeru`・裁定 その108）の 見張り
//
//   ★★★裁定 その108 ──「`lesson_slots` は 作らない。★計算で 出す」。
//     ★★だから、★表を 作って いない ことも 見張ります。
//
//   ★★★確かめる こと
//     ①新しい 表を 作って いない
//     ②3つ とも 満たす 枠 だけ 出す（来られる・空いて いる・先生が 空いて いる）
//     ③書いて いない 方は 1つも 出さない（★「分からない」を「来られる」に しない）
//     ④押す 前に 一度 お尋ねする
//     ⑤空の ときの 言い方（★見本の 字）
//
//   ★★較正 ── ★出る はずの ものと、★出ない はずの もので 試します。
// ============================================================================

const assert = require("assert");
const { readCode, loadLib } = require("./_source");
const fs = require("fs");
const path = require("path");

let 数 = 0;
function 見る(名, f) { f(); 数 += 1; console.log("  ○ " + 名); }

(async () => {
  const m = await loadLib("lib", "opsKumu.js");
  const ui = readCode("components", "OpsOkeru.jsx");
  const vt = readCode("components", "VocalTracker.jsx");

  見る("①`lesson_slots` の 表を 作って いない", () => {
    const 蔵 = path.join(__dirname, "..", "..", "supabase");
    const みな = fs.readdirSync(蔵).filter((f) => f.endsWith(".sql"))
      .map((f) => fs.readFileSync(path.join(蔵, f), "utf-8"))
      .join("\n")
      .split("\n").filter((l) => !/^\s*--/.test(l)).join("\n");
    assert.ok(!/create table[^\n]*lesson_slots/.test(みな), "★表を 作って います");
    assert.ok(/openSlots/.test(vt), "★計算で 出して いません");
  });

  const 日々 = ["2026-09-21", "2026-09-22"];
  const コマ = [{ id: "p1", ord: 1, name: "1限", start_min: 540, end_min: 630 },
                { id: "p2", ord: 2, name: "2限", start_min: 640, end_min: 730 }];
  const 時 = (iso) => {
    const m = /T(\d{2}):(\d{2})/.exec(String(iso));
    return m ? Number(m[1]) * 60 + Number(m[2]) : null;
  };

  見る("②3つ とも 満たす 枠 だけ", () => {
    const 枠 = m.openSlots({
      days: 日々, periods: コマ, studentId: "S",
      freeSlots: [
        { user_id: "S", slot_key: "0-1", is_free: true },
        { user_id: "S", slot_key: "0-2", is_free: true },
        { user_id: "S", slot_key: "1-1", is_free: true }
      ],
      // ★★0-2 には もう 置いて あります。
      lessons: [{ scheduled_at: "2026-09-21T10:40:00+09:00" }],
      // ★★1-1 は 先生の 予定が 入って います。
      busy: [{ weekday: 1, period_id: "p1", unavailable: true }],
      timeOfMin: 時
    });
    assert.strictEqual(枠.length, 1, "★数が 合いません: " + JSON.stringify(枠));
    assert.strictEqual(枠[0].dateISO, "2026-09-21");
    assert.strictEqual(枠[0].period.ord, 1);
  });

  見る("③書いて いない 方は 1つも 出さない", () => {
    const 枠 = m.openSlots({
      days: 日々, periods: コマ, studentId: "S",
      freeSlots: [], lessons: [], busy: [], timeOfMin: 時
    });
    assert.strictEqual(枠.length, 0, "★『分からない』を『来られる』に して います");
    // ★★よその 方の 空きを 使って いない こと。
    const 枠2 = m.openSlots({
      days: 日々, periods: コマ, studentId: "S",
      freeSlots: [{ user_id: "T", slot_key: "0-1", is_free: true }],
      lessons: [], busy: [], timeOfMin: 時
    });
    assert.strictEqual(枠2.length, 0, "★よその 方の 空きを 出して います");
  });

  見る("④押す 前に 一度 お尋ねする", () => {
    assert.ok(/<Ask/.test(ui), "★お尋ねが ありません");
    assert.ok(/putAsk/.test(ui), "★何を 入れるかを 出して いません");
    const 字 = m.putAsk({ dateISO: "2026-10-15", period: { name: "3限" } });
    assert.ok(字.includes("10月15日") && 字.includes("3限"), "★字が ちがいます: " + 字);
    assert.ok(m.PUT_ASK_NOTE.includes("相手"), "★相手に 及ぶ ことを 書いて いません");
  });

  見る("⑤空の ときの 言い方（★見本の 字）", () => {
    assert.strictEqual(m.OKERU_EMPTY, "入れられる 枠が ありません。");
    assert.ok(m.OKERU_EMPTY_HOW.includes("自分の 予定を 外す"), "★どうすればよいかが ありません");
    assert.strictEqual(m.OKERU_NOTES.length, 2);
    assert.ok(m.OKERU_NOTES.join("").includes("来られない 枠も 出しません"));
  });

  見る("★ご自分の 予定は 道から 読む（★表に 触らない）", () => {
    assert.ok(/rpc\("get_my_busy_slots"\)/.test(vt), "★道を 使って いません");
    assert.ok(!/from\("my_timetable"\)/.test(vt), "★表を 直に 引いて います");
    // ★★道が 返すのは 2つ だけ（★授業の 名・教室・備考は 返しません）。
    const sql = readCode("supabase", "migration_my_busy_slots.sql");
    assert.ok(/returns table \(weekday smallint, period_id uuid\)/.test(sql),
      "★返す ものが 多すぎます");
    ["title", "room", "memo"].forEach((w) =>
      assert.ok(!new RegExp("t\\." + w).test(sql), "★" + w + " を 返して います"));
  });

  見る("⑥入口は 時間割を 書いた 方 だけ", () => {
    const kumu = readCode("components", "OpsKumu.jsx");
    assert.ok(/onOpenOkeru && 書いた\.includes\(s\)/.test(kumu),
      "★書いて いない 方にも 押しどころを 出して います");
  });

  console.log("\n★" + 数 + "つ 通りました。");
})();
