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
["きょうのレッスン", "名簿の人数", "先生", "重なり"].forEach((label) => {
  ok(ui.includes(label), `${label}を表示`);
});
ok(/きょうの ながれ/.test(ui), "今日の流れを表示");
ok(/近い 行事/.test(ui), "近い行事を表示");
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
