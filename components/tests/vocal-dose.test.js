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

  console.log("=== テスト1: ★重みの表は、1つだけ ===");
  // ★2026-09-01 まで、同じ表が2か所にありました。
  //   VocalTracker 側に発話業務が無く、★中身が食い違っていました。
  //   representativeActivityKind がそちらを見ていたため、
  //   2時間の発話業務が10分の自主練習に負けていました。
  //   → いまは lib/vocalDose.js の VOCAL_LOAD_WEIGHT だけが正です。
  assertTrue(!/const ACTIVITY_LOAD_WEIGHT = \{ *"/.test(ui),
    "★VocalTracker が、重みの表を書き写していない");
  assertTrue(/const ACTIVITY_LOAD_WEIGHT = VOCAL_LOAD_WEIGHT/.test(ui),
    "★import して使っている（値を書き写さない）");
  ["休養", "自主練習", "レッスン", "リハーサル", "本番", "発話業務"].forEach((k) => {
    assertTrue(typeof m.VOCAL_LOAD_WEIGHT[k] === "number", `${k} の重みが1か所にある`);
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

  console.log("\n=== テスト9: ★ACWR に渡す前の補完（式は変えない） ===");
  // VocalTracker.jsx の withEstimatedMinutes を、本物のソースから取り出して動かす。
  const start = ui.indexOf("function withEstimatedMinutes(entry) {");
  assertTrue(start > 0, "withEstimatedMinutes が VocalTracker.jsx にある");
  let depth = 0, i = ui.indexOf("{", start), end = -1;
  for (; i < ui.length; i++) {
    if (ui[i] === "{") depth++;
    else if (ui[i] === "}") { depth--; if (depth === 0) { end = i + 1; break; } }
  }
  // eslint-disable-next-line no-new-func
  const withEstimatedMinutes = new Function("activityMinutes",
    `${ui.slice(start, end)}\nreturn withEstimatedMinutes;`)(m.activityMinutes);

  const blank = withEstimatedMinutes({ activities: [{ kind: "レッスン", minutes: "" }] });
  assertEqual(blank.usedEstimate, true, "★分が空なら、補ったことを申告する");
  assertEqual(blank.entry.activities[0].minutes, 60, "レッスンは60分として式に渡す");
  const filled = withEstimatedMinutes({ activities: [{ kind: "レッスン", minutes: 45 }] });
  assertEqual(filled.usedEstimate, false, "入力があれば補わない");
  assertEqual(filled.entry.activities[0].minutes, 45, "値もそのまま");
  const none = withEstimatedMinutes({ activities: [] });
  assertEqual(none.usedEstimate, false, "活動が無い日は補わない（休養日を練習日にしない）");
  assertEqual(withEstimatedMinutes(null).usedEstimate, false, "空でも壊れない");
  // ★元のオブジェクトを書き換えないこと。entries は画面の状態そのもの。
  const original = { activities: [{ kind: "本番", minutes: "" }] };
  withEstimatedMinutes(original);
  assertEqual(original.activities[0].minutes, "", "★元の記録を書き換えていない（保存される値は変わらない）");

  console.log("\n=== テスト10: ★受診用サマリーに推定を混ぜない ===");
  console.log("     お医者さんが読む紙に、こちらが補った値を実測のように載せない。");
  assertTrue(/dayVocalDose\(e\)\.measuredMinutes/.test(ui),
    "★受診用サマリーは measuredMinutes だけを使っている");
  const mixed = m.dayVocalDose({ activities: [{ kind: "レッスン", minutes: 45 }, { kind: "本番", minutes: "" }] });
  assertEqual(mixed.measuredMinutes, 45, "実測は45分だけ");
  assertEqual(mixed.totalMinutes, 135, "内部の合計には推定も入る（ACWR用）");

  console.log("\n=== テスト11: ★推定の日をグラフで区別している（受け入れ条件） ===");
  console.log("     実測と推定を、同じ点で描いてはいけない。");
  assertTrue(/isEstimated: !!acwrSeries\[d\]\.isEstimated/.test(ui),
    "グラフのデータが、推定かどうかを持っている");
  assertTrue(/payload\.isEstimated/.test(ui), "★点の描き分けに使っている");
  assertTrue(/acwrEstimatedDays/.test(ui), "推定に頼った日数を数えている");
  assertTrue(/acwrEstimatedDays > 0 &&/.test(ui), "★0日なら注記を出さない");
  assertTrue(/種別ごとの目安の時間で計算しています/.test(ui),
    "★補った値であることを、本人に伝えている");
  // ★色ではなく形で区別すること。ゾーンの色（gold/sage/curtain）と衝突する。
  const dotBlock = ui.slice(ui.indexOf("dot={(props) =>"), ui.indexOf("dot={(props) =>") + 500);
  assertTrue(!/C\.gold|C\.sage|C\.rust|C\.curtain/.test(dotBlock),
    "★点の描き分けに色を使っていない（ゾーンの色と衝突するため）");
  assertTrue(/fill=\{C\.card\}/.test(dotBlock), "推定の日は白抜きの点");

  console.log("\n=== テスト12: ACWR の式に手を入れていない ===");
  assertTrue(/const lambdaA = 2 \/ \(7 \+ 1\)/.test(ui), "★λA = 2/(7+1) のまま");
  assertTrue(/const lambdaC = 2 \/ \(28 \+ 1\)/.test(ui), "★λC = 2/(28+1) のまま");
  assertTrue(/A = A == null \? L : lambdaA \* L \+ \(1 - lambdaA\) \* A/.test(ui), "★EWMA の式がそのまま");
  assertTrue(/C = C == null \? L : lambdaC \* L \+ \(1 - lambdaC\) \* C/.test(ui), "★EWMA の式がそのまま");
  assertTrue(/acwr: C > 0 \? A \/ C : null/.test(ui), "★比の取り方もそのまま");

  console.log("\n=== テスト13: ★過去も含めて同じ規則で計算する（坂本さんの判断・案A） ===");
  console.log("     ポイントとは扱いが違う。理由まで含めてここに残す。");
  // 影響のあった日は実データで4日だけでした（③の集計）。
  // 過去だけ別の規則にすると、グラフの途中で同じ活動が別の意味になり、
  // ACWR がいちばん見せたい「前後のつながり」が読めなくなります。
  const est = ui.slice(ui.indexOf("function withEstimatedMinutes"), ui.indexOf("function withEstimatedMinutes") + 1200);
  assertTrue(!/\d{4}-\d{2}-\d{2}/.test(est), "★推定の適用に、切り替え日を入れていない");
  assertTrue(!/_FROM\b/.test(est), "★「この日から」という定数を使っていない");
  const seriesStart = ui.indexOf("const acwrSeries = useMemo");
  const seriesBlock = ui.slice(seriesStart, seriesStart + 1800);
  assertTrue(!/\d{4}-\d{2}-\d{2}/.test(seriesBlock), "★ACWR 系列の側にも切り替え日が無い");
  // ★ポイントの側には、意図的に切り替え日があります。
  //   ポイントは「本人が貯めた残高」なので、過去分を作り直すと取り上げになる。
  //   ACWR は「その場で計算して見せている値」で、誰も何も貯めていない。
  //   だから扱いが違う。この違いを消さないこと。
  const character = fs.readFileSync(path.join(ROOT, "lib", "character.js"), "utf-8");
  assertTrue(/POINTS_RULE_V2_FROM/.test(character),
    "ポイントの側には切り替え日がある（貯めた残高を動かさないため）");

  console.log(`\n合計: ${passCount}件成功 / ${failCount}件失敗`);
  if (failCount > 0) { console.log("\n⚠ 失敗があります。"); process.exit(1); }
  console.log("\n✓ すべて成功しました。");
}
main().catch((e) => { console.error(e); process.exit(1); });
