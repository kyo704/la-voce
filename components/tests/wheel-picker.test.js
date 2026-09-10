// ============================================================================
// ★スワイプの ホイールの 見張り（★2026-09-11）
//
//   ★出どころ 裁定-9月11日の12点 §9 ／ 裁定-9月10日夜（役職への一本化）§2
//
//   ★★確かめること
//     ① 1分きざみで、★0〜59 が ぜんぶ あること。
//     ② 決め打ちの ボタン（30分／45分／60分）を 置いていないこと。
//     ③ 上に いまの 値が 大きく 出ること。
//     ④ 長さは 分の 整数で 持つこと（★裁定 §Code 6）。
//     ⑤ 転がせない 方の 道が あること。
//     ⑥ 時計を 見ていないこと。
//     ⑦ レッスンの 時刻が、★これを 使っていること。
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
  const src = fs.readFileSync(path.join(ROOT, "lib", "wheelPicker.js"), "utf8");
  const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
  const {
    ROW_H, WHEEL_H, HOURS_OF_DAY, MINUTES, LENGTH_HOURS,
    indexAt, topOf, parseTime, formatTime, lengthWord, toMinutes, fromMinutes
  } = m;

  console.log("① 1分きざみ");
  ok(MINUTES.length === 60, "★分は 60 とおり（0〜59）");
  ok(MINUTES[0] === 0 && MINUTES[59] === 59, "★0から 59まで");
  ok(HOURS_OF_DAY.length === 24, "★時は 24 とおり");
  ok(LENGTH_HOURS.length === 5, "★長さの 時間は 0〜4（★裁定のとおり）");
  // ★★とびとびに していないこと。
  ok(MINUTES.every((v, i) => v === i), "★1つも 抜けていない");

  console.log("② 決め打ちの ボタンが ない");
  const uiCode = readCode("components", "WheelPicker.jsx");
  ["30分", "45分", "60分", "1時間30分"].forEach((w) => {
    ok(!uiCode.includes(w), "★「" + w + "」の ボタンが 無い");
  });
  ok(!/PRESET|QUICK_LEN/.test(src), "★決め打ちの 一覧を 作っていない");

  console.log("③ 上に 大きく 出る");
  const ui = readRaw("components", "WheelPicker.jsx");
  ok(/head/.test(ui) && /TYPE\.big/.test(ui), "★上に 大きく 出す ところが ある");
  ok(/textAlign: "center", \.\.\.TYPE\.big/.test(ui), "★まん中に 大きく");

  console.log("④ 長さは 分の 整数");
  ok(toMinutes(1, 30) === 90, "★1時間30分 → 90");
  ok(toMinutes(0, 45) === 45, "★45分 → 45");
  const r = fromMinutes(90);
  ok(r.h === 1 && r.m === 30, "★90 → 1時間30分");
  ok(fromMinutes(0).h === 0 && fromMinutes(0).m === 0, "★0でも 落ちない");
  ok(lengthWord(0, 45) === "45分", "★45分");
  ok(lengthWord(1, 0) === "1時間", "★1時間");
  ok(lengthWord(1, 30) === "1時間30分", "★1時間30分");
  ok(lengthWord(0, 0) === "0分", "★0でも 空に しない（★決めていないのか 0なのか 分かるように）");

  console.log("⑤ 転がせない 方の 道");
  ok(/<input type="number"/.test(ui), "★数を 打つ 道が ある");
  ok(/aria-label=\{label\}/.test(ui), "★読み上げの 名前が ある");
  ok(/minHeight: SPACE\.tapMin/.test(ui), "★44 を 下回らない");

  console.log("⑥ 時計を 見ていない");
  ok(!/Date\.now\(\)|new Date\(\)/.test(readCode("lib", "wheelPicker.js")), "★時計を 見ていない");
  ok(parseTime("19:00").h === 19, "★19:00 が 読める");
  ok(parseTime("9:5") === null, "★形が ちがえば null");
  ok(parseTime("25:00") === null, "★24時を 越えたら null");
  ok(parseTime("12:60") === null, "★60分を 越えたら null");
  ok(formatTime(9, 5) === "09:05", "★2桁に そろう");

  console.log("⑦ 段の 数");
  ok(WHEEL_H === ROW_H * 3, "★入れ物は 3段ぶん（★まん中 ＋ 上下）");
  ok(indexAt(ROW_H * 2 + 2) === 2, "★すこし ずれても、いちばん 近い 段");
  ok(topOf(3) === ROW_H * 3, "★段から 位置が 出る");
  ok(indexAt(-50) === 0, "★上に 行きすぎても 0");

  console.log("⑧ レッスンの 時刻が 使っている");
  const v = readRaw("components", "VocalTracker.jsx");
  ok(/<WheelPicker/.test(v), "★画面が 呼んでいる");
  ok(!/type="time" value=\{newLessonTime\}/.test(v), "★古い 時刻の 入力欄が 残っていない");
  ok(/HOURS_OF_DAY/.test(v) && /MINUTES/.test(v), "★時と 分を 渡している");

  console.log(failed === 0 ? "\n全て ok" : "\n" + failed + "件 NG");
  process.exit(failed === 0 ? 0 : 1);
})();
