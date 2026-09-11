#!/usr/bin/env node
// ============================================================================
// 個人の時間割の見張り
//
//   lib/myTimetable.js の表作りと、MyTimetable.jsx の表示契約を確認します。
//   実行: node components/tests/my-timetable.test.js
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode, readRaw } = require("./_source");

let failed = 0;
function ok(condition, label) {
  if (condition) console.log("  ✓ " + label);
  else { console.log("  ✗ " + label); failed++; }
}
function eq(actual, expected, label) {
  ok(JSON.stringify(actual) === JSON.stringify(expected),
    label + `（実際: ${JSON.stringify(actual)}）`);
}

async function loadLib() {
  const source = fs.readFileSync(
    path.join(__dirname, "..", "..", "lib", "myTimetable.js"), "utf8"
  );
  return import("data:text/javascript;base64," + Buffer.from(source).toString("base64"));
}

(async () => {
  const m = await loadLib();
  const ui = readCode("components", "MyTimetable.jsx");
  const raw = readRaw("components", "MyTimetable.jsx");

  console.log("① 曜日の決まり");
  eq(m.DAYS, ["月", "火", "水", "木", "金", "土"], "月〜土の6列");
  ok(m.DAYS.includes("金"), "金曜日がある");
  ok(!m.DAYS.includes("日"), "日曜日を出さない");

  console.log("\n② はじめのコマ");
  const defaults = m.periodsOf([]);
  eq(defaults.length, 6, "既定のコマは6限まで");
  ok(defaults.every((p, i) => p.ord === i + 1), "コマ番号が1から順番");
  ok(defaults.every((p) => p.id === null), "既定のコマは台帳へ書かない");
  ok(!m.isOwnPeriods([]), "空の台帳は自分で決めた扱いにしない");
  ok(m.isOwnPeriods([{ id: "p1", ord: 1 }]), "台帳にあれば自分のコマ");

  console.log("\n③ マスの状態");
  eq(m.cellState(null), "free", "行が無ければ空き");
  eq(m.cellState({ unavailable: true }), "unavailable", "来られない");
  eq(m.cellState({ title: "声楽" }), "class", "授業名があれば授業");
  eq(m.cellState({ teacher: "先生" }), "class", "先生だけでも授業");
  eq(m.cellState({ title: "  " }), "free", "空白だけは空き");

  console.log("\n④ 曜日×コマの表");
  const periods = [{ id: "p1", ord: 1, name: "1限", start_min: 540, end_min: 630 }];
  const rows = [
    { weekday: 0, period_id: "p1", title: "声楽" },
    { weekday: 4, period_id: "p1", unavailable: true },
    { weekday: 4, period_id: "other", title: "別のコマ" }
  ];
  const grid = m.buildGrid(rows, periods);
  eq(grid.length, 1, "コマごとに1行");
  eq(grid[0].cells.length, 6, "1行に月〜土の6マス");
  eq(grid[0].cells[0].state, "class", "月曜の授業");
  eq(grid[0].cells[4].state, "unavailable", "金曜の来られない");
  eq(grid[0].cells[5].state, "free", "土曜の空き");
  eq(m.freeCount(rows, periods), 4, "空きは授業・来られないを除いて数える");

  console.log("\n⑤ 時刻と入力検証");
  eq(m.hhmm(540), "9:00", "分を時刻へ");
  eq(m.hhmm(10 * 60 + 5), "10:05", "1桁の分を0埋め");
  eq(m.toMin("9:05"), 545, "時刻を分へ");
  eq(m.toMin("x"), null, "不正な時刻はnull");
  eq(m.periodError({ name: "1限", start_min: 540, end_min: 630 }), null, "正しいコマ");
  ok(m.periodError({ name: "", start_min: 540, end_min: 630 }), "名前が無ければエラー");
  ok(m.periodError({ name: "1限", start_min: 630, end_min: 540 }), "逆順の時刻はエラー");

  console.log("\n⑥ 画面は曜日列とマスの大きさを固定");
  ok(/tableLayout: "fixed"/.test(ui), "表のレイアウトが固定");
  ok(/<colgroup>/.test(ui) && /85 \/ DAYS\.length/.test(ui), "曜日列の幅をcolで固定");
  ok(/width: "15%"/.test(ui), "コマ列の幅を固定");
  ok(/height: 58, minHeight: 58/.test(ui), "予定マスの高さを固定");
  ok(/overflow: "hidden"/.test(ui), "長い文字でマスを伸ばさない");
  ok(!/overflowX: "auto"/.test(ui), "横スクロールに依存しない");
  ok(/DAYS\.map/.test(ui), "曜日はlibのDAYSから描く");
  ok(/DAYS\.length/.test(raw), "6曜日を直書きしていない");

  console.log(failed === 0 ? "\n★すべて通りました" : `\n★${failed}件、落ちました`);
  process.exit(failed === 0 ? 0 : 1);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
