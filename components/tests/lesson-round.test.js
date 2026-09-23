#!/usr/bin/env node
// STRIP: A（振る舞い）
// ============================================================================
// ★★★レッスン割 ── ★決めが 1か所に ある か（★裁定139 ／ sql/10）
//
//   ★★守る こと
//     ① 押す 順は 見本の とおり（空 → ◎ → △ → × → 空）
//     ② × と 空を 分けて いる（★「無理」と「まだ 答えて いない」は 別）
//     ③ `slot_key` の 形が 台帳の 関数と 1字 も ちがわない
//     ④ 授業の コマは ×。★★授業の **名前**を 受け取らない・返さない
//     ⑤ 理由の 欄が ない（★見本 …「理由は うかがいません」）
//     ⑥ 列を 名指しで 選ぶ（★`select('*')` を 書かない）
//     ⑦ 残りの 日数を 数えない（★台帳 …「あと n 日」を 出さない）
// ============================================================================
const fs = require("fs");
const path = require("path");
const { readCode, readRaw } = require("./_source");

let 落ち = 0;
function t(cond, label) {
  if (cond) console.log("  ok   " + label);
  else { console.log("  NG   " + label); 落ち++; }
}

(async () => {
  const p = path.join(__dirname, "..", "..", "lib", "lessonRound.js");
  // ★★`@/lib/…` を 結べる ように 直してから 読みます（★ほかの 見張りと 同じ 形）。
  const L = await import("data:text/javascript;base64," + Buffer.from(
    fs.readFileSync(p, "utf8").replace(/from "@\/lib\/([a-zA-Z0-9]+)"/g,
      (m, n) => `from "${"file://" + path.join(__dirname, "..", "..", "lib", n + ".js")}"`)
  ).toString("base64"));
  const 生 = readRaw("lib", "lessonRound.js");
  const 素 = readCode("lib", "lessonRound.js");

  console.log("① 押す 順（★見本 …「◎ → △ → × → 空」）");
  t(L.nextLevel(null) === L.MARU, "★空を 押すと ◎");
  t(L.nextLevel(L.MARU) === L.SANKAKU, "★◎ を 押すと △");
  t(L.nextLevel(L.SANKAKU) === L.BATSU, "★△ を 押すと ×");
  t(L.nextLevel(L.BATSU) === null, "★× を 押すと 空");
  t(L.markOf(L.MARU) === "◎" && L.markOf(L.SANKAKU) === "△"
    && L.markOf(L.BATSU) === "×" && L.markOf(null) === "", "★印が 見本と 同じ");

  console.log("\n② × と 空は 別");
  t(L.BATSU === 0 && L.levelOf({ a: 0 }, "a") === 0, "★× は 0 として 残る");
  t(L.levelOf({}, "a") === null, "★行が 無ければ 空");
  t(L.markOf(L.BATSU) !== L.markOf(null), "★印も ちがう");

  console.log("\n③ slot_key は 台帳と 同じ 形");
  t(L.slotKey(1, "p1") === "1-p1", "★<weekday>-<period_id>");
  t(L.slotKey(null, "p1") === null && L.slotKey(1, null) === null, "★欠けたら 作らない");
  // ★★台帳の 関数の 字と 突き合わせます。★私が 覚えません。
  const sql = fs.readFileSync(path.join(__dirname, "..", "..", "docs", "opus",
    "pack-2026-09-21_16", "pack", "sql", "20260923_10_lesson_allocation.sql"), "utf8");
  t(/t\.weekday::text \|\| '-' \|\| t\.period_id::text/.test(sql),
    "★台帳も 同じ 形で 作って いる（★sql/10 を 読んで 確かめた）");
  // ★★★決めは 1か所 ── ★`lib/myTimetable.js` の `cellKey` を 借ります。
  t(/import \{ cellKey \} from "@\/lib\/myTimetable"/.test(生),
    "★時間割の `cellKey` を 借りて いる（★同じ 形を 2つ 持たない）");

  console.log("\n④ 授業の コマ");
  t(L.isClassSlot([{ weekday: 1, period_id: "p1", unavailable: true }], 1, "p1") === true,
    "★授業が ある 枠は true");
  t(L.isClassSlot([{ weekday: 1, period_id: "p1", unavailable: false }], 1, "p1") === false,
    "★空いて いる 枠は false");
  t(L.isClassSlot([], 1, "p1") === false, "★時間割が 無ければ false");
  // ★★★授業の **名前**を 触って いない こと（★見本 …「先生に 伝わりません」）。
  // ★★★2026-09-23、★ここで 自分の 字に 当たりました。
  //   ★`COLS_ROUND` の `teacher_id`（★回の 先生）が、★`teacher` に 当たって いました。
  //   ★★★見たいのは「★**時間割の 行**から 名前を 読んで いないか」です。
  //     ★だから、★時間割の 行の 持ちもの を 触って いないか を 見ます。
  t(!/\.(title|teacher|room|memo)\b/.test(素),
    "★★時間割の 行から 名前・先生・部屋・覚え書きを 読んで いない");
  t(!/title/.test(L.COLS_TIMETABLE), "★選ぶ 列にも 名前が 無い（" + L.COLS_TIMETABLE + "）");

  console.log("\n⑤ 理由の 欄が ない");
  t(!/reason|理由を|riyuu/.test(素), "★理由を 受け取る ところが ない");
  t(/理由は うかがいません。/.test(L.PREFS_NOTE.join("")), "★但し書きに そう 書いて ある");

  console.log("\n⑥ 列は 名指し");
  [["COLS_ROUND", L.COLS_ROUND], ["COLS_PREF", L.COLS_PREF],
   ["COLS_NG", L.COLS_NG], ["COLS_TIMETABLE", L.COLS_TIMETABLE]].forEach(([n, v]) => {
    t(typeof v === "string" && v.length > 0 && !v.includes("*"), "★" + n + " は 名指し");
  });

  console.log("\n⑦ 残りの 日数を 数えない");
  // ★★★2026-09-23、★ここも 自分の 註に 当たりました（★`生` は 註を 残す ほう）。
  //   ★註には「『あと n 日』を 出さない」と 書いて あります。★それが 当たって いました。
  //   ★★★見るのは **処理**です。★註を 落とした ほう（`素`）で 見ます。
  t(!/days_left|daysLeft|差の日数|あと *\+|残り *\+/.test(素), "★「あと n 日」を 作って いない");
  // ★★日づけの 引き算を して いない こと（★数えたら 出したく なります）。
  t(!/getTime\(\)[\s\S]{0,60}-[\s\S]{0,60}getTime\(\)|86400000|1000 *\* *60 *\* *60 *\* *24/.test(素),
    "★日の 引き算を して いない");

  console.log(落ち === 0 ? "\n★すべて 通りました" : "\n★" + 落ち + "件 落ちました");
  process.exit(落ち === 0 ? 0 : 1);
})();
