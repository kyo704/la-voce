#!/usr/bin/env node
// ============================================================================
// 運営ホームの表示契約の見張り
// ============================================================================

const { readCode, readRaw } = require("./_source");
const ui = readCode("components", "OpsHome.jsx");
const raw = readRaw("components", "OpsHome.jsx");
let failed = 0;
function ok(condition, label) {
  if (condition) console.log("  ✓ " + label);
  else { console.log("  ✗ " + label); failed++; }
}

console.log("① 数をlibから受け取る");
ok(/rosterCount\(members\)/.test(ui), "名簿人数を共通関数から出す");
ok(/countsByStatus\(members\)/.test(ui), "状態別人数を共通関数から出す");
ok(/overlapsOf\(lessons, todayISO\)/.test(ui), "重なりを共通関数から出す");
ok(/buildEvents\(events, participants, targetOf\)/.test(ui), "行事を共通関数から出す");
ok(/teacherCount \|\| 0/.test(ui), "先生数を親から受け取る");

console.log("\n② 表示するもの");
// ★★★2026-09-19（★見本くらべ D1・D2）── ★札の 字は `lib` が 持ちます。
//   ★★画面に 書いて あるか を 見て いました。★移した 日に 落ちました。
//   ★★★決めの ある ところ で 数え、★画面は「それを 使って いるか」を 見ます。
const 決め = readCode("lib", "opsHomeSections.js");
const 並び = (名) => 決め.slice(決め.indexOf("export const " + 名),
  決め.indexOf("]);", 決め.indexOf("export const " + 名)));
["きょうの レッスン", "名簿の 人数", "先生", "重なり", "門下の 人数"].forEach((label) => {
  ok(並び("HOME_STATS").includes(label), `${label}の 札が 決めに ある`);
});
ok(/homeStats\(perms\)/.test(ui), "札を できことで 選んで いる");
ok(/tappable/.test(ui), "押せるか どうかを 見て いる（★行き先の 帯）");
// ★★節は 6つ とも 描きます（★2026-09-19・お決め D1）。
["nagare", "lesson", "monka", "gyoji", "oshirase", "bill"].forEach((k) => {
  ok(new RegExp('出す\\("' + k + '"\\)').test(ui), `節 ${k} を 描いて いる`);
});
ok(/SECTION_HEADS/.test(ui), "節の 題を lib から 取って いる");
ok(/HOME_NOTES/.test(ui), "但し書きを 画面に 出して いる");
ok(/attendanceOrphan\(perms\)/.test(ui), "★裁定 その79 の 逃げ道を 通して いる");
ok(/きょうの ながれ/.test(決め), "今日の流れの 題が 決めに ある");
ok(/近い 行事/.test(決め), "近い行事の 題が 決めに ある");
ok(/重なりは印をつけるだけです/.test(ui), "重なりを自動移動しない説明");
ok(/onSeeSchedule/.test(ui), "日程画面への導線を持つ");

console.log("\n③ 不要な情報を出さない");
["健康", "体調", "throatCondition", "voiceQuality", "sleepHours", "連続", "達成率", "％"].forEach((word) => {
  ok(!ui.includes(word), `${word}を扱わない`);
});
ok(!/autoMove|reschedule|shift\(/.test(ui), "予定を自動で動かさない");

console.log("\n④ 空のときの表示");
ok(/today\.length > 0 \?/.test(ui), "今日の予定があるときだけ流れを表示");
ok(/upcoming\.length > 0 \?/.test(ui), "行事があるときだけ表示");
ok(/overlaps\.length > 0 \?/.test(ui), "重なりがあるときだけ表示");
ok(/type="button"/.test(raw), "操作ボタンにtypeを付ける");
ok(/minHeight: 44/.test(ui), "日程へのボタンは44px以上");

console.log(failed === 0 ? "\n★すべて通りました" : `\n★${failed}件、落ちました`);
process.exit(failed ? 1 : 0);
