#!/usr/bin/env node
// ============================================================================
// 「きょう」の数と言葉の見張り
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode } = require("./_source");
let failed = 0;
function ok(condition, label) {
  if (condition) console.log("  ✓ " + label);
  else { console.log("  ✗ " + label); failed++; }
}
function eq(actual, expected, label) {
  ok(JSON.stringify(actual) === JSON.stringify(expected),
    label + `（実際: ${JSON.stringify(actual)}）`);
}

(async () => {
  const source = fs.readFileSync(
    path.join(__dirname, "..", "..", "lib", "todayCard.js"), "utf8"
  );
  const m = await import("data:text/javascript;base64," + Buffer.from(source).toString("base64"));

  console.log("① 声の調子");
  eq(m.conditionWord(5), "出た", "5は出た");
  eq(m.conditionWord(3), "ふつう", "3はふつう");
  eq(m.conditionWord(1), "出づらい", "1は出づらい");
  eq(m.conditionWord("4"), null, "文字列は受け入れない");

  console.log("\n② 睡眠");
  eq(m.sleepParts(6.5), [{ n: "6", u: "時間" }, { n: "30", u: "分" }], "睡眠を数字と単位に分ける");
  eq(m.sleepWord(7), "7時間0分", "睡眠の言葉");
  eq(m.sleepWord(null), null, "無い睡眠はnull");
  eq(m.sleepWord(5.999), "6時間0分", "丸めて60分にしない");

  console.log("\n③ ふだん");
  eq(m.median([1, 2, 3]), 2, "奇数の中央値");
  eq(m.median([1, 2, 3, 4]), 2.5, "偶数の中央値");
  eq(m.median([]), null, "空の中央値はnull");
  const entries = {};
  for (let i = 1; i <= 5; i++) {
    const date = m.shiftISO("2026-09-11", -i);
    entries[date] = { throatCondition: i % 3 + 1 };
  }
  eq(m.usualOf(entries, "2026-09-11", (e) => e.throatCondition), 2,
    "5日分あればふだんを出す");
  eq(m.usualOf({}, "2026-09-11", (e) => e.throatCondition), null,
    "足りなければ黙って空ける");

  console.log("\n④ 羊の言葉");
  eq(m.sheepThanks({}), m.SHEEP_THANKS_YET, "未記録の日");
  eq(m.sheepThanks({ throatCondition: 1 }), m.SHEEP_THANKS_DONE, "記録した日");
  ok(m.TODAY_NOTE.length === 3, "下の注記は3行");
  ok(m.TODAY_NOTE.every((line) => !/連続\\d|連続[０-９]/.test(line) || line.includes("出しません")),
    "連続日数を表示しない");

  console.log("\n⑤ 画面の契約");
  const home = readCode("components", "HomeV2.jsx");
  ok(!/recharts|LineChart|BarChart|Sparkline/.test(home), "グラフを置かない");
  ok(!/データ不足|足りません|記録が少/.test(home), "不足を責める文言を出さない");
  ok(!/size=\{\d+\}/.test(home), "羊の大きさをpx直書きしない");

  console.log(failed === 0 ? "\n★すべて通りました" : `\n★${failed}件、落ちました`);
  process.exit(failed ? 1 : 0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
