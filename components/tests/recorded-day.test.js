#!/usr/bin/env node
// ============================================================================
// 「記録した日」の 数え方（査読 §10）の 見張り
//
//   ★出どころ docs/opus/woolsong-裁定-分析機能へのFableの査読（9月9日・夜）.md §10
//
//   ★★確かめること
//     ① 夜の3項目が そろった日だけが「記録した日」。
//     ② 朝の2項目は 任意。★入っていなくても、★入っていても、変わらない。
//     ③ 場面ごとに 書いた日（voiceEntries）も 拾う。
//     ④ 0 は「書いた」。★null と 分ける。
//     ⑤ ★てんの数え方（hasAnyRecord）と 1つに していない。
//     ⑥ ★門の中だけ。★38人の 分析が 閉じ直らない。
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode, readRaw } = require("./_source");

let ok = 0, ng = 0;
function t(cond, label) {
  if (cond) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label); ng++; }
}
function eq(a, b, label) {
  const ja = JSON.stringify(a), jb = JSON.stringify(b);
  t(ja === jb, label + (ja === jb ? "" : `  期待:${jb} 実際:${ja}`));
}

(async () => {
  const load = async (rel) => {
    const src = fs.readFileSync(path.join(__dirname, "..", "..", rel), "utf8");
    return import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
  };
  const r = await load("lib/recordedDay.js");
  const ch = await load("lib/character.js");

  const full = { throatCondition: 3, voiceQuality: 4, nonPerformanceSpeechMinutes: 60 };

  console.log("=== ① 夜の3項目が そろった日だけ ===");
  eq(r.NIGHT_THREE.map((f) => f.key),
    ["throatCondition", "voiceQuality", "nonPerformanceSpeechMinutes"], "★3項目は §10 のとおり");
  eq(r.NIGHT_THREE.map((f) => f.label),
    ["のどの調子", "声の出来", "声を使った時間"], "★言葉も §10 のとおり");
  eq(r.isRecordedDay(full), true, "3つ そろえば 記録した日");
  r.NIGHT_THREE.forEach((f) => {
    const missing = { ...full };
    delete missing[f.key];
    eq(r.isRecordedDay(missing), false, `★「${f.label}」が 無ければ 数えない`);
  });
  eq(r.isRecordedDay(null), false, "無い日は false");
  eq(r.isRecordedDay({}), false, "空の日は false");

  console.log("\n=== ② 朝の2項目は 任意 ===");
  eq(r.MORNING_TWO.map((f) => f.key), ["morningEdema", "sleepHours"], "★朝は この2つ");
  r.MORNING_TWO.forEach((f) => {
    eq(r.isRecordedDay({ ...full, [f.key]: 7 }), true, `★「${f.label}」を 足しても 変わらない`);
  });
  eq(r.isRecordedDay({ morningEdema: 0, sleepHours: 7 }), false, "★朝だけでは 数えない");
  // ★★朝を 逃した日が、★記録していない日に ならないこと（★§10 の 芯）
  eq(r.isRecordedDay(full), r.isRecordedDay({ ...full, sleepHours: 8, morningEdema: 2 }),
    "★★朝を 逃しても、★書いた日は 書いた日のまま");

  console.log("\n=== ③ 場面ごとに 書いた日 ===");
  eq(r.isRecordedDay({ voiceEntries: [{ bodyFeel: 3, quality: 4 }], nonPerformanceSpeechMinutes: 30 }),
    true, "★voiceEntries の 中の 値も 拾う");
  eq(r.isRecordedDay({ voiceEntries: [{ bodyFeel: 3 }], nonPerformanceSpeechMinutes: 30 }),
    false, "★声の出来が 無ければ 数えない");
  eq(r.isRecordedDay({ voiceEntries: [{ bodyFeel: null, quality: null }], nonPerformanceSpeechMinutes: 30 }),
    false, "★空の 場面は 拾わない");

  console.log("\n=== ④ 0 は「書いた」 ===");
  eq(r.isRecordedDay({ throatCondition: 0, voiceQuality: 0, nonPerformanceSpeechMinutes: 0 }),
    true, "★0 も 書いたこと（★null と 分ける）");
  eq(r.nightThreeCount({ throatCondition: 3 }), 1, "★いくつ 書いたかも 数えられる");
  eq(r.nightThreeCount(full), 3, "3つなら 3");

  console.log("\n=== 数と 並び ===");
  const E = { "2026-09-07": full, "2026-09-08": { sleepHours: 7 }, "2026-09-09": full };
  eq(r.countRecordedDays(E), 2, "★開いただけの日は 数えない");
  eq(r.recordedDates(E), ["2026-09-07", "2026-09-09"], "★古い順");
  eq(r.countRecordedDays({}), 0, "空なら 0");

  console.log("\n=== ⑤ てんの数え方と 別のもの ===");
  // ★★hasAnyRecord は 広い。★開いて 何か 書いた日は すべて。
  eq(ch.hasAnyRecord({ sleepHours: 7 }), true, "★てんは、眠りだけでも 付く");
  eq(r.isRecordedDay({ sleepHours: 7 }), false, "★分析は、眠りだけでは 数えない");
  t(ch.hasAnyRecord({ sleepHours: 7 }) !== r.isRecordedDay({ sleepHours: 7 }),
    "★★2つは 別の答えを 返す（★1つに していない）");
  // ★★書いてあるか を 見るときは readRaw（★注記も 位置のうち）。
  //   ★readCode は 注記を 外すので、★注記の 文は 見つかりません。
  t(/1つに しないこと/.test(readRaw("lib", "recordedDay.js")), "★1つにしない、と 書いてある");
  // ★★呼んでいないか を 見るときは readCode（★注記の中の 名前を 拾わないため）。
  t(!/hasAnyRecord\(/.test(readCode("lib", "recordedDay.js")), "★てんの判定を 呼んでいない");

  console.log("\n=== ⑥ 門の中だけ ===");
  const vt = readRaw("components", "VocalTracker.jsx");
  t(/layoutV2 \? countRecordedDays\(entries\) : Object\.keys\(entries\)\.length/.test(vt),
    "★門の外では、これまでどおりの 数え方");
  // ★★門（layoutV2）が、★使う所より 前に 立っていること
  const gateAt = vt.indexOf("const layoutV2 = mayUseLayoutV2");
  const useAt = vt.indexOf("const analysisDaysTotal");
  t(gateAt > 0 && useAt > 0 && gateAt < useAt,
    "★★門の宣言が、使う所より 前にある（★const は 巻き上がらない）");
  // ★てん・箱2・お尋ねは、★広いほうの ままであること
  t(/box2Rounds\(recordedDaysTotal\)/.test(vt), "★箱2は 広いほうのまま（★取り上げない）");
  t(/recordedDaysTotal >= 7 && !profile\.survey_day7_shown_at/.test(vt), "★7日目のお尋ねも 広いほう");

  console.log(ng === 0 ? `\n✅ 全て通りました  成功:${ok} 失敗:0` : `\n❌ 失敗あり  成功:${ok} 失敗:${ng}`);
  process.exit(ng > 0 ? 1 : 0);
})();
