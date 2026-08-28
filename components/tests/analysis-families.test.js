#!/usr/bin/env node
/**
 * 検定の族（分析の検出力と族の設計.md §1）。
 *
 * ★BH-FDR を族ごとに独立してかけるための土台です。
 *   全部を1つの族にしていたため、項目が増えるほど検出力が落ち、
 *   何も出なくなる方向に働いていました。
 *
 * ★3ゲート（件数・効果量・FDR）は変えていません。§6-1 のままです。
 *   変えるのは「何を検定するか」と「どう説明するか」だけです。
 */
const { readRaw, assertAbsent } = require("./_source");
let passCount = 0, failCount = 0;
function assertTrue(c, label) {
  if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; }
}
function assertEqual(a, b, label) {
  if (JSON.stringify(a) === JSON.stringify(b)) { console.log(`  ✓ ${label}`); passCount++; }
  else { console.log(`  ✗ ${label}  期待:${JSON.stringify(b)} 実際:${JSON.stringify(a)}`); failCount++; }
}

async function main() {
  const m = await import("data:text/javascript;base64," +
    Buffer.from(readRaw("lib", "analysisFamilies.js"), "utf-8").toString("base64"));

  console.log("\n=== 族の分け方 ===");
  assertEqual(m.CORE_FAMILY.length, 5, "中核は5項目（仕様どおり）");
  assertEqual(m.familyOf("sleepHours"), "core", "睡眠時間は中核");
  // ★もとは "cyclePhase"（位相）という名前だけを置いていた。実装するときに
  //   「在周期中かどうか」の二値へ変えたので、名前もそれに合わせてある。
  //   位相で区切らないのは、区切り方そのものが結論を作るため（§3-G と同じ理由）。
  assertEqual(m.familyOf("inCycle"), "cycle", "周期は別の族");
  assertEqual(m.familyOf("cyclePhase"), "explore", "★位相という項目は、もう持っていない");
  assertEqual(m.familyOf("refluxFlags"), "reflux", "食事と就寝は別の族");
  assertEqual(m.familyOf("weightKg"), "explore", "そのほかは探索族");
  console.log("     ★周期と食事と就寝を中核に混ぜない。使っている人だけの分析なので、");
  console.log("       中核族の検出力を下げてしまう（同書 §1-2）。");

  console.log("\n=== 探索族は検定しない ===");
  const grouped = m.groupByFamily([{ key: "sleepHours" }, { key: "cyclePhase" }, { key: "weightKg" }]);
  assertTrue(!JSON.stringify(grouped).includes("weightKg"),
    "★探索族が、検定の対象に入っていない（計算もしない）");
  assertEqual(m.mayStateFinding("sleepHours"), true, "中核は文章を出してよい");
  assertEqual(m.mayStateFinding("weightKg"), false, "★探索族は文章も数字も出さない");
  assertTrue(/まだ調べています/.test(m.EXPLORE_NOTE), "探索族には「まだ調べています」とだけ出す");

  console.log("\n=== 中核の値を、記録から取り出す ===");
  console.log("     ★同じ湿度50%でも、気温が違えば実際の水分量は違う。");
  const warm = m.absoluteHumidityOf(30, 50), cold = m.absoluteHumidityOf(5, 50);
  assertTrue(warm > cold * 3, `30℃50% は 5℃50% よりずっと湿っている（${warm.toFixed(1)} vs ${cold.toFixed(1)} g/m³）`);
  assertEqual(m.absoluteHumidityOf(null, 50), null, "気温が無ければ出さない");

  const e = { sleepHours: 7, nonPerformanceSpeechMinutes: 90, temperature: 20, humidity: 40, activities: [] };
  const v = m.coreFactorValues(e, { activities: [{ kind: "本番" }] });
  assertEqual(v.sleepHours, 7, "① 睡眠時間");
  assertEqual(v.offStageVoiceMinutes, 90, "② 本番外の発話時間");
  assertTrue(typeof v.absoluteHumidity === "number", "③ 絶対湿度（気温と湿度から導く）");
  assertEqual(v.dayAfterPerformance, 1, "④ 本番の翌日");
  assertEqual(m.coreFactorValues(e, { activities: [] }).dayAfterPerformance, 0, "④ 本番でない日の翌日");

  console.log("     ★『記録していない』を 0 で埋めないこと。");
  assertEqual(m.coreFactorValues(e, null).dayAfterPerformance, null,
    "★前日の記録が無ければ null（0 にしない。何もしなかった日と区別する）");
  assertEqual(m.coreFactorValues({}, null).sleepHours, null, "記録が無ければ null");
  assertEqual(m.coreFactorValues(e, null).morningEdema, null,
    "⑤ むくみは、まだ記録する場所が無いので常に null（作業中の状態 §5.14）");
  assertTrue(!m.availableCoreFactors().includes("morningEdema"),
    "★記録できないものを、検定できるものとして数えない");
  assertEqual(m.availableCoreFactors().length, 4, "いま検定できる中核は4項目");

  console.log("\n=== 二分の仕方 ===");
  const rows = [{ v: 1, y: 3 }, { v: 2, y: 4 }, { v: 3, y: 5 }, { v: 4, y: 2 }];
  const split = m.splitAtMedian(rows, (r) => r.v, (r) => r.y);
  assertEqual(split.median, 2.5, "中央値で分ける");
  assertEqual(split.low.length + split.high.length, 4, "全部がどちらかに入る");
  assertEqual(m.splitAtMedian([{ v: 1, y: 1 }], (r) => r.v, (r) => r.y), null,
    "件数が少なすぎるときは分けない");
  const bin = m.splitAtBinary([{ v: 1, y: 3 }, { v: 0, y: 4 }, { v: 1, y: 5 }, { v: 0, y: 2 }],
    (r) => r.v, (r) => r.y);
  assertEqual(bin.high.length, 2, "二値は 1 の群");
  assertEqual(bin.low.length, 2, "二値は 0 の群");

  console.log("\n=== 画面が、族ごとに補正しているか ===");
  {
    const ui = readRaw("components", "VocalTracker.jsx");
    console.log("     ★以前は FACTORS を全部まとめて1つの族として補正していた。");
    console.log("       項目が増えるほどしきい値が厳しくなり、何も出なくなる方向に働く。");
    assertTrue(/const fdrByKey = \{\};/.test(ui),
      "族ごとの結果を、項目ごとに持ち直している");
    assertTrue(/if \(fam === EXPLORE\) return;/.test(ui),
      "★探索族を、検定の対象から外している（計算もしない）");
    assertTrue(/\.filter\(\(r\) => mayStateFinding\(r\.key\)\)/.test(ui),
      "★文章を出してよいのは中核族だけ、という判定を通している");
    assertTrue(!/benjaminiHochberg\(withP\.map/.test(ui),
      "★全部まとめて補正する古い書き方が、残っていない");
    assertTrue(/Object\.values\(byFamily\)\.forEach/.test(ui),
      "族ごとに独立して補正をかけている");

    console.log("     ★3ゲートは変えていない。§6-1 のまま。");
    assertTrue(/evaluateGate\("correlation\.narrative"/.test(ui),
      "ゲートの判定は、これまでと同じ関数を通している");
  }

  console.log("\n=== 中核の群を組み立てる ===");
  {
    const entries = {};
    for (let i = 1; i <= 30; i += 1) {
      const d = `2026-08-${String(i).padStart(2, "0")}`;
      entries[d] = {
        sleepHours: 5 + (i % 2) * 3,
        nonPerformanceSpeechMinutes: (i % 3) * 40,
        temperature: 20, humidity: 30 + (i % 2) * 40,
        activities: i % 4 === 0 ? [{ kind: "本番" }] : [],
        throatCondition: 3 + (i % 2)
      };
    }
    const groups = m.buildCoreGroups(entries, (e) => (e && e.throatCondition));
    assertEqual(groups.length, 4, "記録できる中核4項目ぶんの群ができる");
    groups.forEach((g) => {
      assertTrue(g.split.high.length > 0 && g.split.low.length > 0,
        `${g.key} の両群に日が入っている`);
    });

    console.log("     ★ずらす日数は項目ごとに違う。ここで宣言し、画面に書かせない。");
    assertEqual(m.CORE_LAG_DAYS.sleepHours, 0, "睡眠時間はずらさない（その日の朝までの睡眠）");
    assertEqual(m.CORE_LAG_DAYS.offStageVoiceMinutes, 1,
      "★本番外の発話時間だけ1日ずらす（前日に話した分が翌日に出る）");
    assertEqual(m.CORE_LAG_DAYS.absoluteHumidity, 0, "絶対湿度はずらさない（その日の環境）");

    console.log("     ★原因の日の記録が無い日は、使わない。");
    const sparse = { "2026-08-01": entries["2026-08-01"], "2026-08-20": entries["2026-08-20"] };
    const few = m.buildCoreGroups(sparse, (e) => (e && e.throatCondition));
    assertTrue(few.length === 0, "日が少なすぎるときは、群を作らない");

    const bin = m.groupLabelsFor("dayAfterPerformance");
    assertEqual(bin.high, "その翌日", "二値の項目は、群の名前が変わる");
    assertTrue(/多い日/.test(m.groupLabelsFor("sleepHours").high), "二分の項目は、多い日／少ない日");
  }

  console.log("\n=== 画面が、中核の比較を出しているか ===");
  {
    const ui = readRaw("components", "VocalTracker.jsx");
    assertTrue(/const coreFindings = useMemo/.test(ui), "中核の比較を計算している");
    assertTrue(/buildCoreGroups\(filteredEntries/.test(ui), "群の作り方はモジュールに任せている");
    assertTrue(/benjaminiHochberg\(withStats\.map/.test(ui), "★BH は中核族の中だけでかけている");
    assertTrue(/gateAllows\("diet\.narrative"/.test(ui), "★3ゲートを通してから文章にしている");
    assertTrue(/GroupDotPlot values1=\{r\.values1\}/.test(ui), "★§3-E の点を全部描く図を使っている");
    assertTrue(/はっきりした関係は、まだ見えていません/.test(ui),
      "★通らなかったときは「見えなかった」と書く（「関係なし」と書かない）");
    assertTrue(/関係であって、原因ではありません/.test(ui), "関係であって原因ではない、と添えている");
    assertTrue(!/弱い関係があります/.test(ui), "★「弱い関係があります」と書いていない（§5 ③）");
  }

  console.log("\n=== 周期の族（★中核に混ぜない）===");
  {
    assertTrue(!m.CORE_FAMILY.includes(m.CYCLE_FACTOR),
      "★周期が中核に入っていない（使っている人だけの分析で、中核の検出力を下げるため）");
    assertEqual(m.familyOf(m.CYCLE_FACTOR), "cycle", "周期は独立した族");
    assertEqual(m.FAMILIES.cycle, ["inCycle"],
      "★位相ではなく「在周期中かどうか」の二値（区切り方が結論を作らないように）");

    const entries = {}; const days = new Set();
    for (let i = 1; i <= 24; i += 1) {
      const d = `2026-08-${String(i).padStart(2, "0")}`;
      entries[d] = { throatCondition: i % 6 < 3 ? 3 : 4 };
      if (i % 6 < 3) days.add(d);
    }
    const split = m.buildCycleGroups(entries, days, (e) => e && e.throatCondition);
    assertTrue(split.high.length > 0 && split.low.length > 0, "両群に日が入る");
    assertEqual(m.buildCycleGroups(entries, new Set(), (e) => e && e.throatCondition), null,
      "★周期の記録が無ければ、群を作らない");

    console.log("     ★片方の群にしかデータが無ければ、結果を出さない。");
    const allIn = new Set(Object.keys(entries));
    assertEqual(m.buildCycleGroups(entries, allIn, (e) => e && e.throatCondition), null,
      "★全部が期間内なら、比べる相手がいないので出さない");

    const ui = readRaw("components", "VocalTracker.jsx");
    console.log("     ★3ゲートは項目ごとにかける（族に1回ではない）。");
    assertTrue(/gateAllows\("diet\.narrative", \{\s*\n?\s*n1: cycleFindings\.n1/.test(ui),
      "周期にも、同じ3ゲートを個別にかけている");
    assertTrue(/cycleTrackingOn\(profile\)/.test(ui), "記録していない人には出さない");

    console.log("     ★中核の文章に混ぜない。別のカードに出す。");
    assertTrue(/cycleFindings && \(\(\) => \{/.test(ui), "周期は独立したカード");
    assertTrue(!/coreFindings.*cycleFindings|cycleFindings.*coreFindings/.test(
      ui.replace(/\n/g, " ").match(/const coreFindings[\s\S]{0,400}/)?.[0] || ""),
      "中核の計算に周期が混ざっていない");

    console.log("     ★位相の呼び名を使わない（周期記録の設計 §2）。");
    // ★assertAbsent を使う。中で readCode（コメントを外した本文）を読む。
    //   生の本文で数えると、禁止を書いたコメント側で落ちる。
    //   この取り違えは6回目で、しかも assertAbsent を作ったあとにやっている。
    //   使わなければ意味がない、という当たり前のことの実例。
    assertAbsent(["卵胞", "黄体", "排卵", "月経期"],
      ["components", "VocalTracker.jsx"], assertTrue, "★画面に");
  }

  console.log(`\n合計: ${passCount}件成功 / ${failCount}件失敗`);
  if (failCount > 0) { console.log("\n⚠ 失敗があります。"); process.exit(1); }
  console.log("\n✓ すべて成功しました。");
}
main().catch((e) => { console.error(e); process.exit(1); });
