#!/usr/bin/env node
/**
 * 1回だけ出す知らせの仕組み（2026-08-31）
 *
 * ★なぜ汎用にしたか
 *   これまでは知らせを1つ足すたびに profiles へ列を1本足していました。
 *   列を足すたびに移行が要り、そのたびに「コードは出たが SQL はまだ」の
 *   窓が開きます。2026-08-30 に、その窓で本番の保存が2回止まりました。
 *   user_notices に1行入れる形なら、知らせが増えても列は増えません。
 *
 * ★守りたいこと
 *   ① 読めていないときは出さない（既読にできず、毎回出るため）
 *   ② 一度既読にしたら、二度と出ない
 *   ③ すでに文字を大きくしている人には出さない
 *   ④ 文字の大きさと、かんたん表示を、1つの操作で同時に変えない
 */
const { readCode, readRaw } = require("./_source");
let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }
function eq(a, b, label) { assertTrue(JSON.stringify(a) === JSON.stringify(b), `${label}（${JSON.stringify(a)}）`); }

const vt = readCode("components", "VocalTracker.jsx");

(async () => {
  const n = await import("../../lib/notices.js");
  const d = await import("../../lib/displayPrefs.js");

  console.log("=== ★① 読めていないときは出さない（フェイルクローズ） ===");
  assertTrue(n.shouldShowNotice(null, "displayScaleHint") === false,
    "★state が null なら出さない（表がまだ無い環境）");
  assertTrue(n.shouldShowNotice(undefined, "displayScaleHint") === false, "undefined でも出さない");
  assertTrue(n.shouldShowNotice({}, "しらない鍵") === false, "★知らない鍵では出さない");

  console.log("\n=== ★② 一度既読にしたら出ない ===");
  assertTrue(n.shouldShowNotice({}, "displayScaleHint") === true, "未読なら出す");
  const after = n.withNoticeShown({}, "displayScaleHint", "2026-08-31T00:00:00Z");
  assertTrue(n.shouldShowNotice(after, "displayScaleHint") === false, "★既読なら出さない");
  eq(n.withNoticeShown({}, "しらない鍵", "t"), {}, "知らない鍵は記録しない");
  // 元の state を壊さない
  const orig = {};
  n.withNoticeShown(orig, "displayScaleHint", "t");
  eq(orig, {}, "★元の state を書き換えない");

  console.log("\n=== 行から状態を作る ===");
  eq(n.noticeStateFromRows([{ notice_key: "displayScaleHint", shown_at: "t" }]),
    { displayScaleHint: "t" }, "行を状態に変換できる");
  eq(n.noticeStateFromRows(null), {}, "★null でも {} を返す（出さない state ではない）");
  eq(n.noticeStateFromRows([{ notice_key: "しらない鍵", shown_at: "t" }]), {},
    "★知らない鍵は取り込まない");

  console.log("\n=== ★③ すでに大きくしている人には出さない ===");
  assertTrue(/normalizeScale\(profile\.display_scale\) === DEFAULT_SCALE/.test(vt),
    "★既定の大きさのときだけ出している");

  console.log("\n=== ★④ 文字の大きさと、かんたん表示を混ぜない ===");
  // lib の決まり：片方を選んだらもう片方も変わる、を作らない
  const prefs = readCode("lib", "displayPrefs.js");
  assertTrue(/文字の大きさとは独立/.test(readRaw("lib", "displayPrefs.js")),
    "独立という決まりが書かれている");
  const notice = vt.slice(vt.indexOf('shouldShowNotice(noticeState, "displayScaleHint")'),
                          vt.indexOf('shouldShowNotice(noticeState, "displayScaleHint")') + 2200);
  assertTrue(/display_scale: "large"/.test(notice), "文字を大きくするボタンがある");
  assertTrue(/simple_display: true/.test(notice), "かんたん表示にするボタンがある");
  // ★1つの onClick で両方を変えていないこと
  assertTrue(!/display_scale: "large"[\s\S]{0,120}simple_display: true/.test(notice),
    "★1回の操作で、両方を同時に変えていない");
  assertTrue(/閉じる/.test(notice), "何もせず閉じられる");

  console.log("\n=== 戻せること（設定に両方ある） ===");
  assertTrue(/simple_display: !isSimpleDisplay\(profile\)/.test(vt),
    "★かんたん表示は設定でオフに戻せる");
  assertTrue(/handleSaveDisplayPref\(\{ display_scale: s \}\)/.test(vt),
    "★文字の大きさは設定で3段階から選び直せる");
  eq(d.SCALES, ["normal", "large", "xlarge"], "大きさは3段階");

  console.log("\n=== 表と鍵 ===");
  const mig = readRaw("supabase", "migration_user_notices.sql");
  assertTrue(/primary key \(user_id, notice_key\)/.test(mig), "★同じ知らせは2回入らない（主キー）");
  assertTrue(/enable row level security/.test(mig), "RLS が入っている");
  assertTrue(!/for update|for delete/i.test(mig), "★既読の記録を消す道を作っていない");
  assertTrue(/auth\.uid\(\) = user_id/.test(mig), "★本人だけ");

  console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
  process.exit(failCount === 0 ? 0 : 1);
})();
