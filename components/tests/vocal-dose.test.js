#!/usr/bin/env node
/**
 * 発声量（vocal dose）のテスト。統合実行ルートv4 G2-10.5 ／ 改善タスクv2 §3-1。
 *
 * ★受け入れ条件（改善タスクv2 §3-1）
 *   ・受診用サマリーの「1日あたりの平均発声時間」「声の使用量（週あたり）」に
 *     実データが入ること
 *   ・中量版（音圧サンプリング）がオフでも、記録と表示が成立すること
 *
 * ★ここで守っていること
 *   1. 実測と推定を混ぜない。混ぜたら、どちらか分かるようにして返す
 *   2. 二重に数えない（発話業務のセッションと nonPerformanceSpeechMinutes）
 *   3. 押し忘れたセッションを、そのまま何時間も保存しない
 */
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..", "..");
let passCount = 0, failCount = 0;
function assertEqual(a, b, label) {
  if (JSON.stringify(a) === JSON.stringify(b)) { console.log(`  ✓ ${label}`); passCount++; }
  else { console.log(`  ✗ ${label}  期待:${JSON.stringify(b)} 実際:${JSON.stringify(a)}`); failCount++; }
}
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

async function main() {
  const src = fs.readFileSync(path.join(ROOT, "lib", "vocalDose.js"), "utf-8");
  const m = await import("data:text/javascript;base64," + Buffer.from(src, "utf-8").toString("base64"));
  const ui = fs.readFileSync(path.join(ROOT, "components", "VocalTracker.jsx"), "utf-8");

  console.log("=== テスト1: 重みが、既存の計算と食い違っていない ===");
  // ★同じ決定が2か所にあると、片方だけ直る。値が一致していることを機械的に見る。
  const legacy = (ui.match(/const ACTIVITY_LOAD_WEIGHT = \{([^}]*)\}/) || [])[1] || "";
  ["休養", "自主練習", "レッスン", "リハーサル", "本番"].forEach((k) => {
    const mm = legacy.match(new RegExp(`"${k}":\\s*([\\d.]+)`));
    assertTrue(!!mm, `既存側に ${k} の重みがある`);
    if (mm) assertEqual(m.VOCAL_LOAD_WEIGHT[k], Number(mm[1]), `${k} の重みが一致（${mm[1]}）`);
  });
  assertEqual(m.VOCAL_LOAD_WEIGHT["発話業務"], 1.0,
    "発話業務は 1.0（既存の nonPerformanceSpeechMinutes と同じ係数）");

  console.log("\n=== テスト2: ★分が空の活動を、負荷0にしない ===");
  console.log("     「レッスンに行った」日が、声を1分も使わなかった日と同じ扱いだった。");
  const empty = m.activityMinutes({ kind: "レッスン", minutes: "" });
  assertTrue(empty.minutes > 0, "分が空でも、種別から推定した時間が入る");
  assertEqual(empty.isEstimated, true, "★推定であることが分かる");
  const typed = m.activityMinutes({ kind: "レッスン", minutes: 45 });
  assertEqual(typed.minutes, 45, "入力があればその値");
  assertEqual(typed.isEstimated, false, "★実測（本人の申告）は推定に混ぜない");
  assertEqual(m.activityMinutes({ kind: "レッスン", minutes: 0 }).isEstimated, true, "0分は未入力とみなす");
  assertEqual(m.activityMinutes({ kind: "知らない種別", minutes: "" }).minutes, 0, "知らない種別は推定しない");
  assertEqual(m.activityMinutes(null).minutes, 0, "空でも壊れない");

  console.log("\n=== テスト3: 1日の合計と、その内訳 ===");
  const day = m.dayVocalDose({ activities: [
    { kind: "自主練習", minutes: 30 }, { kind: "レッスン", minutes: 60 }, { kind: "本番", minutes: "" }
  ] });
  assertEqual(day.measuredMinutes, 90, "実測は90分");
  assertEqual(day.estimatedMinutes, 90, "本番は推定90分");
  assertEqual(day.totalMinutes, 180, "合計180分");
  assertEqual(day.isEstimated, true, "★推定がまざっていることが分かる");
  assertEqual(day.byKind, { "自主練習": 30, "レッスン": 60, "本番": 90 }, "種別ごとの内訳");
  assertEqual(day.sessionCount, 3, "セッション数");
  const allMeasured = m.dayVocalDose({ activities: [{ kind: "レッスン", minutes: 60 }] });
  assertEqual(allMeasured.isEstimated, false, "全部実測なら、推定の印は付かない");

  console.log("\n=== テスト4: ★発話業務を二重に数えない ===");
  const both = m.dayVocalDose({
    activities: [{ kind: "発話業務", minutes: 120 }],
    nonPerformanceSpeechMinutes: 90
  });
  assertEqual(both.totalMinutes, 120, "★セッションがある日は、旧項目を足さない（120であって210ではない）");
  const onlyOld = m.dayVocalDose({ activities: [], nonPerformanceSpeechMinutes: 90 });
  assertEqual(onlyOld.totalMinutes, 90, "セッションが無ければ、旧項目をそのまま使う");
  assertEqual(onlyOld.isEstimated, false, "分単位の実測なので、推定ではない");
  const oldLevel = m.dayVocalDose({ activities: [], speakingLevel: 2 });
  assertEqual(oldLevel.totalMinutes, 45, "さらに古い3択（2）は45分の概算");
  assertEqual(oldLevel.isEstimated, true, "★3択からの概算は推定");
  const prefersMinutes = m.dayVocalDose({ activities: [], nonPerformanceSpeechMinutes: 30, speakingLevel: 3 });
  assertEqual(prefersMinutes.totalMinutes, 30, "分の実測があれば、3択は使わない");

  console.log("\n=== テスト5: ★押し忘れたセッションを、そのまま保存しない ===");
  console.log("     いつ終わったか分からないものを、分かっているように保存しない。");
  assertEqual(m.reviewSession(45).action, "save", "45分はそのまま保存");
  assertEqual(m.reviewSession(0).action, "discard", "0分は誤タップとして捨てる");
  assertEqual(m.reviewSession(m.SESSION_MAX_MINUTES + 1).action, "confirm",
    `★${m.SESSION_MAX_MINUTES}分を超えたら、本人に確認する`);
  assertEqual(m.reviewSession(m.SESSION_MAX_MINUTES).action, "save", "境界ちょうどは保存");
  assertEqual(m.elapsedMinutes(1000, 1000 + 90 * 60000), 90, "経過分を数えられる");
  assertEqual(m.elapsedMinutes(2000, 1000), 0, "時計が巻き戻っても負にならない");
  assertEqual(m.elapsedMinutes(null, 1000), 0, "開始していなければ0");

  console.log("\n=== テスト6: 週あたりの合計（受診用サマリーが使う） ===");
  const weekStartOf = (d) => {
    const dt = new Date(d + "T00:00:00");
    dt.setDate(dt.getDate() - dt.getDay());
    return dt.toISOString().slice(0, 10);
  };
  const entries = {
    "2026-08-24": { activities: [{ kind: "レッスン", minutes: 60 }] },
    "2026-08-25": { activities: [{ kind: "自主練習", minutes: 120 }] },
    "2026-08-31": { activities: [{ kind: "本番", minutes: "" }] }
  };
  const weeks = m.weeklyVocalDose(entries, null, null, weekStartOf);
  assertEqual(weeks.length, 2, "2週分");
  assertEqual(weeks[0].hours, 3, "1週目は3時間");
  assertEqual(weeks[0].isEstimated, false, "1週目は全部実測");
  assertEqual(weeks[1].isEstimated, true, "★2週目は推定がまざっている");
  assertTrue(m.weeklyVocalDose({}, null, null, weekStartOf).length === 0, "記録が無くても壊れない");

  console.log("\n=== テスト7: ★中量版（音圧サンプリング）に依存していない ===");
  console.log("     v4 §10 で凍結されている機能なので、前提にしてはいけない。");
  assertTrue(!/音圧|sampling|マイク|microphone|getUserMedia/i.test(src),
    "軽量版だけで完結している（マイクを使わない）");
  assertTrue(m.dayVocalDose({ activities: [{ kind: "レッスン", minutes: 60 }] }).totalMinutes === 60,
    "オフのままでも発声時間が出る（受け入れ条件2）");

  console.log("\n=== テスト8: 種別が5つそろっている（改善タスクv2 §3-1） ===");
  ["自主練習", "レッスン", "リハーサル", "本番", "発話業務"].forEach((k) =>
    assertTrue(m.VOCAL_SESSION_KINDS.includes(k), `${k} がある`));
  assertTrue(!m.VOCAL_SESSION_KINDS.includes("休養"),
    "休養は含めない（recovery 側で扱う既存の設計を壊さない）");

  console.log(`\n合計: ${passCount}件成功 / ${failCount}件失敗`);
  if (failCount > 0) { console.log("\n⚠ 失敗があります。"); process.exit(1); }
  console.log("\n✓ すべて成功しました。");
}
main().catch((e) => { console.error(e); process.exit(1); });
