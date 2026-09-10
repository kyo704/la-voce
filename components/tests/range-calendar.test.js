// ============================================================================
// ★期間を えらぶ カレンダーの 見張り（★2026-09-11）
//
//   ★出どころ 裁定-9月10日夜の7点（役職名・先生の運営・希望申告ほか）.md §2
//
//   ★★確かめること
//     ① はじめ → おわり の 順。★逆に 押しても そろうこと。
//     ② もう一度 押すと やり直せること。
//     ③ 早押し 3つ（先週・今月・先月）が 正しいこと。
//     ④ 時計を 見ていないこと（★きょうを 受け取る）。
//     ⑤ 升目に 前の月・次の月の 日が 混ざらないこと。
//     ⑥ 押せる 大きさが 44 を 下回らないこと。
//     ⑦ 受診用の 画面が、★この カレンダーを 使っていること。
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode, readRaw } = require("./_source");

let failed = 0;
function ok(cond, label) {
  if (cond) { console.log("  ok  " + label); }
  else { console.log("  NG  " + label); failed++; }
}

(async () => {
  const ROOT = path.join(__dirname, "..", "..");
  const src = fs.readFileSync(path.join(ROOT, "lib", "rangeCalendar.js"), "utf8");
  const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
  const { monthGrid, pickDay, inRange, isEdge, quickRange, rangeLabel, daysInMonth, shiftMonth } = m;

  console.log("① はじめ → おわり");
  let r = pickDay({}, "2026-09-06");
  ok(r.start === "2026-09-06" && r.end === null, "★1回目は はじめの日");
  r = pickDay(r, "2026-09-12");
  ok(r.start === "2026-09-06" && r.end === "2026-09-12", "★2回目は おわりの日");
  // ★逆に 押しても、★そろえます。
  let q = pickDay(pickDay({}, "2026-09-12"), "2026-09-06");
  ok(q.start === "2026-09-06" && q.end === "2026-09-12", "★逆に 押しても そろう");

  console.log("② やり直せる");
  const again = pickDay({ start: "2026-09-06", end: "2026-09-12" }, "2026-09-20");
  ok(again.start === "2026-09-20" && again.end === null, "★3回目は やり直し");

  console.log("③ 早押し");
  const w = quickRange("先週", "2026-09-11");
  ok(w.start === "2026-09-05" && w.end === "2026-09-11", "★先週は 7日ぶん（★きょうを 含む）");
  const t = quickRange("今月", "2026-09-11");
  ok(t.start === "2026-09-01" && t.end === "2026-09-11", "★今月は 1日から きょうまで");
  const l = quickRange("先月", "2026-09-11");
  ok(l.start === "2026-08-01" && l.end === "2026-08-31", "★先月は まるごと 1か月");
  // ★年を またぐ とき。
  const j = quickRange("先月", "2026-01-15");
  ok(j.start === "2025-12-01" && j.end === "2025-12-31", "★1月の 先月は 前の年の 12月");

  console.log("④ 時計を 見ていない");
  ok(!/Date\.now\(\)|new Date\(\)/.test(readCode("lib", "rangeCalendar.js")),
    "★きょうを 自分で 作っていない（★受け取る）");
  ok(/todayISO/.test(readRaw("components", "RangeCalendar.jsx")), "★画面も きょうを 受け取る");

  console.log("⑤ 升目");
  [[2026, 9], [2026, 2], [2024, 2], [2026, 12], [2027, 1]].forEach(([y, mm]) => {
    const g = monthGrid(y, mm);
    ok(g.length % 7 === 0, `★${y}年${mm}月は 7の 倍数（${g.length}）`);
    const real = g.filter(Boolean);
    ok(real.length === daysInMonth(y, mm), `★${y}年${mm}月は ${daysInMonth(y, mm)}日`);
    ok(real.every((d) => d.slice(0, 7) === `${y}-${String(mm).padStart(2, "0")}`),
      `★${y}年${mm}月に ほかの 月が 混ざっていない`);
  });
  ok(daysInMonth(2024, 2) === 29, "★うるう年の 2月は 29日");
  ok(daysInMonth(2026, 2) === 28, "★ふつうの 2月は 28日");
  const sm = shiftMonth(2026, 12, 1);
  ok(sm.y === 2027 && sm.m === 1, "★12月の 次は 翌年の 1月");

  console.log("⑥ 押せる 大きさ");
  const ui = readRaw("components", "RangeCalendar.jsx");
  ok(/minHeight: SPACE\.tapMin/.test(ui), "★升目も 44 を 下回らない");
  ok((ui.match(/minHeight: SPACE\.tapMin/g) || []).length >= 2, "★月を 送る ボタンも");

  console.log("⑦ 受診用が 使っている");
  const v = readRaw("components", "VocalTracker.jsx");
  ok(/<RangeCalendar/.test(v), "★受診用の 画面が 呼んでいる");
  ok(!/type="date" value=\{clinicCustomStart\}/.test(v), "★古い 日付の 入力欄が 残っていない");
  // ★★途中の 日は うすい色で つながること。
  ok(/inRange\(range, iso\)/.test(ui) && /isEdge\(range, iso\)/.test(ui),
    "★中と 端を 見分けている");
  ok(inRange({ start: "2026-09-06", end: "2026-09-12" }, "2026-09-09") === true, "★途中の日は 中");
  ok(isEdge({ start: "2026-09-06", end: "2026-09-12" }, "2026-09-09") === false, "★途中の日は 端では ない");
  ok(rangeLabel({ start: "2026-09-06", end: "2026-09-12" }).includes("〜"), "★言葉に なる");

  console.log(failed === 0 ? "\n全て ok" : "\n" + failed + "件 NG");
  process.exit(failed === 0 ? 0 : 1);
})();
