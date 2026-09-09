#!/usr/bin/env node
/**
 * 気温・湿度の「前の日から引き継ぐ」（2026-09-01・Opus の判断）
 *
 * ★守りたいこと
 *   ① 引き継ぐのは★今日の記録のときだけ（過去の日は埋めない）
 *   ② 3日を超えて引き継がない。4日目は空にする
 *   ③ 触ったら 'entered' になる
 *   ④ 引き継いだ日は、快適帯の判定を出さない
 *   ⑤ 引き継ぎが半分を超える期間では、絶対湿度を説明変数に使わない
 *   ⑥ 文言に「そのままで構いません」と書かない
 *   ⑦ ★過去の記録を埋める移行を書かない
 */
const { readCode, readRaw } = require("./_source");
let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }
function eq(a, b, label) { assertTrue(JSON.stringify(a) === JSON.stringify(b), `${label}（${JSON.stringify(a)}）`); }

const vt = readCode("components", "VocalTracker.jsx");
const toISO = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const addDays = (iso, n) => { const d = new Date(iso + "T00:00:00"); d.setDate(d.getDate() + n); return toISO(d); };

(async () => {
  const w = await import("../../lib/weatherCarry.js");

  console.log("=== ★① 今日だけ。過去の日は埋めない ===");
  const E = { "2026-08-31": { temperature: 24, humidity: 55, weatherSource: "entered" } };
  const today = w.weatherCarryDecision({ entries: E, date: "2026-09-01", realToday: "2026-09-01", addDays, current: {} });
  assertTrue(today.carry === true, "今日なら引き継ぐ");
  eq([today.temperature, today.humidity], [24, 55], "前の日の値をそのまま持ってくる");
  const past = w.weatherCarryDecision({ entries: E, date: "2026-08-20", realToday: "2026-09-01", addDays, current: {} });
  assertTrue(past.carry === false && past.reason === "pastDate", "★過去の日は引き継がない");

  console.log("\n=== ★すでに値があれば触らない ===");
  const has = w.weatherCarryDecision({ entries: E, date: "2026-09-01", realToday: "2026-09-01", addDays, current: { temperature: 20 } });
  assertTrue(has.carry === false && has.reason === "alreadyHasValue", "片方でも入っていれば触らない");
  const none = w.weatherCarryDecision({ entries: {}, date: "2026-09-01", realToday: "2026-09-01", addDays, current: {} });
  assertTrue(none.carry === false && none.reason === "noPreviousValue", "前の日が無ければ引き継がない");

  console.log("\n=== ★② 3日まで。4日目は空 ===");
  assertTrue(w.MAX_CARRY_DAYS === 3, "上限は3日");
  const C = {};
  ["2026-08-29", "2026-08-30", "2026-08-31"].forEach((d) => { C[d] = { temperature: 24, humidity: 55, weatherSource: "carried" }; });
  const day4 = w.weatherCarryDecision({ entries: C, date: "2026-09-01", realToday: "2026-09-01", addDays, current: {} });
  assertTrue(day4.carry === false && day4.reason === "carryLimitReached", "★4日目は引き継がない");
  eq([day4.temperature, day4.humidity], [null, null], "★空のままにする");
  // 途中で自分で入れたら、数え直し
  const M = {
    "2026-08-29": { temperature: 24, humidity: 55, weatherSource: "carried" },
    "2026-08-30": { temperature: 24, humidity: 55, weatherSource: "carried" },
    "2026-08-31": { temperature: 26, humidity: 50, weatherSource: "entered" }
  };
  assertTrue(w.weatherCarryDecision({ entries: M, date: "2026-09-01", realToday: "2026-09-01", addDays, current: {} }).carry === true,
    "★途中で自分で入れたら、そこから数え直す");

  console.log("\n=== ★③ 触ったら entered ===");
  assertTrue(/temperature: v, weatherSource: "entered"/.test(vt), "気温を触ると entered");
  assertTrue(/humidity: v, weatherSource: "entered"/.test(vt), "湿度を触ると entered");
  assertTrue(/weatherSource: "carried"/.test(vt), "引き継いだときは carried");

  console.log("\n=== ★④ 引き継いだ日は、快適帯の判定を出さない ===");
  assertTrue(/if \(isCarried\(formData\)\) \{/.test(vt), "★引き継ぎのときの分岐がある");
  const block = vt.slice(vt.indexOf("if (isCarried(formData)) {"), vt.indexOf("if (isCarried(formData)) {") + 400);
  assertTrue(/絶対湿度 \{absH\.toFixed\(1\)\} g\/m³/.test(block), "数字は出す");
  assertTrue(!/平常より|快適域|外れて/.test(block), "★判定の文は出さない");
  // ★★2026-09-10、★色を 直しました（★Opus の 指摘・文字の 読みやすさ）。
  //   ★★ここは C.line（★罫線の色）を 求めていました。★紙の上で 1.21 です。
  //     ★★控えめに するつもりが、★読めない ところまで 行っていました。
  //   ★★控えめは、★小さい字で 足ります。★色で 消しません。
  //   ★見張りの ほうが 誤っていました。★向きを 変えます。
  assertTrue(/color: C\.inkSoft/.test(block), "★控えめな色にしている（★読める濃さで）");
  assertTrue(!/color: C\.line/.test(block), "★罫線の色を、字に 使っていない");

  console.log("\n=== ★⑤ 絶対湿度で結論を出す画面は、もうありません ===");
  // ★★2026-09-07、★環境の快適帯を、まるごとやめました（10番）。
  //   ★「引き継ぎが半分を超えたら止める」は、★快適帯だけを止めていました。
  //   ★止める相手が無くなったので、★仕組みごと外しました。
  //   ★★戻ってきていないことを、ここで見張ります。
  assertTrue(w.mayUseAbsoluteHumidity === undefined, "★止める仕組みは、外したまま");
  assertTrue(w.MAX_CARRIED_RATIO === undefined, "★しきい値も、外したまま");
  assertTrue(!/absHumidityUsable/.test(vt), "★画面にも、残っていない");
  assertTrue(!/快適帯|快適域/.test(vt), "★快適帯そのものが、戻ってきていない");

  console.log("\n=== ★⑥ 「そのままで構いません」と書かない ===");
  eq(w.CARRIED_NOTE, "前の日の値です。変わっていたら、直してください。", "指定どおりの文言");
  ["そのままで構いません", "そのままで大丈夫", "変更不要", "問題ありません"].forEach((bad) => {
    assertTrue(!w.CARRIED_NOTE.includes(bad), `★「${bad}」と書いていない`);
  });

  console.log("\n=== ★⑦ 過去の記録を埋める移行を書いていない ===");
  const mig = readRaw("supabase", "migration_weather_source.sql");
  const live = mig.split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
  assertTrue(/add column if not exists weather_source text/.test(live), "列を足す");
  assertTrue(!/^\s*update /im.test(live), "★UPDATE が1行も無い（過去を埋めない）");
  assertTrue(!/default\s+'(entered|carried)'/i.test(live), "★既定値を入れていない");
  assertTrue(/weather_source is null or weather_source in \('entered', 'carried'\)/.test(live),
    "★2つの値だけを許す制約");

  console.log("\n=== 値の一覧が、コードと lib でずれていない ===");
  eq(w.WEATHER_SOURCES, ["entered", "carried"], "lib の一覧");
  const local = vt.slice(vt.indexOf("function weatherSourceOrNull"), vt.indexOf("function weatherSourceOrNull") + 200);
  w.WEATHER_SOURCES.forEach((v) => {
    assertTrue(local.includes(`"${v}"`), `★entryToRow 側にも ${v} がある`);
  });

  console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
  process.exit(failCount === 0 ? 0 : 1);
})();
