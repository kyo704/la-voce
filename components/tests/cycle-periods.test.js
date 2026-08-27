#!/usr/bin/env node
/**
 * 周期の記録（周期記録の設計.md §2・§3・§5・§6）のテスト。
 *
 * ★いちばん守りたいのは §2（教師に見せない）と §6-2（リアルタイムの位相を出さない）。
 *   前者は漏れると取り返しがつかず、後者は「必ず外れる予測」をラベルとして
 *   貼ってしまう。どちらも、あとから直せば済む種類の問題ではない。
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

const P = (start, end) => ({ id: start, start_date: start, end_date: end || null });

async function main() {
  const src = fs.readFileSync(path.join(ROOT, "lib", "cyclePeriods.js"), "utf-8");
  const m = await import("data:text/javascript;base64," + Buffer.from(src, "utf-8").toString("base64"));
  // 禁止語の検査は、コードだけを対象にする。コメントには「こう言わないこと」という
  // 説明として、その語自体が出てくるため。
  const code = src.replace(/\/\*[\s\S]*?\*\//g, "").split("\n").filter((l) => !l.trim().startsWith("//")).join("\n");
  const sqlRaw = fs.readFileSync(path.join(ROOT, "supabase", "migration_cycle_periods.sql"), "utf-8");
  // SQLも、コメント（「〜を作らない」という説明）を除いてから検査する。
  const sql = sqlRaw.split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
  const rpc = fs.readFileSync(path.join(ROOT, "supabase", "migration_teacher_student_entries_rpc.sql"), "utf-8");
  const exportSrc = fs.readFileSync(path.join(ROOT, "lib", "exportData.js"), "utf-8");
  const delSrc = fs.readFileSync(path.join(ROOT, "lib", "accountDeletion.js"), "utf-8");

  console.log("=== テスト1: ★教師に見せない（§2・§3-4） ===");
  assertTrue(!/cycle_periods/.test(rpc), "教師向けRPCが cycle_periods を一切参照していない");
  assertTrue(/enable row level security/.test(sql), "RLSが有効になっている");
  assertTrue(/auth\.uid\(\) = user_id/.test(sql), "本人だけが読み書きできる");
  const policies = (sql.match(/create policy/g) || []).length;
  assertEqual(policies, 1, "ポリシーは1つだけ（教師・管理者向けを作っていない）");
  assertTrue(!/security definer/i.test(sql), "SECURITY DEFINER 関数を作っていない");

  console.log("\n=== テスト2: 本人の持ち出しと削除には必ず含める ===");
  assertTrue(/cycle_periods/.test(exportSrc), "書き出しの対象に入っている");
  assertTrue(/cycle_periods/.test(delSrc), "アカウント削除の対象に入っている");

  console.log("\n=== テスト3: ★日数を保存しない（§3-1） ===");
  assertTrue(!/day_index|cycle_length|bleeding_days/.test(sql), "導出できる日数を列として持っていない");
  assertTrue(/start_date date not null/.test(sql), "保存するのは開始日");
  assertTrue(/end_date date\b/.test(sql), "終了日は任意");

  console.log("\n=== テスト4: 入力の検証（§3-2） ===");
  const list = [P("2026-08-01", "2026-08-05")];
  assertEqual(m.validateNewStart("2026-09-01", list, "2026-08-27"), "startInFuture", "開始日を未来にできない");
  assertEqual(m.validateNewStart("2026-08-01", list, "2026-08-27"), "duplicateStart", "同じ日に2つ作れない");
  assertEqual(m.validateNewStart("2026-08-03", list, "2026-08-27"), "overlapping", "期間どうしが重ならない");
  assertEqual(m.validateNewStart("2026-08-27", list, "2026-08-27"), null, "今日は開始日にできる");
  assertEqual(m.validateEnd("2026-07-31", "2026-08-01", "2026-08-27"), "endBeforeStart", "終了日が開始日より前は不可");
  assertEqual(m.validateEnd("2026-09-30", "2026-08-01", "2026-08-27"), "endInFuture", "終了日を未来にできない");

  console.log("\n=== テスト5: ホームの1行（§4-1） ===");
  assertEqual(m.currentCycleState([], "2026-08-27").state, "none", "記録が無ければ何も出さない");
  assertEqual(m.currentCycleState([P("2026-08-25")], "2026-08-27"),
    { state: "bleeding", dayIndex: 3, periodId: "2026-08-25", startDate: "2026-08-25" }, "出血中は「生理3日目」");
  assertEqual(m.currentCycleState([P("2026-08-25", "2026-08-29")], "2026-08-27").state, "bleeding", "終了日より前なら出血中");
  const after = m.currentCycleState([P("2026-08-01", "2026-08-05")], "2026-08-12");
  assertEqual([after.state, after.dayIndex], ["cycle", 12], "出血後は「周期12日目」");

  console.log("\n=== テスト6: 4つの数字（§5-2） ===");
  const few = m.cycleSummary([P("2026-07-01", "2026-07-05"), P("2026-08-01", "2026-08-05")], "2026-08-27");
  assertEqual(few.enough, false, "周期が3回に満たなければ平均を出さない");
  assertEqual(few.needMore, 2, "あと何回で出せるかを返す");
  assertEqual(few.averageCycle, null, "平均は出さない");
  const many = m.cycleSummary([
    P("2026-04-01", "2026-04-05"), P("2026-04-30", "2026-05-04"),
    P("2026-05-29", "2026-06-02"), P("2026-06-27", "2026-07-01")
  ], "2026-08-27");
  assertEqual(many.enough, true, "3回そろえば出す");
  assertEqual(many.averageCycle, 29, "平均周期は29日");
  assertEqual(many.averageBleeding, 5, "出血日数の平均は5日");
  assertEqual(many.nextEstimate, "2026-07-26", "次回の目安＝直近の開始日＋平均");

  console.log("\n=== テスト7: ★異常値は除外するが、評価しない（§3-3） ===");
  const withOutlier = m.cycleSummary([
    P("2026-01-01"), P("2026-01-05"),            // 4日 → 短すぎるので除外
    P("2026-02-03"), P("2026-03-04"), P("2026-04-02")
  ], "2026-08-27");
  assertTrue(withOutlier.usedCycles < withOutlier.totalCycles, "短すぎる周期を平均から外している");
  assertTrue(!/短すぎ|長すぎ|異常|乱れ|不順/.test(code), "「短すぎ」「異常」「乱れ」等の語をコードに持っていない");

  console.log("\n=== テスト8: ★リアルタイムの位相を出さない（§6-2） ===");
  assertTrue(!/卵胞|黄体|follicular|luteal|排卵|ovulation/i.test(code),
    "卵胞期・黄体期・排卵といった位相の語がコードに無い");
  assertTrue(!/予測|predict/i.test(code), "「予測」と言い切っていない（目安のみ）");

  console.log("\n=== テスト9: カレンダーの帯（§5-1） ===");
  const days = m.buildBleedingDayset([P("2026-08-01", "2026-08-03")], "2026-08-27");
  assertEqual([...days].sort(), ["2026-08-01", "2026-08-02", "2026-08-03"], "開始日から終了日までを塗る");
  const open = m.buildBleedingDayset([P("2026-08-25")], "2026-08-27");
  assertEqual([...open].sort(), ["2026-08-25", "2026-08-26", "2026-08-27"], "終了日が無ければ今日まで");
  const forgotten = m.buildBleedingDayset([P("2026-01-01")], "2026-08-27");
  assertTrue(forgotten.size <= 14, `押し忘れても塗りすぎない（${forgotten.size}日で止まる）`);
  // ★「終わった」の押し忘れ。次の周期が始まっているなら、いつ終わったかは
  //   分からない。分からない日を塗って、知っているように見せない。
  const closed = m.buildBleedingDayset([P("2026-08-01"), P("2026-08-10")], "2026-08-27");
  assertTrue(closed.has("2026-08-01"), "押し忘れた周期も、開始日は塗る");
  assertTrue(!closed.has("2026-08-05"), "終わった日が分からない周期を、勝手に塗り広げない");
  assertTrue(closed.has("2026-08-10"), "進行中の周期は今日まで塗る");

  // =========================================================================
  // ここから画面側（§4・§5）。VocalTracker.jsx を本文として読んで検査する。
  // =========================================================================
  const uiRaw = fs.readFileSync(path.join(ROOT, "components", "VocalTracker.jsx"), "utf-8");
  // 該当のブロックだけを切り出す。コメントには「色を付けない」といった説明として
  // 禁止側の語が出てくるので、まずコメントを外す。
  function stripComments(t) {
    return t.replace(/\{\/\*[\s\S]*?\*\/\}/g, "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  }
  function sliceBetween(text, startMark, endMark) {
    const a = text.indexOf(startMark);
    if (a < 0) throw new Error(`見つかりません: ${startMark}`);
    const b = text.indexOf(endMark, a);
    return text.slice(a, b < 0 ? text.length : b);
  }
  const homeRow = stripComments(sliceBetween(uiRaw, "{cycleEnabled && cycleShowOnHome && (", "{cycleEnabled && cycleShowOnHome && cycleError"));
  const statsCard = stripComments(sliceBetween(uiRaw, "{cycleEnabled && cycleStats && (", "<div className=\"space-y-3\">"));
  const tokens = fs.readFileSync(path.join(ROOT, "lib", "tokens.js"), "utf-8");

  console.log("\n=== テスト10: ★ホームの1行を目立たせない（§4-2・この文書で最も重要） ===");
  console.log("     電車の中で、隣の人に見えます。");
  assertTrue(!/C\.curtain|C\.gold|C\.rust|C\.sage|#[0-9a-fA-F]{3,6}/.test(homeRow),
    "★色を付けていない（日付の行と同じ C.inkSoft のみ）");
  assertTrue(/C\.inkSoft/.test(homeRow), "文字色は他の行と同じ C.inkSoft");
  assertTrue(!/<(Droplets|HeartPulse|Sparkles|CalendarDays|Moon|Droplet)\b/.test(homeRow),
    "★アイコンを付けていない");
  assertTrue(!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(homeRow), "★絵文字を付けていない");
  assertTrue(!/text-(sm|base|lg|xl|2xl)\b/.test(homeRow), "★フォントサイズを大きくしていない（text-xs のまま）");
  assertTrue(!/font-(medium|semibold|bold)/.test(homeRow), "★太字にしていない");
  assertTrue(!/rounded-2xl|border|background:\s*C\.card/.test(homeRow),
    "★カードにしていない・背景色を変えていない");

  console.log("\n=== テスト11: ホームの表示（§4-1） ===");
  assertTrue(/生理 \$\{cycleState\.dayIndex\}日目/.test(homeRow), "出血中は「生理 ◯日目」");
  assertTrue(/周期 \$\{cycleState\.dayIndex\}日目/.test(homeRow), "出血後は「周期 ◯日目」");
  assertTrue(/終わった/.test(homeRow), "「終わった」を押せる");
  assertEqual(m.currentCycleState([P("2026-08-25")], "2026-08-27").state, "bleeding", "終了日が無ければ出血中");
  assertEqual(m.currentCycleState([P("2026-08-01", "2026-08-05")], "2026-08-12").state, "cycle", "終了後は周期");
  assertEqual(m.currentCycleState([P("2026-08-01", "2026-08-05")], "2026-08-12").dayIndex, 12, "周期の日数は開始日から数える");

  console.log("\n=== テスト12: ★カレンダーの下は4つだけ（§5-2） ===");
  ["平均周期", "ばらつき", "出血日数", "次回の目安"].forEach((label) => {
    assertTrue(statsCard.includes(label), `${label} がある`);
  });
  const rowCount = (statsCard.match(/flex items-center justify-between text-xs/g) || []).length;
  assertEqual(rowCount, 4, "★4つだけ（5つ目を足していない）");
  assertTrue(/日ごろ/.test(statsCard), "★次回は「ごろ」と書いている（§8 医療機器の線）");
  assertTrue(!/必ず|確実|です。$/m.test(statsCard), "言い切っていない");
  assertTrue(/あと\{cycleStats\.needMore\}回/.test(statsCard),
    "3回に満たないうちは平均を出さず、あと何回かを伝える");

  console.log("\n=== テスト13: 帯の色（§5-1） ===");
  assertTrue(/export const CYCLE_BAND/.test(tokens), "帯の色を tokens.js で1か所に決めている");
  const band = (tokens.match(/CYCLE_BAND\s*=\s*"(#[0-9a-fA-F]{6})"/) || [])[1];
  assertTrue(!!band, `帯の色が定義されている（${band}）`);
  if (band) {
    const r = parseInt(band.slice(1, 3), 16), g = parseInt(band.slice(3, 5), 16), b = parseInt(band.slice(5, 7), 16);
    assertTrue(!(r > g + 40 && r > b + 40), "★濃い赤・ピンクではない（赤成分が突出していない）");
    const levels = ["#7A1F2B", "#A8583F", "#B8863B", "#7C9A6B", "#4F7562"];
    assertTrue(!levels.includes(band.toUpperCase()), "★声の調子の5色と同じ色ではない");
  }

  console.log("\n=== テスト14: ★日数を1つも保存しない（§3-1） ===");
  const insertCols = (sql.match(/insert into public\.cycle_periods \(([^)]*)\)/) || [])[1] || "";
  assertTrue(!/day|days|length|count|日数/.test(insertCols), "移行の INSERT が日数を入れていない");
  const uiCycle = stripComments(uiRaw);
  assertTrue(!/cycle_periods[\s\S]{0,200}?(day_count|cycle_length|bleeding_days)/.test(uiCycle),
    "画面側も日数を書き込んでいない");

  console.log(`\n合計: ${passCount}件成功 / ${failCount}件失敗`);
  if (failCount > 0) { console.log("\n⚠ 失敗があります。"); process.exit(1); }
  console.log("\n✓ すべて成功しました。");
}
main().catch((e) => { console.error(e); process.exit(1); });
